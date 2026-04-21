/**
 * Inactivity Timeout Hook
 *
 * Tracks user activity and triggers logout after a period of inactivity.
 * Timeout is paused when the screen is locked.
 *
 * Simplified logic:
 * 1. Timeout on expiry → logout → login page (handled by auto-login state)
 * 2. No timeout check on refresh - auth state determines page
 * 3. Timer paused during lock, resumed after unlock
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/auth'
import { persistentStorage } from '../../desktop/state/persistence'

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

interface UseInactivityTimeoutOptions {
  /** Timeout in milliseconds before triggering logout (default: 15 minutes) */
  timeoutMs?: number
  /** Callback called when timeout occurs */
  onTimeout?: () => void
}

/**
 * Get the last activity timestamp from storage
 */
function getLastActivityTime(): number {
  return persistentStorage.get<number>('lastActivityTime') ?? 0
}

/**
 * Set the last activity timestamp
 */
function setLastActivityTime(time: number): void {
  persistentStorage.set('lastActivityTime', time)
}

let activityListeners: Array<(time: number) => void> = []

/**
 * Notify all listeners of activity
 */
function notifyActivity(time: number): void {
  activityListeners.forEach(cb => cb(time))
}

/**
 * Subscribe to activity changes
 */
export function subscribeActivity(callback: (time: number) => void): () => void {
  activityListeners.push(callback)
  return () => {
    activityListeners = activityListeners.filter(cb => cb !== callback)
  }
}

const TRACKED_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
]

/**
 * Hook that monitors user inactivity and triggers logout
 *
 * Rules:
 * 1. Timeout triggers immediate logout (NOT lock screen)
 * 2. Timeout does NOT count when screen is locked
 * 3. No timeout check on refresh - let auto-login handle session state
 */
export function useInactivityTimeout(options: UseInactivityTimeoutOptions = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    onTimeout,
  } = options

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLockedRef = useRef(false)
  const { isAuthenticated, logout } = useAuthStore()

  // Check if screen is locked
  const checkIsLocked = useCallback(() => {
    return sessionStorage.getItem('phs:isLocked') === 'true'
  }, [])

  // Clear existing timeout
  const clearInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Start or reset timeout timer
  const startTimer = useCallback(() => {
    clearInactivityTimer()

    timeoutRef.current = setTimeout(() => {
      if (onTimeout) {
        onTimeout()
      } else {
        logout()
      }
    }, timeoutMs)
  }, [timeoutMs, logout, onTimeout, clearInactivityTimer])

  // Reset timer on activity
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return

    // Don't reset timer when locked - timeout should not count during lock
    if (isLockedRef.current) return

    const now = Date.now()
    setLastActivityTime(now)
    notifyActivity(now)
    startTimer()
  }, [isAuthenticated, startTimer])

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      clearInactivityTimer()
      return
    }

    // Initialize last activity time if not set
    let lastActivity = getLastActivityTime()
    if (lastActivity === 0) {
      lastActivity = Date.now()
      setLastActivityTime(lastActivity)
    }

    // Subscribe to lock state changes
    const unsubscribeActivity = subscribeActivity((time) => {
      lastActivity = time
    })

    // Subscribe to storage events for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'phs:isLocked') {
        const isLocked = e.newValue === 'true'
        isLockedRef.current = isLocked

        if (!isLocked) {
          // Screen unlocked - start timer from now
          startTimer()
        } else {
          // Screen locked - clear timer, don't count time while locked
          clearInactivityTimer()
        }
      }
      if (e.key === 'phs:lastActivityTime') {
        lastActivity = getLastActivityTime()
      }
    }
    window.addEventListener('storage', handleStorage)

    // Initial lock check
    isLockedRef.current = checkIsLocked()

    // Start timer if not locked
    if (!isLockedRef.current) {
      startTimer()
    }

    // Activity handler
    const handleActivity = () => {
      lastActivity = Date.now()
      setLastActivityTime(lastActivity)
      notifyActivity(lastActivity)
      resetInactivityTimer()
    }

    // Add event listeners
    TRACKED_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearInactivityTimer()
      TRACKED_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      window.removeEventListener('storage', handleStorage)
      unsubscribeActivity()
    }
  }, [isAuthenticated, resetInactivityTimer, clearInactivityTimer, logout, onTimeout, timeoutMs, checkIsLocked, startTimer])

  return {
    resetTimer: resetInactivityTimer,
    clearTimer: clearInactivityTimer,
  }
}
