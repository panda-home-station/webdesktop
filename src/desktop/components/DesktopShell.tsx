/**
 * Desktop Shell Component
 *
 * Main desktop environment container
 * Handles lock screen, desktop, and app lifecycle
 */

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@truenas/stores/auth'
import Desktop from './Desktop'
import LockScreen from './LockScreen'
import SmoothWallpaper from './SmoothWallpaper'
import { useWallpaper } from '../../shared/hooks/useWallpaper'
import { setWallpaper } from '../state/desktop'
import { ErrorBoundary } from './ErrorBoundary'
import { lockScreen, showDesktop as showDesktopFn, openLauncher as openLauncherFn, openApp as openAppFn, subscribeLockScreen } from '../../shared/sdk/desktop'

interface DesktopShellProps {
  children?: React.ReactNode
}

/**
 * Desktop Shell Component
 *
 * Renders desktop environment with wallpaper and app support
 * Handles lock screen state
 */
export default function DesktopShell(_props: DesktopShellProps) {
  const wallpaper = useWallpaper()
  const [isLocked, setIsLocked] = useState(false)
  const { user } = useAuthStore()

  // Subscribe to lock screen events
  useEffect(() => {
    const unsubscribe = subscribeLockScreen(() => {
      setIsLocked(true)
    })
    return unsubscribe
  }, [])

  /**
   * Handle unlock
   */
  const handleUnlock = () => {
    setIsLocked(false)
  }

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    const authStore = useAuthStore.getState()
    await authStore.logout()
    // clearAuth is called by logout, which will set isAuthenticated to false
    // This will cause AuthGuard to show login screen instead of reloading
  }

  if (isLocked) {
    return (
      <ErrorBoundary>
        <div className="fullScreen panda-desktop">
          <SmoothWallpaper src={wallpaper} />
          <LockScreen
            wallpaper={wallpaper}
            username={user?.pw_name}
            onUnlock={handleUnlock}
            onLogout={handleLogout}
          />
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="fullScreen panda-desktop">
        <SmoothWallpaper src={wallpaper} />
        <Desktop />
      </div>
    </ErrorBoundary>
  )
}

/**
 * Desktop State Hook
 *
 * Provides desktop state
 */
export function useDesktopState() {
  const { isAuthenticated, user } = useAuthStore()

  return {
    isAuthenticated,
    isUnauthenticated: !isAuthenticated,
    user,
    wallpaper: useWallpaper(),
  }
}

/**
 * Desktop Actions Hook
 *
 * Provides desktop-related actions
 */
export function useDesktopActions() {
  return {
    setWallpaper,
    toggleLockScreen: lockScreen,
    showDesktop: showDesktopFn,
    openLauncher: openLauncherFn,
    openApp: openAppFn,
  }
}
