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
    this.log('WebSocket client initialized with config:', this.config)
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
      this.log('Connecting to WebSocket:', url)

      this.ws = new WebSocket(url)
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)

      // Set connection timeout
      this.connectionTimer = setTimeout(() => {
        this.log('Connection timeout')
        this.ws?.close()
      }, this.config.connectionTimeout)

    } catch (error) {
      this.log('WebSocket connection failed:', error)
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

    this.log('WebSocket connected')
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
    this.call('core.set_options', [{ legacy_jobs: false }]).catch((error) => {
      this.log('Failed to send core.set_options:', error)
    })
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const text = event.data
      const message = JSON.parse(text) as IncomingMessage

      this.log('WebSocket message received:', message)

      // Update last message time for heartbeat
      this.lastMessageTime = Date.now()
      this.heartbeatMissed = 0

      // Handle response to a request
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!
        this.pendingRequests.delete(message.id)

        if (message.error) {
          this.log('WebSocket error response:', JSON.stringify(message, null, 2))

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

    } catch (error) {
      this.log('Failed to parse WebSocket message:', error, text)
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

      this.log(`Event received: method='${eventName}'`, eventData)

      // Dispatch to event listeners registered for this event name
      const listeners = this.eventListeners.get(eventName)
      if (listeners) {
        this.log(`Dispatching event '${eventName}' to ${listeners.size} listener(s)`)
        listeners.forEach((callback) => {
          try {
            callback(eventData)
          } catch (error) {
            this.log(`Error in event listener for '${eventName}':`, error)
          }
        })
      }

      // For collection_update events, also dispatch to listeners for the specific collection
      // The collection name is in params.collection (e.g., 'pool.query', 'disk.query')
      if (eventName === 'collection_update' && typeof eventData === 'object' && eventData !== null) {
        const collectionEvent = eventData as { collection?: string }
        if (collectionEvent.collection) {
          const collectionListeners = this.eventListeners.get(collectionEvent.collection)
          if (collectionListeners) {
            this.log(`Dispatching collection_update for '${collectionEvent.collection}' to ${collectionListeners.size} listener(s)`)
            collectionListeners.forEach((callback) => {
              try {
                callback(eventData)
              } catch (error) {
                this.log(`Error in collection listener for '${collectionEvent.collection}':`, error)
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

      this.log(`Event received: id='${eventName}'`, eventData)

      // Dispatch to event listeners
      const listeners = this.eventListeners.get(eventName)
      if (listeners) {
        this.log(`Dispatching event '${eventName}' to ${listeners.size} listener(s)`)
        listeners.forEach((callback) => {
          try {
            callback(eventData)
          } catch (error) {
            this.log(`Error in event listener for '${eventName}':`, error)
          }
        })
      }
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log('WebSocket disconnected:', event.code, event.reason)
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
  private handleError(error: Event): void {
    this.log('WebSocket error:', error)
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
      this.log('Max reconnection attempts reached, giving up')
      this.setConnectionState(ConnectionState.Disconnected)
      return
    }

    if (this.reconnectTimer) {
      return
    }

    this.setConnectionState(ConnectionState.Reconnecting)
    this.reconnectAttempts++

    const delay = this.currentReconnectDelay
    this.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)

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
        this.log(`Heartbeat missed (${this.heartbeatMissed}/${this.maxMissedHeartbeats})`)

        if (this.heartbeatMissed >= this.maxMissedHeartbeats) {
          this.log('Too many missed heartbeats, forcing reconnection')
          this.ws?.close()
          return
        }
      }

      // Send a ping to keep connection alive
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ jsonrpc: '2.0', id: '_ping', method: 'core.ping' }))
        } catch (error) {
          this.log('Failed to send ping:', error)
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
      this.log('Connection state changed:', this.connectionState, '->', state)
      this.connectionState = state

      this.stateChangeListeners.forEach(listener => {
        try {
          listener(state)
        } catch (error) {
          this.log('Error in state change listener:', error)
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

    this.log(`Flushing ${calls.length} pending calls`)

    calls.forEach(({ method, params }) => {
      this.call(method, params).catch(error => {
        this.log('Failed to execute pending call:', method, error)
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
   * Log debug message if debug mode is enabled
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.debug('[TrueNAS WebSocket]', ...args)
    }
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

      this.log('Sending WebSocket message:', method, JSON.stringify(message))

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
   */
  async job<T>(method: string, params?: unknown[]): Promise<Job<T>> {
    // First, call the method - it returns a job result immediately
    const result = await this.call(method, params);

    // The result contains the job info with an id
    const jobResult = result as { id: number };

    // Subscribe to job events - TrueNAS sends events on 'method.job_id' channel
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribe(`${method}.${jobResult.id}`, (data) => {
        const eventData = data as { msg: string; job?: Job<T> };

        if (eventData.msg === 'changed' && eventData.job) {
          // Job progress update - we could emit this but for simplicity we just track it
        } else if (eventData.msg === 'finished') {
          // Job finished
          unsubscribe();
          if (eventData.job) {
            if (eventData.job.state === 'Failed') {
              reject(new Error(eventData.job.error?.message || 'Job failed'));
            } else {
              resolve(eventData.job);
            }
          } else {
            resolve(eventData as unknown as Job<T>);
          }
        }
      });
    });
  }

  /**
   * Subscribe to an event
   * This registers a local callback AND tells TrueNAS backend to send events for this channel
   */
  subscribe(event: string, callback: (data: unknown) => void): () => void {
    this.log(`subscribe('${event}') called`)

    // Register callback locally
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)

    // Tell TrueNAS backend to subscribe to this event channel
    // Only send subscribe if we don't already have listeners for this event
    if (this.eventListeners.get(event)!.size === 1) {
      this.log(`First listener for '${event}', sending core.subscribe`)
      this.sendSubscription(event, true).catch((error) => {
        this.log(`Failed to subscribe to '${event}':`, error)
      })
    } else {
      this.log(`Additional listener for '${event}', not sending core.subscribe (already subscribed)`)
    }

    // Return unsubscribe function
    return () => {
      this.log(`unsubscribe('${event}') called`)
      this.eventListeners.get(event)?.delete(callback)
      // Clean up empty sets and unsubscribe from backend
      if (this.eventListeners.get(event)?.size === 0) {
        this.eventListeners.delete(event)
        this.log(`Last listener removed for '${event}', sending core.unsubscribe`)
        this.sendSubscription(event, false).catch((error) => {
          this.log(`Failed to unsubscribe from '${event}':`, error)
        })
      }
    }
  }

  /**
   * Send subscription/unsubscription request to TrueNAS backend
   */
  private async sendSubscription(event: string, subscribe: boolean): Promise<void> {
    const method = subscribe ? 'core.subscribe' : 'core.unsubscribe'
    this.log(`sendSubscription: calling ${method}('${event}')`)
    await this.call(method, [event])
    this.log(`sendSubscription: ${subscribe ? 'Subscribed' : 'Unsubscribed'} to '${event}' successfully`)
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
    this.log('Disconnecting WebSocket')

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
