/**
 * Window System Hook
 *
 * Centralized hook for managing window lifecycle and operations
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { listApps, loadApp, AppDef } from '../apps/registry'
import { useWindowsStore, WindowState } from '../state/windows-store'
import { requestPermission } from '../sdk/permissions'
import { subscribeOpenApp, subscribeWinAction, subscribeShowDesktop, subscribeLauncher } from '../sdk/desktop'
import { Loader2 } from 'lucide-react'

interface UseWindowSystemOptions {
  onAgentAppOpen?: () => void
}

/**
 * Calculate default window position with collision detection
 */
function calculateInitialPosition(
  appId: string,
  existingWindows: WindowState[],
  screenW: number,
  screenH: number,
  defW: number,
  defH: number
): { x: number; y: number } {
  const dockLeft = 12
  const dockWidth = 60
  const openGap = 24
  const gap = 28

  const centerX = Math.round((screenW - defW) / 2)
  const centerY = Math.round((screenH - defH) / 2)
  const minX = dockLeft + dockWidth + openGap
  const minY = 60
  const baseOffsetX = 120
  const baseOffsetY = 80
  const maxX = Math.max(minX, screenW - defW - 12)
  const maxY = Math.max(minY, screenH - defH - 12)

  let cx = Math.max(minX, centerX - baseOffsetX)
  let cy = Math.max(minY, centerY - baseOffsetY)

  // Check for collisions
  let tries = 0
  const maxTries = 100

  while (tries < maxTries) {
    const collision = existingWindows.some((win) => {
      if (win.minimized || win.maximized || win.appId !== appId) return false

      return Math.abs(win.x - cx) < 10 && Math.abs(win.y - cy) < 10
    })

    if (!collision) break

    cx += gap
    cy += gap
    tries++

    // Reset if too far
    if (cx > maxX || cy > maxY) {
      cx = Math.max(minX, centerX - baseOffsetX)
      cy = Math.max(minY, centerY - baseOffsetY)
    }
  }

  return {
    x: Math.max(minX, Math.min(cx, maxX)),
    y: Math.max(minY, Math.min(cy, maxY)),
  }
}

/**
 * App Loader Component
 */
function AppLoader({ appId, args, onLoaded }: { appId: string; args?: any; onLoaded?: () => void }) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    loadApp(appId)
      .then((C) => {
        if (mounted) {
          setComp(() => C)
          onLoaded?.()
        }
      })
      .catch((err) => {
        console.error(`Failed to load app ${appId}:`, err)
        if (mounted) setError(err.message)
      })
    return () => { mounted = false }
  }, [appId])

  if (error) {
    return (
      <div style={{ padding: 20, color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        应用加载失败: {error}
      </div>
    )
  }

  if (!Comp) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: 'rgba(255,255,255,0.5)' }}>
        <Loader2 className="animate-spin" size={32} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return <Comp {...args} />
}

export function useWindowSystem(options: UseWindowSystemOptions = {}) {
  const windowsStore = useWindowsStore()
  const [showLauncher, setShowLauncher] = useState(false)
  const [showQuickAgent, setShowQuickAgent] = useState(false)
  const [persistLoaded, setPersistLoaded] = useState(false)

  // Track loading apps to prevent double-clicks
  const loadingApps = useRef(new Set<string>())

  const apps = listApps()

  /**
   * Get app definition by ID
   */
  const getApp = useCallback(
    (appId: string): AppDef | undefined => {
      return apps.find((a) => a.id === appId)
    },
    [apps]
  )

  /**
   * Get window minimum dimensions
   */
  const getAppMinDimensions = useCallback(
    (appId: string): { minW: number; minH: number } => {
      const app = getApp(appId)
      return {
        minW: app?.minW ?? 300,
        minH: app?.minH ?? 200,
      }
    },
    [getApp]
  )

  /**
   * Open a new window
   */
  const openWindow = useCallback(
    async (params: {
      appId: string
      title?: string
      content?: React.ReactNode
      iconUrl?: string
      args?: any
      checkPermissions?: boolean
    }) => {
      const {
        appId,
        title,
        content,
        iconUrl,
        args,
        checkPermissions = true,
      } = params

      const app = getApp(appId)
      if (!app) {
        console.warn(`App not found: ${appId}`)
        return
      }

      // Check permissions if required
      if (checkPermissions && Array.isArray(app.capabilities)) {
        for (const cap of app.capabilities) {
          const ok = requestPermission(appId, cap)
          if (!ok) {
            console.warn(`Permission denied: ${cap}`)
            return
          }
        }
      }

      // Check for existing window of same app
      const existing = windowsStore.getWindowsByAppId(appId)[0]
      if (existing && !args) {
        // Restore existing window
        windowsStore.updateWindow(existing.id, { minimized: false, content })
        windowsStore.focusWindow(existing.id)
        return
      }

      // Prevent double-click
      if (loadingApps.current.has(appId)) {
        return
      }
      loadingApps.current.add(appId)

      try {
        const appDef = app!
        const { minW, minH } = getAppMinDimensions(appId)
        const defW = Math.max(600, minW)
        const defH = Math.max(400, minH)

        // Calculate initial position
        const visibleWindows = windowsStore.getVisibleWindows()
        const position = calculateInitialPosition(appId, visibleWindows, window.innerWidth, window.innerHeight, defW, defH)

        // Create window
        const windowContent = content ?? (
          <AppLoader appId={appId} args={args} onLoaded={() => loadingApps.current.delete(appId)} />
        )

        windowsStore.addWindow({
          id: `${appId}-${Date.now()}`,
          title: title ?? appDef.title,
          appId,
          iconUrl: iconUrl ?? appDef.iconUrl,
          x: position.x,
          y: position.y,
          w: defW,
          h: defH,
          content: windowContent,
        })
      } finally {
        // Don't delete if content was async loaded (AppLoader will do it)
        if (!content) {
          loadingApps.current.delete(appId)
        }
      }
    },
    [windowsStore, getApp, getAppMinDimensions]
  )

  /**
   * Close a window
   */
  const closeWindow = useCallback(
    (id: string) => {
      windowsStore.removeWindow(id)
    },
    [windowsStore]
  )

  /**
   * Focus a window
   */
  const focusWindow = useCallback(
    (id: string) => {
      windowsStore.focusWindow(id)
    },
    [windowsStore]
  )

  /**
   * Minimize a window
   */
  const minimizeWindow = useCallback(
    (id: string) => {
      windowsStore.setAnimating(true)
      windowsStore.minimizeWindow(id)
      setTimeout(() => windowsStore.setAnimating(false), 300)
    },
    [windowsStore]
  )

  /**
   * Restore a minimized window
   */
  const restoreWindow = useCallback(
    (id: string) => {
      windowsStore.setAnimating(true)
      windowsStore.restoreWindow(id)
      setTimeout(() => windowsStore.setAnimating(false), 300)
    },
    [windowsStore]
  )

  /**
   * Toggle maximize
   */
  const toggleMaximize = useCallback(
    (id: string) => {
      windowsStore.setAnimating(true)
      windowsStore.maximizeWindow(id)
      setTimeout(() => windowsStore.setAnimating(false), 300)
    },
    [windowsStore]
  )

  /**
   * Move a window
   */
  const moveWindow = useCallback(
    (id: string, x: number, y: number) => {
      windowsStore.moveWindow(id, x, y)
    },
    [windowsStore]
  )

  /**
   * Resize a window
   */
  const resizeWindow = useCallback(
    (id: string, w: number, h: number, x?: number, y?: number) => {
      windowsStore.resizeWindow(id, w, h, x, y)
    },
    [windowsStore]
  )

  /**
   * Handle drag from maximized state
   */
  const dragFromMaximized = useCallback(
    (id: string, x: number, y: number, w: number, h: number) => {
      // Validate inputs to prevent NaN
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
        console.warn('Invalid window parameters in dragFromMaximized:', { x, y, w, h })
        return
      }
      windowsStore.updateWindow(id, {
        maximized: false,
        prev: undefined,
        x,
        y,
        w,
        h,
      })
      windowsStore.focusWindow(id)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  /**
   * Toggle launcher
   */
  const toggleLauncher = useCallback(() => {
    setShowLauncher((prev) => !prev)
  }, [])

  /**
   * Toggle quick agent dialog
   */
  const toggleQuickAgent = useCallback(() => {
    const isAgentOpen = windowsStore
      .getWindowsByAppId('agent')
      .some((w) => !w.minimized)

    if (!isAgentOpen) {
      setShowQuickAgent((prev) => !prev)
    } else {
      const agentWin = windowsStore.getWindowsByAppId('agent')[0]
      if (agentWin) {
        windowsStore.focusWindow(agentWin.id)
      }
    }
  }, [windowsStore])

  /**
   * Show desktop (minimize all windows)
   */
  const showDesktop = useCallback(() => {
    setShowLauncher(false)
    windowsStore.setAnimating(true)
    windowsStore.getVisibleWindows().forEach((w) => windowsStore.minimizeWindow(w.id))
    setTimeout(() => windowsStore.setAnimating(false), 400)
  }, [windowsStore])

  /**
   * Handle window title change
   */
  const changeWindowTitle = useCallback(
    (id: string, title: string) => {
      windowsStore.updateWindow(id, { title })
    },
    [windowsStore]
  )

  // Initialize persisted windows
  useEffect(() => {
    const loadPersistedWindows = async () => {
      const windows = windowsStore.windows

      const seen = new Set<string>()
      for (const w of windows) {
        if (seen.has(w.appId)) continue
        seen.add(w.appId)

        const app = getApp(w.appId)
        if (!app) continue

        try {
          const Comp = await loadApp(w.appId)
          windowsStore.updateWindow(w.id, {
            content: <Comp />,
          })
        } catch (error) {
          console.error(`Failed to load app ${w.appId}:`, error)
        }
      }

      setPersistLoaded(true)
    }

    loadPersistedWindows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getApp])

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      windowsStore.windows.forEach((w) => {
        const { minW, minH } = getAppMinDimensions(w.appId)
        const dockLeft = 12
        const dockWidth = 60
        const dockGap = 0
        const statusH = 0

        if (w.maximized) {
          const x = dockLeft + dockWidth + dockGap
          const wmax = Math.max(minW, W - x)
          const hmax = H - statusH
          if (w.w !== wmax || w.h !== hmax || w.x !== x || w.y !== 0) {
            windowsStore.updateWindow(w.id, { w: wmax, h: hmax, x, y: 0 })
          }
        } else {
          // Keep non-maximized windows visible
          let currentW = Math.max(minW, w.w)
          let currentH = Math.max(minH, w.h)

          if (currentW > W) currentW = Math.max(minW, W)
          if (currentH > H) currentH = Math.max(minH, H)

          const limitMinX = 30 - currentW
          const limitMaxX = W - 30
          const limitMinY = -1
          const limitMaxY = H - 30 - statusH

          const nx = Math.max(limitMinX, Math.min(w.x, limitMaxX))
          const ny = Math.max(limitMinY, Math.min(w.y, limitMaxY))

          if (nx !== w.x || ny !== w.y || currentW !== w.w || currentH !== w.h) {
            windowsStore.updateWindow(w.id, { x: nx, y: ny, w: currentW, h: currentH })
          }
        }
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAppMinDimensions])

  // Subscribe to desktop events
  useEffect(() => {
    const unsubOpenApp = subscribeOpenApp(async (id, args) => {
      if (id === 'agent') {
        options.onAgentAppOpen?.()
        setShowQuickAgent(false)
      }

      await openWindow({ appId: id, args })
    })

    const unsubWinAction = subscribeWinAction((id, action) => {
      switch (action) {
        case 'minimize':
          minimizeWindow(id)
          break
        case 'toggleMax':
          toggleMaximize(id)
          break
        case 'close':
          closeWindow(id)
          break
      }
    })

    const unsubShowDesktop = subscribeShowDesktop(showDesktop)
    const unsubLauncher = subscribeLauncher(toggleLauncher)

    // Keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault()
        setShowLauncher(true)
      } else if (e.key === 'Escape') {
        setShowLauncher(false)
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      unsubOpenApp()
      unsubWinAction()
      unsubShowDesktop()
      unsubLauncher()
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openWindow,
    minimizeWindow,
    toggleMaximize,
    closeWindow,
    showDesktop,
    toggleLauncher,
    options,
  ])

  return {
    // State
    windows: windowsStore.windows,
    zOrder: windowsStore.zOrder,
    animating: windowsStore.animating,
    showLauncher,
    showQuickAgent,
    persistLoaded,
    apps,

    // Actions
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    moveWindow,
    resizeWindow,
    dragFromMaximized,
    toggleLauncher,
    toggleQuickAgent,
    showDesktop,
    changeWindowTitle,

    // Helpers
    getApp,
    getAppMinDimensions,
  }
}
