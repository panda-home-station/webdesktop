/**
 * Auth Guard Component
 *
 * Wraps authentication flow and manages login state
 */

import { useAuthStore } from '@truenas/stores/auth'
import { useAutoLogin } from '../hooks/useAutoLogin'
import LoginContainer from './LoginContainer'
import LoginLoading from './LoginLoading'
import { ErrorBoundary } from './ErrorBoundary'

interface AuthGuardProps {
  children: React.ReactNode
  onUnauthenticated?: () => React.ReactNode
  wsInitialized?: boolean
}

/**
 * AuthGuard Component
 *
 * Renders children when authenticated, otherwise shows login flow
 */
export default function AuthGuard({
  children,
  onUnauthenticated,
  wsInitialized = true,
}: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore()
  const isAutoLoggingIn = useAutoLogin(isAuthenticated, wsInitialized)

  console.log('[Debug] AuthGuard: isAuthenticated =', isAuthenticated, 'isAutoLoggingIn =', isAutoLoggingIn)

  if (!isAuthenticated) {
    // Render custom unauthenticated UI or default login
    if (onUnauthenticated) {
      return <ErrorBoundary>{onUnauthenticated()}</ErrorBoundary>
    }

    return (
      <ErrorBoundary>
        <div className="fullScreen panda-auth">
          <LoginLoadingOrContainer isAutoLoggingIn={isAutoLoggingIn} />
        </div>
      </ErrorBoundary>
    )
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}

/**
 * Login Loading or Container
 *
 * Shows loading state or login form based on auto-login status
 */
function LoginLoadingOrContainer({ isAutoLoggingIn }: { isAutoLoggingIn: boolean }) {
  if (isAutoLoggingIn) {
    return <LoginLoading />
  }

  return <LoginContainer />
}

/**
 * AuthStatus Hook
 *
 * Provides authentication status and user info
 */
export function useAuthStatus() {
  const { isAuthenticated, user, isLoading, hasTwoFactor } = useAuthStore()

  return {
    isAuthenticated,
    isUnauthenticated: !isAuthenticated,
    isLoading,
    hasTwoFactor,
    user,
  }
}

/**
 * AuthAction Hook
 *
 * Provides authentication actions
 */
export function useAuthActions() {
  const {
    setUser,
    setAuthenticated,
    setHasTwoFactor,
    setToken,
    setLoginError,
    logout,
    refreshUser,
    clearAuth,
  } = useAuthStore()

  return {
    setUser,
    setAuthenticated,
    setHasTwoFactor,
    setToken,
    setLoginError,
    logout,
    refreshUser,
    clearAuth,
  }
}
