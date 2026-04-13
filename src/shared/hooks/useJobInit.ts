/**
 * Hook to initialize job service when user is authenticated
 */

import { useEffect } from 'react'
import { useAuthStore } from '@truenas/stores/auth'
import { useJobStore } from '@truenas/stores/job'

export function useJobInit() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const loadJobs = useJobStore(state => state.loadJobs)
  const subscribeToJobs = useJobStore(state => state.subscribeToJobs)
  const unsubscribeFromJobs = useJobStore(state => state.unsubscribeFromJobs)

  useEffect(() => {
    if (isAuthenticated) {
      loadJobs()
      subscribeToJobs()
    }

    return () => {
      unsubscribeFromJobs()
    }
  }, [isAuthenticated, loadJobs, subscribeToJobs, unsubscribeFromJobs])
}
