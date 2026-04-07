import { useEffect, useState } from 'react'
import { truenasApi } from '@truenas/api'

export function useWebSocketInit(): boolean {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    console.log('[Debug] useWebSocketInit: starting initialization')
    try {
      truenasApi.init()
      console.log('[Debug] useWebSocketInit: init() called successfully')
      setIsInitialized(true)
    } catch (error) {
      console.error('[Debug] useWebSocketInit: Failed to initialize TrueNAS client:', error)
      setIsInitialized(true) // Still mark as initialized to allow retry
    }
  }, [])

  console.log('[Debug] useWebSocketInit: rendering with isInitialized =', isInitialized)
  return isInitialized
}
