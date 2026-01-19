import React, { useState } from 'react'
import { listApps } from '../apps/registry'
import { openApp, showDesktop } from '../sdk/desktop'

type WinItem = {
  id: string
  title: string
  minimized?: boolean
  iconUrl?: string
  appId: string
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
    const aid = w.appId
    byApp[aid] = byApp[aid] || []
    byApp[aid].push(w)
  }
  const runningAppIds = Object.keys(byApp)
  const isRunning = (id?: string) => !!(id && byApp[id] && byApp[id].length > 0)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
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
