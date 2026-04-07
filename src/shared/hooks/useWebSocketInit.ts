import { useEffect, useState } from 'react'
import { truenasApi } from '@truenas/api'

export function useWebSocketInit(): boolean {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      truenasApi.init()
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize TrueNAS client:', error)
      setIsInitialized(true)
    }
  }, [])

  return isInitialized
}
