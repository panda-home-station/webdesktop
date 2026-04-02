/**
 * TrueNAS WebSocket Client
 *
 * This module provides a WebSocket client for communicating with TrueNAS backend.
 * Ported from Angular webui's WebSocketHandlerService.
 */

export interface WebSocketMessage {
  id: string
  method: string
  params?: unknown[]
}

export interface IncomingMessage {
  id?: string
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

  constructor(private url: string) {
    this.connect()
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url)
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.scheduleReconnect()
    }
  }

  private handleOpen(): void {
    this.isConnected = true
    console.log('WebSocket connected')
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as IncomingMessage

      // Handle response to a request
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!
        this.pendingRequests.delete(message.id)

        if (message.error) {
          reject(new Error(message.error.message || 'Unknown error'))
        } else {
          resolve(message.result)
        }
        return
      }

      // Handle event notification
      // TODO: Implement event handling
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleClose(): void {
    this.isConnected = false
    console.log('WebSocket disconnected')
    this.scheduleReconnect()
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error)
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 5000) // Reconnect after 5 seconds
  }

  private generateId(): string {
    return (++this.messageId).toString()
  }

  /**
   * Make a call to TrueNAS API
   */
  async call(method: string, params?: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      const id = this.generateId()
      this.pendingRequests.set(id, { resolve, reject })

      const message: WebSocketMessage = {
        id,
        method,
        params: params ?? [],
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
   * Subscribe to an event
   */
  subscribe(event: string, callback: (data: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback)
    }
  }

  /**
   * Check if WebSocket is connected
   */
  connected(): boolean {
    return this.isConnected
  }

  /**
   * Disconnect the WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.pendingRequests.clear()
    this.eventListeners.clear()
  }
}
