import React from 'react'
import { listApps } from '../apps/registry'
import { openApp } from '../sdk/desktop'

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
}

export default function Taskbar({ wins, onFocus, onRestore, onOpenLauncher, onOpenApp }: Props) {
  const apps = listApps()
  const uc = apps.find(a => a.id === 'user-center')
  const store = apps.find(a => a.id === 'app-store')
  const fm = apps.find(a => a.id === 'file-manager')
  const pinned = new Set(['user-center', 'app-store', 'file-manager'])
  const byApp: Record<string, WinItem[]> = {}
  for (const w of wins) {
    const aid = w.appId || ''
    if (!aid) continue
    byApp[aid] = byApp[aid] || []
    byApp[aid].push(w)
  }
  const dynamicAppIds = Object.keys(byApp).filter(id => !pinned.has(id))
  const isRunning = (id?: string) => !!(id && byApp[id] && byApp[id].length > 0)
  const focusOrOpen = (appId: string) => {
    const arr = byApp[appId]
    if (arr && arr.length > 0) {
      const w = arr.find(x => !x.minimized) || arr[0]
      if (w.minimized) onRestore(w.id)
      else onFocus(w.id)
    } else {
      onOpenApp(appId)
      openApp(appId)
    }
  }
  return (
    <div
      className="puter-taskbar"
      style={{
        position: 'fixed',
        left: 6,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 56,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '10px 8px',
        borderRadius: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 10000,
        backdropFilter: 'blur(12px)',
        background: 'rgba(255,255,255,0.6)',
      }}
    >
      <button
        className="puter-button dock-item"
        title="用户"
        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
        onClick={() => {
          focusOrOpen('user-center')
        }}
      >
        {uc?.iconUrl ? (
          <img src={uc.iconUrl} alt="" width={22} height={22} style={{ borderRadius: 6 }} />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" fill="#64748b" />
            <path d="M4 20a8 8 0 0 1 16 0" fill="#94a3b8" />
          </svg>
        )}
        {isRunning('user-center') && <span className="dock-dot dock-dot-active" />}
      </button>
      <button
        className="puter-button dock-item"
        title="应用程序"
        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
        onClick={() => {
          focusOrOpen('app-store')
        }}
      >
        {store?.iconUrl ? (
          <img src={store.iconUrl} alt="" width={22} height={22} style={{ borderRadius: 6 }} />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M3 9h18l-2 10H5L3 9z" fill="#60a5fa" />
            <path d="M7 9V7a5 5 0 0 1 10 0v2" fill="#93c5fd" />
          </svg>
        )}
        {isRunning('app-store') && <span className="dock-dot dock-dot-active" />}
      </button>
      <button
        className="puter-button dock-item"
        title="文件管理器"
        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
        onClick={() => {
          focusOrOpen('file-manager')
        }}
      >
        {fm?.iconUrl ? (
          <img src={fm.iconUrl} alt="" width={22} height={22} style={{ borderRadius: 6 }} />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24">
            <linearGradient id="gf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f59e0b" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
            <path fill="url(#gf)" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </svg>
        )}
        {isRunning('file-manager') && <span className="dock-dot dock-dot-active" />}
      </button>
      {dynamicAppIds.map(id => {
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
              if (anyMin && anyMin.id) onRestore(anyMin.id)
              else if (anyWin && anyWin.id) onFocus(anyWin.id)
              else {
                onOpenApp(id)
                openApp(id)
              }
            }}
            className="puter-button dock-item"
            title={title}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
          >
            {iconUrl ? <img src={iconUrl} alt="" width={20} height={20} style={{ borderRadius: 6 }} /> : <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(0,0,0,0.06)' }} />}
            <span className="dock-dot dock-dot-active" />
          </button>
        )
      })}
    </div>
  )
}
