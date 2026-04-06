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

export default function App() {
  // Initialize services
  useWebSocketInit()
  useAlertInit()

  const wallpaper = useWallpaper()

  return (
    <ErrorBoundary>
      <div className="fullScreen panda-app">
        <SmoothWallpaper src={wallpaper} />
        <AuthGuard>
          <DesktopShell />
        </AuthGuard>
      </div>
    </ErrorBoundary>
  )
}
