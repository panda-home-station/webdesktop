/**
 * TrueNAS WebSocket Client
 *
 * This module provides a WebSocket client for communicating with TrueNAS backend.
 * Ported from Angular webui's WebSocketHandlerService.
 *
 * Uses JSON-RPC 2.0 protocol
 * Spec: https://www.jsonrpc.org/specification
 */

import { environment } from '../../environments/environment';

export interface WebSocketMessage {
  jsonrpc: string
  id: string
  method: string
  params?: unknown[]
}

export interface IncomingMessage {
  id?: string
  jsonrpc?: string
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export class TrueNASWebSocketClient {
  private ws: WebSocket | null = null
  private messageId = 0
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()
  private eventListeners = new Map<string, Set<(data: unknown) => void>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isConnected = false

  constructor() {
    this.connect()
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In production, use current host. In dev, use configured remote
    const host = import.meta.env.PROD ? window.location.host : environment.remote;
    return `${protocol}//${host}/api/current`;
  }

  private connect(): void {
    try {
      const url = this.getWebSocketUrl();
      console.log('Connecting to WebSocket:', url);
      this.ws = new WebSocket(url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    this.isConnected = true;
    console.log('WebSocket connected');

    // Send core.set_options as required by TrueNAS
    this.call('core.set_options', [{ legacy_jobs: false }]).catch((error) => {
      console.warn('Failed to send core.set_options:', error);
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const text = event.data;
      const message = JSON.parse(text) as IncomingMessage;

      // Log incoming message for debugging
      console.log('WebSocket message received:', message);

      // Handle response to a request
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!;
        this.pendingRequests.delete(message.id);

        if (message.error) {
          console.error('WebSocket error details:', message.error);
          console.error('Error data:', JSON.stringify(message.error.data, null, 2));
          reject(new Error(message.error.message || 'Unknown error'));
        } else {
          resolve(message.result);
        }
        return;
      }

      // Handle event notification
      // TODO: Implement event handling
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error, text);
    }
  }

  private handleClose(): void {
    this.isConnected = false;
    console.log('WebSocket disconnected');
    this.scheduleReconnect();
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000); // Reconnect after 5 seconds
  }

  private generateId(): string {
    return (++this.messageId).toString();
  }

  /**
   * Make a call to TrueNAS API
   */
  async call(method: string, params?: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      const id = this.generateId();
      this.pendingRequests.set(id, { resolve, reject });

      const message: WebSocketMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params: params || [],
      };

      console.log('Sending WebSocket message:', method, JSON.stringify(message));

      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to an event
   */
  subscribe(event: string, callback: (data: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Check if WebSocket is connected
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.pendingRequests.clear();
    this.eventListeners.clear();
  }
}
