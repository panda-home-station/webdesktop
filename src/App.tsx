/**
 * Main App Component
 *
 * Root component for the webdesktop application
 * Orchestrates authentication and desktop environments
 */

import { ErrorBoundary } from './desktop/components/ErrorBoundary'
import AuthGuard from './desktop/components/AuthGuard'
import DesktopShell from './desktop/components/DesktopShell'
import { useWebSocketInit } from './shared/hooks/useWebSocketInit'
import { useAlertInit } from './shared/hooks/useAlertInit'
import { useJobInit } from './shared/hooks/useJobInit'
import SmoothWallpaper from './desktop/components/SmoothWallpaper'
import { useWallpaper } from './shared/hooks/useWallpaper'
import AppLoading from './desktop/components/AppLoading'
import { useInactivityTimeout } from './shared/hooks/useInactivityTimeout'
import { useSessionExpiry } from './shared/hooks/useSessionExpiry'

export default function App() {
  // Initialize services
  const wsInitialized = useWebSocketInit()
  useAlertInit()
  useJobInit()

  // Track inactivity timeout (15 minutes default)
  useInactivityTimeout()

  // Listen for session expiry events
  useSessionExpiry()

  const wallpaper = useWallpaper()

  return (
    <ErrorBoundary>
      <div className="fullScreen panda-app">
        <SmoothWallpaper src={wallpaper} />
        {wsInitialized ? (
          <AuthGuard>
            <DesktopShell />
          </AuthGuard>
        ) : (
          <AppLoading />
        )}
      </div>
    </ErrorBoundary>
  )
}
