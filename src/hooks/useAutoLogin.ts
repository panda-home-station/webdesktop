import { useEffect, useState } from 'react'
import { useAuthStore } from '../truenas/stores/auth.store'
import { authService } from '../truenas/services/auth.service'
import { LoginResult } from '../truenas/types/login-result.enum'

export function useAutoLogin(isAuthenticated: boolean, onAutoLoginComplete: () => void) {
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false)

  useEffect(() => {
    if (isAutoLoggingIn) {
      return
    }

    // Check for token in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')

    if (tokenParam) {
      authService.setQueryToken(tokenParam)
    }

    // Check for saved token in localStorage
    const savedToken = localStorage.getItem('token')
    if (savedToken && !isAuthenticated) {
      const authStore = useAuthStore.getState()
      authStore.setToken(savedToken)
      setIsAutoLoggingIn(true)

      // Try to login with token
      authService.loginWithToken().then((result) => {
        setIsAutoLoggingIn(false)
        onAutoLoginComplete()

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
          localStorage.removeItem('token')
        }
      }).catch(() => {
        setIsAutoLoggingIn(false)
        onAutoLoginComplete()
      })
    }
    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
  }, [isAuthenticated, isAutoLoggingIn, onAutoLoginComplete])

  return isAutoLoggingIn
}
