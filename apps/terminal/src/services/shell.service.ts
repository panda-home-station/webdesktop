import { truenasApi } from '@truenas/api';
import { useAuthStore } from '@truenas/stores/auth';
import { authService } from '@truenas/services/auth';
import { environment } from '@src/environments/environment';

export interface ShellConnectedEvent {
  connected: boolean;
  id?: string;
}

export interface TerminalConnectionData {
  vm_id?: number;
  container_id?: number;
  use_console?: boolean;
  app_name?: string;
  command?: string;
}

type ShellOutputCallback = (data: ArrayBuffer | string) => void;
type ShellConnectedCallback = (event: ShellConnectedEvent) => void;

class ShellService {
  private ws: WebSocket | null = null;
  private shellOutputCallbacks: Set<ShellOutputCallback> = new Set();
  private shellConnectedCallbacks: Set<ShellConnectedCallback> = new Set();
  private isConnected = false;
  private connectionId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private checkConnectedTimer: ReturnType<typeof setInterval> | null = null;
  private encoder = new TextEncoder();
  private isConnecting = false;
  // Connection generation counter - incremented on each connect/disconnect cycle
  // Used to invalidate stale handlers from previous connections
  private connectionGeneration = 0;

  /**
   * Connect to the shell WebSocket endpoint
   * @param connectionData - Connection configuration (vm_id, container_id, etc.)
   * @param token - Optional one-time token. If not provided, gets from auth store.
   */
  async connect(connectionData: TerminalConnectionData = {}, token?: string): Promise<void> {
    // Prevent multiple simultaneous connections
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    // Capture current generation - handlers will check this to ensure they're still valid
    const thisGeneration = ++this.connectionGeneration;

    return new Promise((resolve, reject) => {
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        // Only reject if this is still the current generation and not connected
        if (thisGeneration === this.connectionGeneration && !this.isConnected) {
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      // Wait for any previous WebSocket to fully close before creating new one
      const doConnect = async () => {
        try {
          // Check if this connection is still valid (not superseded by newer connect)
          if (thisGeneration !== this.connectionGeneration) {
            return;
          }

          if (this.ws) {
            const oldWs = this.ws;
            await new Promise<void>((resolveClose) => {
              const handler = () => {
                oldWs.removeEventListener('close', handler);
                resolveClose();
              };
              oldWs.addEventListener('close', handler);
              const closeTimeout = setTimeout(() => {
                oldWs.removeEventListener('close', handler);
                resolveClose();
              }, 1000);
              oldWs.addEventListener('close', () => clearTimeout(closeTimeout), { once: true });
              oldWs.close();
            });
            if (this.ws === oldWs) {
              this.ws = null;
            }
            // Check if this connection was superseded while waiting
            if (thisGeneration !== this.connectionGeneration) {
              return;
            }
          }

          const authToken = token || useAuthStore.getState().token;
          if (!authToken) {
            console.error('No auth token available');
            this.isConnecting = false;
            clearTimeout(timeout);
            reject(new Error('No auth token'));
            return;
          }

          // Build the WebSocket URL directly to TrueNAS server
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const url = `${protocol}//${environment.remote}/websocket/shell/`;

          this.ws = new WebSocket(url);
          // Ensure we receive ArrayBuffer instead of Blob for binary data
          this.ws.binaryType = 'arraybuffer';

          this.ws.onopen = () => {
            // Check if this handler is still valid
            if (thisGeneration !== this.connectionGeneration) {
              return;
            }
            this.ws?.send(JSON.stringify({ token: authToken, options: connectionData }));
          };

          this.ws.onmessage = (event: MessageEvent<ArrayBuffer | string>) => {
            // Check if this handler is still valid
            if (thisGeneration !== this.connectionGeneration) {
              return;
            }
            this.handleMessage(event);
          };

          this.ws.onclose = () => {
            // Check if this handler is still valid
            if (thisGeneration !== this.connectionGeneration) {
              return;
            }
            if (!this.isConnected) {
              this.isConnecting = false;
            }
            clearTimeout(timeout);
            clearInterval(this.checkConnectedTimer);
            this.checkConnectedTimer = null;
            // Only reconnect if connected (connection was established then lost)
            if (this.isConnected) {
              this.shellConnectedCallbacks.forEach(cb => cb({ connected: false }));
              this.scheduleReconnect(connectionData);
            }
          };

          this.ws.onerror = () => {
            // Check if this handler is still valid
            if (thisGeneration !== this.connectionGeneration) {
              return;
            }
            if (!this.isConnected) {
              this.isConnecting = false;
            }
            clearTimeout(timeout);
          };

          // Check periodically if connected
          this.checkConnectedTimer = setInterval(() => {
            // Check if this timer is still valid
            if (thisGeneration !== this.connectionGeneration) {
              clearInterval(this.checkConnectedTimer);
              this.checkConnectedTimer = null;
              return;
            }
            if (this.isConnected) {
              clearInterval(this.checkConnectedTimer);
              this.checkConnectedTimer = null;
              clearTimeout(timeout);
              this.isConnecting = false;
              resolve();
            }
          }, 100);

        } catch (error) {
          if (thisGeneration !== this.connectionGeneration) {
            return;
          }
          this.isConnecting = false;
          clearTimeout(timeout);
          reject(error);
        }
      };

      doConnect();
    });
  }

  private handleMessage(msg: MessageEvent<ArrayBuffer | string>): void {
    if (typeof msg.data === 'string') {
      try {
        const data = JSON.parse(msg.data) as { id?: string; msg?: string };
        if (data.msg === 'connected') {
          this.isConnected = true;
          this.isConnecting = false;
          this.connectionId = data.id || null;
          this.shellConnectedCallbacks.forEach(cb => cb({
            connected: true,
            id: data.id,
          }));
          return;
        }
      } catch (error) {
        console.error('Failed to parse shell message:', error);
      }
    }

    if (!this.isConnected) {
      return;
    }

    this.shellOutputCallbacks.forEach(cb => cb(msg.data as ArrayBuffer | string));
  }

  private scheduleReconnect(connectionData: TerminalConnectionData): void {
    if (this.reconnectTimer) {
      return;
    }

    const RECONNECT_DELAY = 3000;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;

      try {
        if (!truenasApi.connected()) {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              unsubscribeFn();
              reject(new Error('Connection timeout'));
            }, 30000);

            const unsubscribeFn = truenasApi.onConnectionStateChange((state) => {
              if (state === 'connected') {
                clearTimeout(timeout);
                unsubscribeFn();
                resolve();
              }
            });
          });
        }

        const token = await authService.getOneTimeToken();
        await this.connect(connectionData, token);
      } catch {
        // Reconnection failed - will be handled by UI showing reconnect button
      }
    }, RECONNECT_DELAY);
  }

  send(data: string): void {
    if (this.isConnected && this.ws) {
      const buffer = this.encoder.encode(data);
      this.ws.send(buffer);
    }
  }

  onOutput(callback: ShellOutputCallback): () => void {
    this.shellOutputCallbacks.add(callback);
    return () => this.shellOutputCallbacks.delete(callback);
  }

  onConnected(callback: ShellConnectedCallback): () => void {
    this.shellConnectedCallbacks.add(callback);
    return () => this.shellConnectedCallbacks.delete(callback);
  }

  isShellConnected(): boolean {
    return this.isConnected;
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }

  resize(cols: number, rows: number): void {
    if (this.connectionId) {
      truenasApi.call('core.resize_shell', [this.connectionId, cols, rows]).catch(console.error);
    }
  }

  disconnectIfSessionActive(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.checkConnectedTimer) {
      clearInterval(this.checkConnectedTimer);
      this.checkConnectedTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Increment generation to invalidate any pending handlers
    this.connectionGeneration++;
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionId = null;
  }
}

export const shellService = new ShellService();
export default shellService;