import React, { useState, useEffect } from 'react'
import Launcher from './Launcher'
import Taskbar from './Taskbar'
import Window from './Window'
import { QuickAgentDialog } from './QuickAgentDialog'
import { setMaximizedWindow } from '../../shared/sdk/desktop'
import { useWindowSystem } from '../../shared/hooks/useWindowSystem'
import { Loader2 } from 'lucide-react'

export default function WindowManager() {
  const {
    windows,
    zOrder,
    animating,
    showLauncher,
    showQuickAgent,
    persistLoaded,
    apps,
    focusWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    moveWindow,
    resizeWindow,
    dragFromMaximized,
    changeWindowTitle,
    toggleLauncher,
    toggleQuickAgent,
    showDesktop: _showDesktop,
    getApp,
    getAppMinDimensions,
    openWindow,
  } = useWindowSystem({
    onAgentAppOpen: () => {
      // Agent app opened handler
    },
  })

  const handleLauncherOpen = (
    id: string,
    title: string,
    Comp: React.ComponentType<any> | undefined,
    iconUrl?: string
  ) => {
    const app = getApp(id)
    if (!app) {
      // Placeholder for unknown app
      const Placeholder = () => (
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>未安装的应用</h3>
          <div>应用 ID：{id}</div>
          <div style={{ marginTop: 10, color: 'var(--muted)' }}>
            这是占位窗口，用于验证 Dock 点击行为。
          </div>
        </div>
      )
      return
    }

    // Use AppLoader for async loading
    const content = Comp ? <Comp /> : <AppLoader appId={id} />

    openWindow({
      appId: id,
      title,
      content,
      iconUrl,
    })
  }

  const handleLauncherClose = () => {
    toggleLauncher()
  }

  const handleOpenFullApp = (messages: any[]) => {
    openWindow({
      appId: 'agent',
      args: { initialMessages: messages },
    })
  }

  // Update maximized window in SDK
  React.useEffect(() => {
    const maxWin = windows.find((w) => w.maximized && w.id === zOrder[zOrder.length - 1])
    if (maxWin) {
      setMaximizedWindow({ id: maxWin.id, title: maxWin.title })
    } else {
      setMaximizedWindow(null)
    }
  }, [windows, zOrder])

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <Launcher
        isOpen={showLauncher}
        onOpen={handleLauncherOpen}
        onClose={handleLauncherClose}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
        onScroll={(e) => {
          e.currentTarget.scrollTop = 0
          e.currentTarget.scrollLeft = 0
        }}
      >
        {windows.map((w) => {
          if (w.minimized) return null

          const z = zOrder.indexOf(w.id) + 10
          const app = getApp(w.appId)
          const { minW, minH } = getAppMinDimensions(w.appId)

          return (
            <Window
              key={w.id}
              id={w.id}
              title={w.title}
              content={w.content}
              iconUrl={w.iconUrl}
              appId={w.appId}
              x={w.x}
              y={w.y}
              w={w.w}
              h={w.h}
              minimized={w.minimized}
              maximized={w.maximized}
              zIndex={z}
              onFocus={focusWindow}
              onClose={closeWindow}
              onMinimize={minimizeWindow}
              onMaximize={toggleMaximize}
              onMove={moveWindow}
              onResize={resizeWindow}
              onDragFromMaximized={dragFromMaximized}
              restoreRect={w.prev}
              minW={minW}
              minH={minH}
              onTitleChange={changeWindowTitle}
            />
          )
        })}
      </div>

      <Taskbar
        wins={windows.map((w) => ({
          id: w.id,
          title: w.title,
          minimized: w.minimized,
          iconUrl: w.iconUrl,
          appId: w.appId,
        }))}
        onFocus={focusWindow}
        onRestore={restoreWindow}
        onMinimize={minimizeWindow}
        onOpenLauncher={toggleLauncher}
        onOpenApp={(id, args) => {
          openWindow({ appId: id, args })
        }}
        isLauncherOpen={showLauncher}
        onCloseLauncher={handleLauncherClose}
        zOrder={zOrder}
        onToggleQuickAgent={toggleQuickAgent}
      />

      <QuickAgentDialog
        visible={showQuickAgent}
        onClose={toggleQuickAgent}
        onOpenFullApp={handleOpenFullApp}
      />
    </div>
  )
}

/**
 * App Loader Component
 */
function AppLoader({ appId, args, onLoaded }: { appId: string; args?: any; onLoaded?: () => void }) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    import('../../framework/registry').then(({ loadApp }) => {
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
    })
    return () => { mounted = false }
  }, [appId])

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          color: 'red',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        应用加载失败: {error}
      </div>
    )
  }

  if (!Comp) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          background: 'rgba(255,255,255,0.5)',
        }}
      >
        <Loader2
          className="animate-spin"
          size={32}
          color="#2563eb"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      </div>
    )
  }

  return <Comp {...args} />
}
