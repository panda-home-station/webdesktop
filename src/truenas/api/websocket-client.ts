/**
 * TrueNAS WebSocket Client
 *
 * This module provides a WebSocket client for communicating with TrueNAS backend.
 * Ported from Angular webui's WebSocketHandlerService.
 *
 * Features:
 * - JSON-RPC 2.0 protocol
 * - Exponential backoff reconnection
 * - Heartbeat/keepalive mechanism
 * - Event subscription system
 *
 * Spec: https://www.jsonrpc.org/specification
 */

import { environment } from '../../environments/environment';
import { Job } from '../../shared/types/job-types';

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
  method?: string
  params?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
    reason?: string
    errno?: number
    strerror?: string
  }
}

/**
 * Connection states
 */
export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Error = 'error',
}

/**
 * Custom error class that preserves all TrueNAS error details
 */
export class TrueNASError extends Error {
  constructor(
    message: string,
    public code?: number,
    public data?: unknown,
    public reason?: string,
    public errno?: number,
    public strerror?: string,
    public errorResponse?: unknown
  ) {
    super(message)
    this.name = 'TrueNASError'
  }
}

/**
 * Configuration for WebSocket client
 */
interface WebSocketClientConfig {
  /** Initial reconnect delay in milliseconds (default: 1000ms) */
  initialReconnectDelay: number
  /** Maximum reconnect delay in milliseconds (default: 30000ms) */
  maxReconnectDelay: number
  /** Exponential backoff factor (default: 2) */
  backoffFactor: number
  /** Heartbeat interval in milliseconds (default: 30000ms) */
  heartbeatInterval: number
  /** Connection timeout in milliseconds (default: 10000ms) */
  connectionTimeout: number
  /** Maximum retry attempts (default: Infinity) */
  maxRetries: number
  /** Whether to log debug messages */
  debug: boolean
}

const DEFAULT_CONFIG: WebSocketClientConfig = {
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  backoffFactor: 2,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  maxRetries: Infinity,
  debug: import.meta.env.DEV,
};

export class TrueNASWebSocketClient {
  private ws: WebSocket | null = null
  private messageId = 0
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()
  private eventListeners = new Map<string, Set<(data: unknown) => void>>()

  // Connection state
  private connectionState = ConnectionState.Disconnected
  private stateChangeListeners = new Set<(state: ConnectionState) => void>()

  // Reconnection
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private currentReconnectDelay = DEFAULT_CONFIG.initialReconnectDelay
  private connectionTimer: ReturnType<typeof setTimeout> | null = null

  // Heartbeat
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private lastMessageTime = 0
  private heartbeatMissed = 0
  private maxMissedHeartbeats = 3

  // Connection promise
  private connectPromise: Promise<void> | null = null
  private connectResolve: (() => void) | null = null
  private connectReject: ((error: Error) => void) | null = null

  private config: WebSocketClientConfig
  private pendingCalls: Array<{ method: string; params: unknown[] }> = []

  constructor(config?: Partial<WebSocketClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.connect()
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.connectionState === ConnectionState.Connecting ||
        this.connectionState === ConnectionState.Connected) {
      return
    }

    this.setConnectionState(ConnectionState.Connecting)

    // Create a promise that resolves when connection is established
    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectResolve = resolve
      this.connectReject = reject
    })

    try {
      const url = this.getWebSocketUrl()

      this.ws = new WebSocket(url)
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        this.ws?.close()
      }, this.config.connectionTimeout)

    } catch (error) {
      this.handleConnectionError(error as Error)
    }
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = environment.remote;
    return `${protocol}//${host}/api/current`;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    this.setConnectionState(ConnectionState.Connected)

    // Reset reconnection state
    this.reconnectAttempts = 0
    this.currentReconnectDelay = this.config.initialReconnectDelay

    // Start heartbeat
    this.startHeartbeat()

    // Resolve connection promise
    if (this.connectResolve) {
      this.connectResolve()
      this.connectResolve = null
      this.connectReject = null
    }

    // Send pending calls
    this.flushPendingCalls()

    // Send core.set_options as required by TrueNAS
    this.call('core.set_options', [{ legacy_jobs: false }]).catch(() => {
      // Silently ignore
    })
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const text = event.data
      const message = JSON.parse(text) as IncomingMessage

      // Update last message time for heartbeat
      this.lastMessageTime = Date.now()
      this.heartbeatMissed = 0

      // Handle response to a request
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!
        this.pendingRequests.delete(message.id)

        if (message.error) {
          const error = new TrueNASError(
            message.error.message || message.error.strerror || 'Unknown error',
            message.error.code,
            message.error.data,
            message.error.reason,
            message.error.errno,
            message.error.strerror,
            message.error
          )

          reject(error)
        } else {
          resolve(message.result)
        }
        return
      }

      // Handle event notification
      this.handleEventMessage(message)

    } catch {
      // Silently ignore parse errors
    }
  }

  /**
   * Handle event notification message
   * TrueNAS sends events in two formats:
   * 1. { method: 'event_name', params: data } - used for collection_update, etc.
   * 2. { id: 'event_name', result: data } - used for some other events
   *
   * For collection_update events, params contains:
   * { msg: 'ADDED'|'CHANGED'|'REMOVED', collection: 'pool.query', id: ..., fields: {...} }
   */
  private handleEventMessage(message: IncomingMessage): void {
    // Format 1: { method: 'event_name', params: data }
    if (message.method && message.params !== undefined) {
      const eventName = message.method
      const eventData = message.params

      // Dispatch to event listeners registered for this event name
      const listeners = this.eventListeners.get(eventName)
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(eventData)
          } catch {
            // Silently ignore listener errors
          }
        })
      }

      // For collection_update events, also dispatch to listeners for the specific collection
      if (eventName === 'collection_update' && typeof eventData === 'object' && eventData !== null) {
        const collectionEvent = eventData as { collection?: string }
        if (collectionEvent.collection) {
          const collectionListeners = this.eventListeners.get(collectionEvent.collection)
          if (collectionListeners) {
            collectionListeners.forEach((callback) => {
              try {
                callback(eventData)
              } catch {
                // Silently ignore listener errors
              }
            })
          }
        }
      }

      // Also check if this looks like a job event (has job info in params)
      if (typeof eventData === 'object' && eventData !== null) {
        const data = eventData as { msg?: string; job?: unknown }
        if (data.msg && data.job) {
          const listeners = this.eventListeners.get(eventName)
          if (listeners) {
            listeners.forEach((callback) => {
              try {
                callback(eventData)
              } catch {
                // Silently ignore listener errors
              }
            })
          }
        }
      }
      return
    }

    // Format 2: { id: 'event_name', result: data }
    if (message.id && message.result !== undefined) {
      // Skip if this is a response to a pending request
      if (this.pendingRequests.has(message.id as string)) {
        return
      }

      const eventName = message.id as string
      const eventData = message.result

      // Dispatch to event listeners
      const listeners = this.eventListeners.get(eventName)
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(eventData)
          } catch {
            // Silently ignore listener errors
          }
        })
      }
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.cleanup()

    if (this.connectionState === ConnectionState.Connected) {
      // Connection was established, try to reconnect
      this.scheduleReconnect()
    } else {
      // Initial connection failed
      this.handleConnectionError(
        new Error(`Connection failed: ${event.reason || 'Unknown reason'}`)
      )
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(): void {
    // Silently ignore WebSocket errors
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    this.setConnectionState(ConnectionState.Error)

    if (this.connectReject) {
      this.connectReject(error)
      this.connectResolve = null
      this.connectReject = null
    }

    this.scheduleReconnect()
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxRetries) {
      this.setConnectionState(ConnectionState.Disconnected)
      return
    }

    if (this.reconnectTimer) {
      return
    }

    this.setConnectionState(ConnectionState.Reconnecting)
    this.reconnectAttempts++

    const delay = this.currentReconnectDelay

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null

      // Increase delay for next attempt
      this.currentReconnectDelay = Math.min(
        this.currentReconnectDelay * this.config.backoffFactor,
        this.config.maxReconnectDelay
      )

      this.connect()
    }, delay)
  }

  /**
   * Start heartbeat/keepalive mechanism
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.lastMessageTime = Date.now()
    this.heartbeatMissed = 0

    this.heartbeatTimer = setInterval(() => {
      const now = Date.now()
      const timeSinceLastMessage = now - this.lastMessageTime

      if (timeSinceLastMessage > this.config.heartbeatInterval * this.maxMissedHeartbeats) {
        this.heartbeatMissed++

        if (this.heartbeatMissed >= this.maxMissedHeartbeats) {
          this.ws?.close()
          return
        }
      }

      // Send a ping to keep connection alive
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ jsonrpc: '2.0', id: '_ping', method: 'core.ping' }))
        } catch {
          // Silently ignore ping errors
        }
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.setConnectionState(ConnectionState.Disconnected)

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    this.stopHeartbeat()
    this.ws = null
  }

  /**
   * Set connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state

      this.stateChangeListeners.forEach(listener => {
        try {
          listener(state)
        } catch {
          // Silently ignore listener errors
        }
      })
    }
  }

  /**
   * Flush pending calls after reconnection
   */
  private flushPendingCalls(): void {
    const calls = [...this.pendingCalls]
    this.pendingCalls = []

    calls.forEach(({ method, params }) => {
      this.call(method, params).catch(() => {
        // Silently ignore pending call errors
      })
    })
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return (++this.messageId).toString()
  }

  /**
   * Wait until WebSocket is connected
   */
  async waitUntilConnected(): Promise<void> {
    if (this.connectionState === ConnectionState.Connected) {
      return
    }

    if (this.connectPromise) {
      return this.connectPromise
    }

    return new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.connectionState === ConnectionState.Connected) {
          clearInterval(checkInterval)
          resolve()
        } else if (this.connectionState === ConnectionState.Error) {
          clearInterval(checkInterval)
          reject(new Error('Connection error'))
        }
      }, 100)
    })
  }

  /**
   * Make a call to TrueNAS API
   */
  async call(method: string, params?: unknown[]): Promise<unknown> {
    // Wait for connection if not connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.waitUntilConnected()
      } catch {
        // If not connected and reconnection is in progress, queue the call
        this.pendingCalls.push({ method, params: params || [] })
        throw new Error('WebSocket is not connected')
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      const id = this.generateId()
      this.pendingRequests.set(id, { resolve, reject })

      const message: WebSocketMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params: params || [],
      }

      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        this.pendingRequests.delete(id)
        reject(error)
      }
    })
  }

  /**
   * Make a job call to TrueNAS API
   * Returns a Promise that resolves with the job result
   * Progress updates are emitted via the optional onProgress callback
   *
   * This works by:
   * 1. Calling the method which returns either a job object, direct result, or job id
   * 2. If it's a direct result (like pool.create), resolve immediately with progress 100%
   * 3. If it's a job reference, subscribe to core.get_jobs for progress updates
   */
  async job<T>(
    method: string,
    params?: unknown[],
    onProgress?: (progress: { percent: number; description?: string }) => void
  ): Promise<Job<T>> {
    // First, call the method
    const result = await this.call(method, params);

    // Check if result looks like a direct result (has Name, guid, status - typical for pool.create)
    const resultObj = result as Record<string, unknown>;

    // If result has 'Name' or 'guid' fields, it's likely a direct result
    // (e.g., pool.create returns the pool object directly, not a job)
    if (resultObj.Name !== undefined || resultObj.guid !== undefined) {
      // For methods like pool.create that return directly, resolve with a synthetic success job
      if (onProgress) {
        onProgress({ percent: 100, description: '完成' });
      }
      return Promise.resolve({
        id: resultObj.id as number,
        method,
        arguments: params || [],
        progress: { percent: 100, description: '' },
        state: 'SUCCESS' as const,
        result: result as T,
      } as Job<T>);
    }

    // If result has 'state' and 'method' fields, it's already a Job object
    if (resultObj.state !== undefined && resultObj.method !== undefined) {
      return Promise.resolve(result as Job<T>);
    }

    // If result is just {id: number}, treat it as a job reference and poll
    const jobId = resultObj.id as number;
    if (typeof jobId !== 'number' || Object.keys(resultObj).length !== 1) {
      // Unknown result format, treat as direct result
      if (onProgress) {
        onProgress({ percent: 100, description: '完成' });
      }
      return Promise.resolve({
        id: 0,
        method,
        arguments: params || [],
        progress: { percent: 100, description: '' },
        state: 'SUCCESS' as const,
        result: result as T,
      } as Job<T>);
    }

    // Subscribe to core.get_jobs collection updates to get job progress notifications
    let unsubscribeCoreJobs: (() => void) | null = null;
    let jobFoundViaSubscription = false;

    // Create a promise that handles both subscription-based and polling-based progress
    return new Promise((resolve, reject) => {
      let finished = false;

      // Subscribe to core.get_jobs for real-time job updates
      unsubscribeCoreJobs = this.subscribe('core.get_jobs', (data) => {
        const eventData = data as { msg: string; id?: number; fields?: Job<T> };

        // Look for our job by id
        if (eventData.id === jobId && eventData.fields && eventData.msg === 'ADDED') {
          jobFoundViaSubscription = true;
          if (onProgress && eventData.fields.progress) {
            onProgress({
              percent: eventData.fields.progress.percent ?? 0,
              description: eventData.fields.progress.description,
            });
          }
        }
        if (eventData.id === jobId && eventData.fields && eventData.msg === 'CHANGED') {
          jobFoundViaSubscription = true;
          if (onProgress && eventData.fields.progress) {
            onProgress({
              percent: eventData.fields.progress.percent ?? 0,
              description: eventData.fields.progress.description,
            });
          }
          // Check if job is complete
          if (eventData.fields.state === 'SUCCESS' || eventData.fields.state === 'FAILED') {
            finished = true;
            if (unsubscribeCoreJobs) unsubscribeCoreJobs();
            clearInterval(pollInterval);
            if (eventData.fields.state === 'FAILED') {
              reject(new Error(eventData.fields.error?.message || 'Job failed'));
            } else {
              resolve(eventData.fields);
            }
          }
        }
      });

      // Poll core.get_jobs as a fallback
      const pollInterval = setInterval(async () => {
        if (finished) return;

        try {
          const jobs = await this.call('core.get_jobs') as Job<T>[];
          const ourJob = jobs.find(j => j.id === jobId);

          if (ourJob) {
            if (onProgress && ourJob.progress && !jobFoundViaSubscription) {
              onProgress({
                percent: ourJob.progress.percent ?? 0,
                description: ourJob.progress.description,
              });
            }

            if (ourJob.state === 'SUCCESS' || ourJob.state === 'FAILED' || ourJob.state === 'ABORTED') {
              finished = true;
              if (unsubscribeCoreJobs) unsubscribeCoreJobs();
              clearInterval(pollInterval);

              if (ourJob.state === 'FAILED') {
                reject(new Error(ourJob.error?.message || 'Job failed'));
              } else {
                resolve(ourJob);
              }
            }
          }
        } catch {
          // Silently ignore polling errors
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!finished) {
          finished = true;
          if (unsubscribeCoreJobs) unsubscribeCoreJobs();
          clearInterval(pollInterval);
          reject(new Error('Job timed out'));
        }
      }, 300000);
    });
  }

  /**
   * Subscribe to an event
   * This registers a local callback AND tells TrueNAS backend to send events for this channel
   */
  subscribe(event: string, callback: (data: unknown) => void): () => void {
    // Register callback locally
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)

    // Tell TrueNAS backend to subscribe to this event channel
    // Only send subscribe if we don't already have listeners for this event
    if (this.eventListeners.get(event)!.size === 1) {
      this.sendSubscription(event, true).catch(() => {
        // Silently ignore subscription errors
      })
    }

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback)
      // Clean up empty sets and unsubscribe from backend
      if (this.eventListeners.get(event)?.size === 0) {
        this.eventListeners.delete(event)
        this.sendSubscription(event, false).catch(() => {
          // Silently ignore unsubscription errors
        })
      }
    }
  }

  /**
   * Send subscription/unsubscription request to TrueNAS backend
   */
  private async sendSubscription(event: string, subscribe: boolean): Promise<void> {
    const method = subscribe ? 'core.subscribe' : 'core.unsubscribe'
    await this.call(method, [event])
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateChangeListeners.add(callback)

    // Call immediately with current state
    callback(this.connectionState)

    // Return unsubscribe function
    return () => {
      this.stateChangeListeners.delete(callback)
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * Check if WebSocket is connected
   */
  connected(): boolean {
    return this.connectionState === ConnectionState.Connected
  }

  /**
   * Get reconnection statistics
   */
  getReconnectStats() {
    return {
      attempts: this.reconnectAttempts,
      currentDelay: this.currentReconnectDelay,
      maxRetries: this.config.maxRetries,
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
          this.connectionTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.cleanup()
    this.pendingRequests.clear()
    this.pendingCalls = []

    // Reject pending connection promise
    if (this.connectReject) {
      this.connectReject(new Error('Disconnected by user'))
      this.connectResolve = null
      this.connectReject = null
    }
  }
}
