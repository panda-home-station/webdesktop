/**
 * TrueNAS API Service
 *
 * This module provides a high-level API for interacting with TrueNAS backend.
 * Ported from Angular webui's ApiService.
 */

import { TrueNASWebSocketClient, ConnectionState } from './websocket-client'

let wsClient: TrueNASWebSocketClient | null = null

export function initTrueNASClient(config?: {
  initialReconnectDelay?: number
  maxReconnectDelay?: number
  backoffFactor?: number
  heartbeatInterval?: number
  connectionTimeout?: number
  maxRetries?: number
  debug?: boolean
}): TrueNASWebSocketClient {
  if (!wsClient) {
    wsClient = new TrueNASWebSocketClient(config)
  }
  return wsClient
}

export function getTrueNASClient(): TrueNASWebSocketClient {
  if (!wsClient) {
    throw new Error('TrueNAS client not initialized. Call initTrueNASClient() first.')
  }
  return wsClient
}

// TODO: Add more API methods as we migrate from webui
export const truenasApi = {
  /**
   * Initialize the TrueNAS WebSocket client
   */
  init: initTrueNASClient,

  /**
   * Get the TrueNAS WebSocket client
   */
  getClient: getTrueNASClient,

  /**
   * Call a TrueNAS API method
   * Accepts multiple arguments (like webui's api.call(method, ...params))
   */
  async call(method: string, ...params: unknown[]): Promise<unknown> {
    const client = getTrueNASClient()
    return client.call(method, params)
  },

  /**
   * Subscribe to a TrueNAS event
   */
  subscribe(event: string, callback: (data: unknown) => void): () => void {
    const client = getTrueNASClient()
    return client.subscribe(event, callback)
  },

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    const client = getTrueNASClient()
    return client.onConnectionStateChange(callback)
  },

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    const client = getTrueNASClient()
    return client.getConnectionState()
  },

  /**
   * Check if WebSocket is connected
   */
  connected(): boolean {
    const client = getTrueNASClient()
    return client.connected()
  },

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    const client = getTrueNASClient()
    client.disconnect()
  },

  /**
   * Get reconnection statistics
   */
  getReconnectStats() {
    const client = getTrueNASClient()
    return client.getReconnectStats()
  },
}

export default truenasApi
