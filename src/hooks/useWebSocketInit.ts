import { useEffect } from 'react'
import { truenasApi } from '../truenas/api'

export function useWebSocketInit() {
  useEffect(() => {
    try {
      truenasApi.init()
      console.log('TrueNAS WebSocket client initialized')
    } catch (error) {
      console.error('Failed to initialize TrueNAS client:', error)
    }
  }, [])
}
