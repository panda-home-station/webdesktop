/**
 * Hook to initialize alert service when user is authenticated
 */

import { useEffect } from 'react'
import { useAuthStore } from '@truenas/stores/auth'
import useAlertStore from '@truenas/stores/alert'

export function useAlertInit() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const fetchAlerts = useAlertStore(state => state.fetchAlerts)
  const subscribeToAlerts = useAlertStore(state => state.subscribeToAlerts)
  const unsubscribeFromAlerts = useAlertStore(state => state.unsubscribeFromAlerts)

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts()
      subscribeToAlerts()
    }

    return () => {
      unsubscribeFromAlerts()
    }
  }, [isAuthenticated, fetchAlerts, subscribeToAlerts, unsubscribeFromAlerts])
}
