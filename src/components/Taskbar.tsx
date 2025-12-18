import React, { useEffect, useState } from 'react'
import { listApps } from '../apps/registry'
import { openApp, showDesktop, subscribeFileTasks, getFileTasks, clearCompletedFileTasks, FileTask } from '../sdk/desktop'

type WinItem = {
  id: string
  title: string
  minimized?: boolean
  iconUrl?: string
  appId?: string
}

type Props = {
  wins: WinItem[]
  onFocus: (id: string) => void
  onRestore: (id: string) => void
  onOpenLauncher: () => void
  onOpenApp: (id: string) => void
  isLauncherOpen?: boolean
  onCloseLauncher?: () => void
}

export default function Taskbar({ wins, onFocus, onRestore, onOpenLauncher, onOpenApp, isLauncherOpen, onCloseLauncher }: Props) {
  const apps = listApps()
  const byApp: Record<string, WinItem[]> = {}
  for (const w of wins) {
    const aid = w.appId || ''
    if (!aid) continue
    byApp[aid] = byApp[aid] || []
    byApp[aid].push(w)
  }
  const runningAppIds = Object.keys(byApp)
  const isRunning = (id?: string) => !!(id && byApp[id] && byApp[id].length > 0)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [showTasks, setShowTasks] = useState(false)
  const [tasks, setTasks] = useState<FileTask[]>([])
  useEffect(() => {
    setTasks(getFileTasks())
    const unsub = subscribeFileTasks(setTasks)
    return () => unsub()
  }, [])
  const showTip = (text: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setTip({ text, x: r.right + 6, y: r.top + r.height / 2 })
  }
  const focusOrOpen = (appId: string) => {
    const arr = byApp[appId]
    if (arr && arr.length > 0) {
      const w = arr.find(x => !x.minimized) || arr[0]
      if (w.minimized) onRestore(w.id)
      else onFocus(w.id)
    } else {
      openApp(appId)
    }
  }
  return (
    <div
      className="puter-taskbar"
      style={{
        position: 'fixed',
        left: 6,
        top: 32,
        bottom: 32,
        width: 60,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 8px',
        borderRadius: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 10000,
        backdropFilter: 'blur(8px)',
        background: 'rgba(255,255,255,0.25)',
      }}
      onMouseDownCapture={(e) => {
        const t = e.target as HTMLElement
        if (!t.closest('.dock-item') && isLauncherOpen && onCloseLauncher) {
          onCloseLauncher()
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button
          className="dock-item"
          title="显示桌面"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            showDesktop()
          }}
          onMouseEnter={(e) => showTip('显示桌面', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <rect x="4" y="6" width="16" height="12" rx="2" fill="#64748b" />
            <path d="M4 18h16" stroke="#94a3b8" strokeWidth="2" />
          </svg>
        </button>
        <button
          className="dock-item"
          title="全部应用"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer', position: 'relative' }}
          onClick={onOpenLauncher}
          onMouseEnter={(e) => showTip('全部应用', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <rect x="4" y="4" width="6" height="6" rx="2" fill="#60a5fa" />
            <rect x="14" y="4" width="6" height="6" rx="2" fill="#34d399" />
            <rect x="4" y="14" width="6" height="6" rx="2" fill="#f59e0b" />
            <rect x="14" y="14" width="6" height="6" rx="2" fill="#ef4444" />
          </svg>
          {isLauncherOpen && <span className="dock-dot dock-dot-active" />}
        </button>
      </div>
      <div style={{ width: '100%', height: 1, background: 'var(--win-border)', margin: '10px 0', opacity: 0.6 }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1, width: '100%' }}>
        {runningAppIds.map(id => {
          const a = apps.find(x => x.id === id)
          const arr = byApp[id] || []
          const title = a?.title || id
          const iconUrl = a?.iconUrl
          const anyMin = arr.find(x => x.minimized)
          const anyWin = arr.find(x => !x.minimized) || arr[0]
          return (
            <button
              key={`tb-${id}`}
              onClick={() => {
                if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
                if (anyMin && anyMin.id) onRestore(anyMin.id)
                else if (anyWin && anyWin.id) onFocus(anyWin.id)
                else {
                  openApp(id)
                }
              }}
              className="puter-button dock-item"
              title={title}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
              onMouseEnter={(e) => showTip(title, e.currentTarget)}
              onMouseLeave={() => setTip(null)}
            >
              {iconUrl ? <img src={iconUrl} alt="" width={22} height={22} style={{ borderRadius: 6 }} /> : <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,0.06)' }} />}
              <span className="dock-dot dock-dot-active" />
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button
          className="dock-item"
          title="文件任务"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            setShowTasks(v => !v)
          }}
          onMouseEnter={(e) => showTip('文件任务', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M4 6h8l2 2h6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" fill="#f59e0b" />
            <circle cx="9" cy="13" r="2" fill="#fff" />
            <path d="M13 16l3-3" stroke="#fff" strokeWidth="2" />
          </svg>
        </button>
        {showTasks && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
              onClick={() => setShowTasks(false)}
            />
            <div
              style={{
                position: 'fixed',
                left: 74,
                bottom: 32,
                width: 360,
                maxHeight: '70vh',
                overflow: 'auto',
                background: '#ffffff',
                borderRadius: 12,
                boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
                border: '1px solid var(--win-border)',
                padding: 12,
                transform: 'translateX(0)',
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                zIndex: 10001
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <strong>文件任务</strong>
                <button
                  className="puter-button"
                  style={{ height: 24, marginLeft: 'auto' }}
                  onClick={() => clearCompletedFileTasks()}
                >
                  清除已完成
                </button>
              </div>
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                {tasks.length === 0 ? (
                  <div style={{ color: 'var(--muted)' }}>暂无任务</div>
                ) : (
                  tasks.map(u => (
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px 60px', alignItems: 'center', gap: 8 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--muted)' }}>{u.dir}</div>
                      <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.max(0, u.progress ?? (u.status === 'done' ? 100 : 0)))}%`, height: '100%', background: '#60a5fa' }} />
                      </div>
                      <div style={{ textAlign: 'right', color: u.status === 'error' ? '#ef4444' : '#111827' }}>
                        {u.status === 'error' ? '失败' : u.status === 'done' ? '完成' : `${Math.min(100, Math.max(0, u.progress ?? 0))}%`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
        <button
          className="dock-item"
          title="通知"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            onOpenApp('notifications')
          }}
          onMouseEnter={(e) => showTip('通知', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M12 3a6 6 0 0 1 6 6v4l2 2H4l2-2V9a6 6 0 0 1 6-6z" fill="#60a5fa" />
            <circle cx="12" cy="20" r="2" fill="#93c5fd" />
          </svg>
        </button>
        <button
          className="dock-item"
          title="账号"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            focusOrOpen('user-center')
          }}
          onMouseEnter={(e) => showTip('我的账号', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" fill="#64748b" />
            <path d="M4 20a8 8 0 0 1 16 0" fill="#94a3b8" />
          </svg>
        </button>
        <button
          className="dock-item"
          title="设置"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            onOpenApp('settings')
          }}
          onMouseEnter={(e) => showTip('设置', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3.5" fill="#9ca3af" />
            <circle cx="12" cy="12" r="8" fill="none" stroke="#9ca3af" strokeWidth="2" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M5 19l1.5-1.5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {tip && (
        <div className="semi-portal" style={{ zIndex: 10002 }}>
          <div tabIndex={-1} className="semi-portal-inner" style={{ position: 'fixed', left: tip.x, top: tip.y, transform: 'translateY(-50%)' }}>
            <div className="semi-tooltip-wrapper semi-tooltip-wrapper-show semi-tooltip-with-arrow" role="tooltip" style={{ transformOrigin: '0% 50%', animationFillMode: 'forwards' }}>
              <div className="semi-tooltip-content">{tip.text}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
