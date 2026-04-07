import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@truenas/stores/auth'
import { authService } from '@truenas/services/auth'
import { LoginResult } from '@truenas/types/login-result.enum'
import { persistentStorage } from '../../desktop/state/persistence'

export function useAutoLogin(isAuthenticated: boolean, wsInitialized: boolean) {
  const hasAttemptedAutoLogin = useRef(false)
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)

  // Determine if we should show loading state immediately when auto-login should happen
  const shouldAutoLogin = wsInitialized && !isAuthenticated && !hasAttemptedAutoLogin.current

  useEffect(() => {
    // Wait for WebSocket to be initialized
    if (!wsInitialized) {
      return
    }

    // Don't auto-login if already authenticated or already attempted
    if (isAuthenticated || hasAttemptedAutoLogin.current) {
      return
    }

    // Mark that we've attempted auto-login
    hasAttemptedAutoLogin.current = true

    // Check for token in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')

    if (tokenParam) {
      authService.setQueryToken(tokenParam)
    }

    // Check for saved token in persistent storage
    const savedToken = persistentStorage.get<string | null>('token')
    if (!savedToken) {
      return
    }

    const authStore = useAuthStore.getState()
    authStore.setToken(savedToken)
    setIsAutoLoggingIn(true)

    // Try to login with token
    authService.loginWithToken().then((result) => {
      setIsAutoLoggingIn(false)

      if (result === LoginResult.Success) {
        // Login successful
        // Clean URL to remove token parameter
        if (tokenParam) {
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        }
      } else {
        // Token login failed, clear it
        authStore.setToken(null)
        persistentStorage.remove('token')
      }
    }).catch(() => {
      setIsAutoLoggingIn(false)
    })
  }, [isAuthenticated, wsInitialized])

  // If we should auto-login but haven't started yet, show loading immediately
  if (shouldAutoLogin) {
    const savedToken = persistentStorage.get<string | null>('token')
    if (savedToken) {
      return true // Show loading state
    }
  }

  return isAutoLoggingIn
}
