/**
 * Main App Component
 *
 * Root component for the webdesktop application
 * Orchestrates authentication and desktop environments
 */

import { ErrorBoundary } from './components/ErrorBoundary'
import AuthGuard from './components/AuthGuard'
import DesktopShell from './components/DesktopShell'
import { useWebSocketInit } from './hooks/useWebSocketInit'
import { useAlertInit } from './hooks/useAlertInit'
import SmoothWallpaper from './components/SmoothWallpaper'
import { useWallpaper } from './hooks/useWallpaper'
import AppLoading from './components/AppLoading'

export default function App() {
  // Initialize services
  const wsInitialized = useWebSocketInit()
  useAlertInit()

  const wallpaper = useWallpaper()

  console.log('[Debug] App: rendering with wsInitialized =', wsInitialized)

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
