/**
 * TrueNAS API Service
 *
 * This module provides a high-level API for interacting with TrueNAS backend.
 * Ported from Angular webui's ApiService.
 */

import { TrueNASWebSocketClient } from './websocket-client'

let wsClient: TrueNASWebSocketClient | null = null

export function initTrueNASClient(): TrueNASWebSocketClient {
  if (!wsClient) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/api/current`
    wsClient = new TrueNASWebSocketClient(url)
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
   */
  async call(method: string, params?: unknown[]): Promise<unknown> {
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
}

export default truenasApi
