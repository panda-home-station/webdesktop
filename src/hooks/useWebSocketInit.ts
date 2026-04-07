import { useEffect, useState } from 'react'
import { truenasApi } from '@truenas/api'

export function useWebSocketInit(): boolean {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      truenasApi.init()
      console.log('TrueNAS WebSocket client initialized')
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize TrueNAS client:', error)
      setIsInitialized(true) // Still mark as initialized to allow retry
    }
  }, [])

  return isInitialized
}
