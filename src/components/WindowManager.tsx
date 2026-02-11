import React, { useCallback, useRef, useState } from 'react'
import { listApps, loadApp } from '../apps/registry'
import { requestPermission } from '../sdk/permissions'
import Launcher from './Launcher'
import Taskbar from './Taskbar'
import Window from './Window'
import { subscribeOpenApp, setMaximizedWindow, subscribeWinAction, subscribeShowDesktop, subscribeLauncher, setAnimating } from '../sdk/desktop'
import { getPersistWins, setPersistWins, getPersistZOrder, setPersistZOrder } from '../state/windows'

type Win = {
  id: string
  title: string
  content: React.ReactNode
  appId: string
  iconUrl?: string
  x?: number
  y?: number
  w?: number
  h?: number
  minimized?: boolean
  maximized?: boolean
  prev?: { x: number; y: number; w: number; h: number }
}

export default function WindowManager() {
  const [wins, setWins] = useState<Win[]>([])
  const winsRef = useRef<Win[]>([])
  const [showLauncher, setShowLauncher] = useState<boolean>(false)
  const [zOrder, setZOrder] = useState<string[]>([])
  const [persistLoaded, setPersistLoaded] = useState<boolean>(false)
  const apps = listApps()

  const ensureUniqueId = (id: string, existing: Win[]) => {
    if (!existing.some(xx => xx.id === id)) return id
    let suffix = 1
    let next = `${id}-${suffix}`
    while (existing.some(xx => xx.id === next)) {
      suffix++
      next = `${id}-${suffix}`
    }
    return next
  }

  const open = useCallback((w: Win) => {
    const a = apps.find(x => x.id === w.appId)
    const minW = (a as any)?.minW ?? 300
    const minH = (a as any)?.minH ?? 200
    const defW = Math.max(600, minW)
    const defH = Math.max(400, minH)
    const dockLeft = 12
    const dockWidth = 60
    const openGap = 24
    const screenW = window.innerWidth
    const screenH = window.innerHeight
    const centerX = Math.round((screenW - (w.w ?? defW)) / 2)
    const centerY = Math.round((screenH - (w.h ?? defH)) / 2)
    const minX = dockLeft + dockWidth + openGap
    const minY = 60
    const baseOffsetX = 120
    const baseOffsetY = 80
    const initX = Math.max(minX, centerX - baseOffsetX)
    const initY = Math.max(minY, centerY - baseOffsetY)
    const gap = 28
    const width = w.w ?? defW
    const height = w.h ?? defH
    const maxX = Math.max(minX, screenW - width - 12)
    const maxY = Math.max(minY, screenH - height - 12)

    const existing = winsRef.current.find(ww => ww.appId === w.appId)
    if (existing) {
      setWins(ws => ws.map(ww => (ww.id === existing.id ? { ...ww, minimized: false, content: w.content } : ww)))
      setZOrder(z => [...z.filter(id => id !== existing.id), existing.id])
      return
    }

    let newId = w.id
    setWins(x => {
      const uid = ensureUniqueId(w.id, x)
      newId = uid
      
      // Calculate position with collision detection
      let cx = initX
      let cy = initY
      let tries = 0
      const maxTries = 100
      
      while (tries < maxTries) {
        // Check if any visible window is close to this position
        // "Close" means top-left corner is within a small threshold
        const collision = x.some(win => {
          if (win.minimized || win.maximized) return false
          const wx = win.x ?? 60
          const wy = win.y ?? 60
          return Math.abs(wx - cx) < 10 && Math.abs(wy - cy) < 10
        })
        
        if (!collision) break
        
        cx += gap
        cy += gap
        tries++
        
        // If we drift too far, reset to initial position (or handle as edge case)
        // For now we just clamp later
        if (cx > maxX || cy > maxY) {
             // If cascade goes off screen, maybe just put it at initX + random or just clamp
             // A simple strategy is to let it clamp, or wrap around. 
             // Let's just let it clamp at the end, but the loop continues to find 'logical' offsets
        }
      }

      const nx = Math.max(minX, Math.min(cx, maxX))
      const ny = Math.max(minY, Math.min(cy, maxY))
      return [...x, { ...w, id: uid, x: nx, y: ny, w: width, h: height }]
    })
    setZOrder(x => [...x.filter(id => id !== newId), newId])
  }, [apps])

  const close = useCallback((id: string) => {
    setWins(x => x.filter(w => w.id !== id))
    setZOrder(x => x.filter(z => z !== id))
  }, [])

  const bringToFront = useCallback((id: string) => {
    setZOrder(x => [...x.filter(z => z !== id), id])
  }, [])

  const setPos = useCallback((id: string, x: number, y: number) => {
    setWins(ws => ws.map(w => (w.id === id ? { ...w, x, y } : w)))
  }, [])

  const minimize = useCallback((id: string) => {
    setAnimating(true)
    setWins(ws => ws.map(w => (w.id === id ? { ...w, minimized: true } : w)))
    setTimeout(() => setAnimating(false), 300)
  }, [])

  const restore = useCallback((id: string) => {
    setAnimating(true)
    setWins(ws => ws.map(w => (w.id === id ? { ...w, minimized: false } : w)))
    bringToFront(id)
    setTimeout(() => setAnimating(false), 300)
  }, [bringToFront])

  const handleResize = useCallback((id: string, w_: number, h_: number, x_?: number, y_?: number) => {
    setWins(ws => ws.map(w => {
      if (w.id !== id) return w
      return { ...w, w: w_, h: h_, x: x_ ?? w.x, y: y_ ?? w.y }
    }))
  }, [])

  const handleDragFromMaximized = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    setWins(ws => ws.map(win => {
      if (win.id !== id) return win
      return { ...win, maximized: false, prev: undefined, x, y, w, h }
    }))
    bringToFront(id)
  }, [bringToFront])

  const toggleMaximize = useCallback((id: string) => {
    setAnimating(true)
    setWins(ws =>
      ws.map(w => {
        if (w.id !== id) return w
        if (!w.maximized) {
          const prev = { x: w.x ?? 0, y: w.y ?? 0, w: w.w ?? 600, h: w.h ?? 400 }
          const dockLeft = 12
          const dockWidth = 60
          const dockGap = 0
          const H = window.innerHeight
          const W = window.innerWidth
          const x = dockLeft + dockWidth + dockGap
          const wmax = Math.max(300, W - x)
          return { ...w, prev, x, y: 0, w: wmax, h: H, maximized: true }
        } else {
          const p = w.prev ?? { x: 60, y: 60, w: 600, h: 400 }
          return { ...w, x: p.x, y: p.y, w: p.w, h: p.h, maximized: false, prev: undefined }
        }
      })
    )
    bringToFront(id)
    setTimeout(() => setAnimating(false), 300)
  }, [bringToFront])

  const openById = useCallback(async (id: string) => {
    const existing = winsRef.current.find(w => w.appId === id)
    if (existing) {
      setWins(ws => ws.map(ww => (ww.id === existing.id ? { ...ww, minimized: false } : ww)))
      setZOrder(z => [...z.filter(eid => eid !== existing.id), existing.id])
      return
    }
    const a = apps.find(x => x.id === id)
    if (!a) {
      const Placeholder = () => (
        <div style={{ padding: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>未安装的应用</h3>
          <div>应用 ID：{id}</div>
          <div style={{ marginTop: 10, color: 'var(--muted)' }}>这是占位窗口，用于验证 Dock 点击行为。</div>
        </div>
      )
      open({ id: `${id}-${Date.now()}`, title: id, content: <Placeholder />, appId: id })
      return
    }
    const Comp = await loadApp(a.id)
    open({ id: `${a.id}-${Date.now()}`, title: a.title, content: <Comp />, appId: a.id, iconUrl: a.iconUrl })
  }, [apps, open])

  React.useEffect(() => {
    const handleResize = () => {
      setWins(ws => ws.map(w => {
        const dockLeft = 12
        const dockWidth = 60
        const dockGap = 0
        const statusH = 0
        const W = window.innerWidth
        const H = window.innerHeight - statusH

        if (w.maximized) {
          const x = dockLeft + dockWidth + dockGap
          const wmax = Math.max(300, W - x)
          if (w.w !== wmax || w.h !== H || w.x !== x || w.y !== 0) {
            return { ...w, w: wmax, h: H, x, y: 0 }
          }
          return w
        }

        // Keep non-maximized windows visible
        const currentW = w.w ?? 600
        const currentX = w.x ?? 60
        const currentY = w.y ?? 60

        // Allow dragging out of bounds but with limits
        // Left/Right: keep 30px visible
        // Top: >= 0
        // Bottom: Keep title bar visible (y <= H - 30)
        const minX = 30 - currentW
        const maxX = W - 30
        const minY = 0
        const maxY = H - 30

        const nx = Math.max(minX, Math.min(currentX, maxX))
        const ny = Math.max(minY, Math.min(currentY, maxY))

        if (nx !== currentX || ny !== currentY) {
          return { ...w, x: nx, y: ny }
        }
        return w
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  React.useEffect(() => {
    const pw = getPersistWins()
    const pz = getPersistZOrder()
    setZOrder(pz)
    ;(async () => {
      const seen = new Set<string>()
      for (const w of pw) {
        if (seen.has(w.appId)) continue
        seen.add(w.appId)
        const a = apps.find(x => x.id === w.appId)
        if (!a) continue
        const Comp = await loadApp(a.id)
        const baseId = w.id || `${a.id}-${Date.now()}`
        setWins(x => {
          if (x.some(xx => xx.appId === w.appId)) return x
          const uid = ensureUniqueId(baseId, x)
          return [...x, { id: uid, title: w.title || a.title, content: <Comp />, appId: a.id, iconUrl: w.iconUrl ?? a.iconUrl, x: w.x ?? 60, y: w.y ?? 60, w: w.w ?? 600, h: w.h ?? 400, minimized: !!w.minimized, maximized: !!w.maximized }]
        })
      }
      setPersistLoaded(true)
    })()

    const unsub = subscribeOpenApp(async (id, args) => {
      const existing = winsRef.current.find(w => w.appId === id)
      if (existing && !args) {
        setWins(ws => ws.map(ww => (ww.id === existing.id ? { ...ww, minimized: false } : ww)))
        setZOrder(z => [...z.filter(eid => eid !== existing.id), existing.id])
        return
      }
      const a = apps.find(x => x.id === id)
      if (!a) return
      const caps = (a as any).capabilities as string[] | undefined
      if (Array.isArray(caps)) {
        for (const cap of caps) {
          const ok = requestPermission(a.id, cap)
          if (!ok) return
        }
      }
      const Comp = await loadApp(a.id)
      open({ id: `${a.id}-${Date.now()}`, title: a.title, content: <Comp {...args} />, appId: a.id, iconUrl: a.iconUrl })
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault()
        setShowLauncher(true)
      } else if (e.altKey && e.code === 'Tab') {
        e.preventDefault()
        if (!zOrder.length) return
        const first = zOrder[0]
        setZOrder((z) => [...z.slice(1), first])
      } else if (e.key === 'Escape') {
        setShowLauncher(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      unsub()
    }
  }, [])

  React.useEffect(() => {
    winsRef.current = wins
  }, [wins])

  React.useEffect(() => {
    const maxId = zOrder.find(id => wins.find(w => w.id === id && w.maximized))
    if (maxId) {
      const w = wins.find(ww => ww.id === maxId)!
      setMaximizedWindow({ id: w.id, title: w.title })
    } else {
      setMaximizedWindow(null)
    }
  }, [wins, zOrder])

  React.useEffect(() => {
    const unsub = subscribeWinAction((id, action) => {
      if (action === 'minimize') {
        minimize(id)
      } else if (action === 'toggleMax') {
        toggleMaximize(id)
      } else if (action === 'close') {
        close(id)
      }
    })
    const unsubShow = subscribeShowDesktop(() => {
      setShowLauncher(false)
      setAnimating(true)
      setWins(ws => ws.map(w => ({ ...w, minimized: true })))
      setTimeout(() => setAnimating(false), 400)
    })
    const unsubLaunch = subscribeLauncher(() => {
      setShowLauncher(true)
    })
    return () => {
      unsub()
      unsubShow()
      unsubLaunch()
    }
  }, [minimize, toggleMaximize, close])

  React.useEffect(() => {
    const raw = wins.map(w => ({ id: w.id, title: w.title, appId: w.appId, iconUrl: w.iconUrl, x: w.x, y: w.y, w: w.w, h: w.h, minimized: w.minimized, maximized: w.maximized }))
    const uniq: typeof raw = []
    const seen = new Set<string>()
    for (const w of raw) {
      if (seen.has(w.appId)) continue
      seen.add(w.appId)
      uniq.push(w)
    }
    setPersistWins(uniq)
  }, [wins])

  React.useEffect(() => {
    setPersistZOrder(zOrder)
  }, [zOrder])

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <Launcher
        isOpen={showLauncher}
        onOpen={(id, title, Comp, iconUrl) => open({ id: `${id}-${Date.now()}`, title, content: <Comp />, appId: id, iconUrl })}
        onClose={() => setShowLauncher(false)}
      />
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {wins.map(w => {
          if (w.minimized) return null
          const z = zOrder.indexOf(w.id) + 10
          const a = apps.find(x => x.id === w.appId)
          const minW = (a as any)?.minW
          const minH = (a as any)?.minH
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
              onFocus={bringToFront}
              onClose={close}
              onMinimize={minimize}
              onMaximize={toggleMaximize}
              onMove={setPos}
              onResize={handleResize}
              onDragFromMaximized={handleDragFromMaximized}
              restoreRect={w.prev}
              minW={minW}
              minH={minH}
            />
          )
        })}
      </div>
      <Taskbar
        wins={wins.map(w => ({ id: w.id, title: w.title, minimized: w.minimized, iconUrl: w.iconUrl, appId: w.appId }))}
        onFocus={bringToFront}
        onRestore={restore}
        onOpenLauncher={() => {
            setShowLauncher(v => !v)
        }}
        onOpenApp={openById}
        isLauncherOpen={showLauncher}
        onCloseLauncher={() => setShowLauncher(false)}
      />
    </div>
  )
}
