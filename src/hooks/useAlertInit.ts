/**
 * Hook to initialize alert service when user is authenticated
 */

import { useEffect } from 'react'
import { useAuthStore } from '../truenas/stores/auth.store'
import useAlertStore from '../truenas/stores/alert.store'

export function useAlertInit() {
  const { isAuthenticated } = useAuthStore()
  const fetchAlerts = useAlertStore(state => state.fetchAlerts)

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts()
    }
  }, [isAuthenticated, fetchAlerts])
}
