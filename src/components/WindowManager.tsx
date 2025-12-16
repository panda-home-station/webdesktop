import React, { useCallback, useMemo, useState } from 'react'
import { listApps, loadApp } from '../apps/registry'
import { requestPermission } from '../sdk/permissions'
import Launcher from './Launcher'
import Taskbar from './Taskbar'
import { notify } from '../sdk/notify'
import { subscribeOpenApp, setMaximizedWindow, subscribeWinAction } from '../sdk/desktop'
import { getPersistWins, setPersistWins, getPersistZOrder, setPersistZOrder } from '../state/windows'

type Win = {
  id: string
  title: string
  content: React.ReactNode
  appId?: string
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
  const [showLauncher, setShowLauncher] = useState<boolean>(false)
  const [zOrder, setZOrder] = useState<string[]>([])
  const [autoOpened, setAutoOpened] = useState<boolean>(false)
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
    let newId = w.id
    setWins(x => {
      const uid = ensureUniqueId(w.id, x)
      newId = uid
      return [...x, { ...w, id: uid, x: 60, y: 60, w: w.w ?? defW, h: w.h ?? defH }]
    })
    setZOrder(x => [...x.filter(id => id !== newId), newId])
    notify(`已打开 ${w.title}`)
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
    setWins(ws => ws.map(w => (w.id === id ? { ...w, minimized: true } : w)))
  }, [])
  const restore = useCallback((id: string) => {
    setWins(ws => ws.map(w => (w.id === id ? { ...w, minimized: false } : w)))
    bringToFront(id)
  }, [bringToFront])
  const setSize = useCallback((id: string, w_: number, h_: number) => {
    setWins(ws => ws.map(w => {
      if (w.id !== id) return w
      const a = apps.find(x => x.id === w.appId)
      const minW = (a as any)?.minW ?? 300
      const minH = (a as any)?.minH ?? 200
      return { ...w, w: Math.max(minW, w_), h: Math.max(minH, h_) }
    }))
  }, [])
  const toggleMaximize = useCallback((id: string) => {
    setWins(ws =>
      ws.map(w => {
        if (w.id !== id) return w
        if (!w.maximized) {
          const prev = { x: w.x ?? 0, y: w.y ?? 0, w: w.w ?? 600, h: w.h ?? 400 }
          const statusH = 32
          const W = window.innerWidth
          const H = window.innerHeight - statusH
          return { ...w, prev, x: 0, y: 0, w: W, h: H, maximized: true }
        } else {
          const p = w.prev ?? { x: 60, y: 60, w: 600, h: 400 }
          return { ...w, x: p.x, y: p.y, w: p.w, h: p.h, maximized: false, prev: undefined }
        }
      })
    )
    bringToFront(id)
  }, [bringToFront])

  const toolbar = useMemo(() => {
    return null
  }, [])

  const openById = useCallback(async (id: string) => {
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
    const pw = getPersistWins()
    const pz = getPersistZOrder()
    setZOrder(pz)
    ;(async () => {
      for (const w of pw) {
        if (!w.appId) continue
        const a = apps.find(x => x.id === w.appId)
        if (!a) continue
        const Comp = await loadApp(a.id)
        const baseId = w.id || `${a.id}-${Date.now()}`
        setWins(x => {
          const uid = ensureUniqueId(baseId, x)
          return [...x, { id: uid, title: w.title || a.title, content: <Comp />, appId: a.id, iconUrl: w.iconUrl ?? a.iconUrl, x: w.x ?? 60, y: w.y ?? 60, w: w.w ?? 600, h: w.h ?? 400, minimized: !!w.minimized, maximized: !!w.maximized }]
        })
      }
      setPersistLoaded(true)
    })()
    const unsub = subscribeOpenApp(async (id) => {
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
      open({ id: `${a.id}-${Date.now()}`, title: a.title, content: <Comp />, appId: a.id, iconUrl: a.iconUrl })
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
    return () => unsub()
  }, [minimize, toggleMaximize, close])
React.useEffect(() => {
  const ws = wins.map(w => ({ id: w.id, title: w.title, appId: w.appId, iconUrl: w.iconUrl, x: w.x, y: w.y, w: w.w, h: w.h, minimized: w.minimized, maximized: w.maximized }))
  setPersistWins(ws)
}, [wins])

React.useEffect(() => {
  setPersistZOrder(zOrder)
}, [zOrder])

React.useEffect(() => {
  // 不自动打开任何应用，严格按照持久化状态恢复
}, [persistLoaded, wins, apps, open, autoOpened])

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {toolbar}
      {showLauncher && (
        <Launcher
          onOpen={(id, title, Comp, iconUrl) => open({ id: `${id}-${Date.now()}`, title, content: <Comp />, appId: id, iconUrl })}
          onClose={() => setShowLauncher(false)}
        />
      )}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {wins.map(w => {
          if (w.minimized) return null
          const z = zOrder.indexOf(w.id) + 10
          return (
            <div
              key={w.id}
              style={{
                position: 'absolute',
                top: w.y ?? 60,
                left: w.x ?? 60,
                width: w.w ?? 600,
                height: w.h ?? 400,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--win-bg)',
                borderLeft: '1px solid var(--win-border)',
                borderRight: '1px solid var(--win-border)',
                borderBottom: '1px solid var(--win-border)',
                borderTop: w.maximized ? 'none' : '1px solid var(--win-border)',
                borderRadius: 'var(--win-radius)',
                boxShadow: 'var(--win-shadow)',
                backdropFilter: 'blur(22px)',
                zIndex: z
              }}
              onMouseDown={() => bringToFront(w.id)}
            >
              {!w.maximized && (
                <div
                  className="puter-titlebar"
                  style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'move', borderTopLeftRadius: 'var(--win-radius)', borderTopRightRadius: 'var(--win-radius)', userSelect: 'none' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startX = e.clientX
                    const startY = e.clientY
                    const initX = w.x ?? 60
                    const initY = w.y ?? 60
                    const move = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX
                      const dy = ev.clientY - startY
                      const pad = 0
                      const W = window.innerWidth
                      const H = window.innerHeight - 32
                      const ww = w.w ?? 600
                      const hh = w.h ?? 400
                      const nx = Math.max(pad, Math.min(initX + dx, W - ww - pad))
                      const ny = Math.max(0, Math.min(initY + dy, H - hh - pad))
                      setPos(w.id, nx, ny)
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                  onDoubleClick={() => toggleMaximize(w.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {w.iconUrl ? (
                      <img src={w.iconUrl} alt="" width={16} height={16} style={{ borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(0,0,0,0.08)' }} />
                    )}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.title}</span>
                  </div>
                  <div className="win-ctl" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <button
                      className="win-btn"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => minimize(w.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24">
                        <rect x="5" y="12" width="14" height="2" rx="1" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      className="win-btn"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => toggleMaximize(w.id)}
                    >
                      {w.maximized ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                          <rect x="10" y="10" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                    </button>
                    <button
                      className="win-btn close"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => close(w.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, color: 'var(--text)', position: 'relative', overflow: 'auto', background: '#ffffff', borderBottomLeftRadius: 'var(--win-radius)', borderBottomRightRadius: 'var(--win-radius)' }}>
                {w.content}
                <div
                  style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize', background: 'transparent', zIndex: 5 }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startX = e.clientX
                    const startY = e.clientY
                    const initW = w.w ?? 600
                    const initH = w.h ?? 400
                    const move = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX
                      const dy = ev.clientY - startY
                      setSize(w.id, initW + dx, initH + dy)
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                />
                <div
                  style={{ position: 'absolute', left: 0, bottom: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startX = e.clientX
                    const startY = e.clientY
                    const initW = w.w ?? 600
                    const initH = w.h ?? 400
                    const initX = w.x ?? 60
                    const move = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX
                      const dy = ev.clientY - startY
                      const a = apps.find(x => x.id === w.appId)
                      const minW = (a as any)?.minW ?? 300
                      const minH = (a as any)?.minH ?? 200
                      const nextW = Math.max(minW, initW - dx)
                      const nextH = Math.max(minH, initH + dy)
                      setWins(ws => ws.map(ww => ww.id === w.id ? { ...ww, w: nextW, h: nextH, x: initX + dx } : ww))
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                />
                <div
                  style={{ position: 'absolute', left: 0, top: 0, width: 14, height: 14, cursor: 'nwse-resize' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startX = e.clientX
                    const startY = e.clientY
                    const initW = w.w ?? 600
                    const initH = w.h ?? 400
                    const initX = w.x ?? 60
                    const initY = w.y ?? 60
                    const move = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX
                      const dy = ev.clientY - startY
                      const a = apps.find(x => x.id === w.appId)
                      const minW = (a as any)?.minW ?? 300
                      const minH = (a as any)?.minH ?? 200
                      const nextW = Math.max(minW, initW - dx)
                      const nextH = Math.max(minH, initH - dy)
                      setWins(ws => ws.map(ww => ww.id === w.id ? { ...ww, w: nextW, h: nextH, x: initX + dx, y: initY + dy } : ww))
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                />
                <div
                  style={{ position: 'absolute', right: 0, top: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startX = e.clientX
                    const startY = e.clientY
                    const initW = w.w ?? 600
                    const initH = w.h ?? 400
                    const initY = w.y ?? 60
                    const move = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX
                      const dy = ev.clientY - startY
                      const a = apps.find(x => x.id === w.appId)
                      const minW = (a as any)?.minW ?? 300
                      const minH = (a as any)?.minH ?? 200
                      const nextW = Math.max(minW, initW + dx)
                      const nextH = Math.max(minH, initH - dy)
                      setWins(ws => ws.map(ww => ww.id === w.id ? { ...ww, w: nextW, h: nextH, y: initY + dy } : ww))
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                />
                <div
                  style={{ position: 'absolute', left: 0, top: 0, width: 10, height: '100%', cursor: 'ew-resize' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startX = e.clientX
                    const initW = w.w ?? 600
                    const initX = w.x ?? 60
                    const move = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX
                      const a = apps.find(x => x.id === w.appId)
                      const minW = (a as any)?.minW ?? 300
                      const nextW = Math.max(minW, initW - dx)
                      setWins(ws => ws.map(ww => ww.id === w.id ? { ...ww, w: nextW, x: initX + dx } : ww))
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                />
                <div
                  style={{ position: 'absolute', right: 0, top: 0, width: 10, height: '100%', cursor: 'ew-resize' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startX = e.clientX
                    const initW = w.w ?? 600
                    const move = (ev: MouseEvent) => {
                      const dx = ev.clientX - startX
                      const a = apps.find(x => x.id === w.appId)
                      const minW = (a as any)?.minW ?? 300
                      const nextW = Math.max(minW, initW + dx)
                      setWins(ws => ws.map(ww => ww.id === w.id ? { ...ww, w: nextW } : ww))
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                />
                <div
                  style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 8, cursor: 'ns-resize' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (w.maximized) return
                    const startY = e.clientY
                    const initH = w.h ?? 400
                    const move = (ev: MouseEvent) => {
                      const dy = ev.clientY - startY
                      const a = apps.find(x => x.id === w.appId)
                      const minH = (a as any)?.minH ?? 200
                      const nextH = Math.max(minH, initH + dy)
                      setWins(ws => ws.map(ww => ww.id === w.id ? { ...ww, h: nextH } : ww))
                    }
                    const up = () => {
                      document.removeEventListener('mousemove', move)
                      document.removeEventListener('mouseup', up)
                    }
                    document.addEventListener('mousemove', move)
                    document.addEventListener('mouseup', up)
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <Taskbar
        wins={wins.map(w => ({ id: w.id, title: w.title, minimized: w.minimized, iconUrl: w.iconUrl, appId: w.appId }))}
        onFocus={bringToFront}
        onRestore={restore}
        onOpenLauncher={() => setShowLauncher(true)}
        onOpenApp={openById}
      />
    </div>
  )
}
