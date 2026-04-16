/**
 * Inactivity Timeout Hook
 *
 * Tracks user activity and triggers logout after a period of inactivity.
 * Helps enforce security by logging out users who leave their session unattended.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/auth'
import { lockScreen } from '../sdk/desktop'

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

interface UseInactivityTimeoutOptions {
  /** Timeout in milliseconds before triggering logout (default: 15 minutes) */
  timeoutMs?: number
  /** Whether to lock screen instead of full logout (default: true) */
  lockInsteadOfLogout?: boolean
  /** Events to track for activity (default: all user interactions) */
  trackedEvents?: string[]
  /** Callback called when timeout occurs */
  onTimeout?: () => void
}

/**
 * Hook that monitors user inactivity and triggers logout/lock
 */
export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    lockInsteadOfLogout = true,
    trackedEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ],
    onTimeout,
  } = options

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isAuthenticated, logout } = useAuthStore()

  // Clear existing timeout
  const clearInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Reset timeout on activity
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return

    clearInactivityTimer()

    timeoutRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout()
      } else if (lockInsteadOfLogout) {
        // Lock the screen instead of logging out
        lockScreen()
      } else {
        // Full logout
        logout()
      }
    }, timeoutMs)
  }, [isAuthenticated, timeoutMs, lockInsteadOfLogout, logout, onTimeout, clearInactivityTimer])

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      clearInactivityTimer()
      return
    }

    // Initial timer
    resetInactivityTimer()

    // Add event listeners
    const handleActivity = () => {
      resetInactivityTimer()
    }

    trackedEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearInactivityTimer()
      trackedEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, trackedEvents, resetInactivityTimer, clearInactivityTimer])

  return {
    resetTimer: resetInactivityTimer,
    clearTimer: clearInactivityTimer,
  }
}
