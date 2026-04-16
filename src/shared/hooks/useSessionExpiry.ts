/**
 * Session Expiry Hook
 *
 * Listens for session-related events from TrueNAS and handles them appropriately.
 * Handles session invalidation, token expiry, and forced logout events.
 */

import { useEffect } from 'react'
import { truenasApi } from '../../truenas/api'
import { useAuthStore } from '../stores/auth'

/**
 * Hook that listens for session expiry events
 */
export function useSessionExpiry() {
  const { logout, clearAuth } = useAuthStore()

  useEffect(() => {
    // Subscribe to auth session events
    const unsubscribe = truenasApi.subscribe('auth.session_events', (data: unknown) => {
      const event = data as { msg?: string; [key: string]: unknown }

      // Handle different session events
      switch (event.msg) {
        case 'SESSION_INVALIDATED':
        case 'SESSION_EXPIRED':
        case 'TOKEN_INVALID':
        case 'FORCE_LOGOUT':
          // Clear local auth state
          clearAuth()
          break
        default:
          break
      }
    })

    return unsubscribe
  }, [logout, clearAuth])
}
