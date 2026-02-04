import React, { useState } from 'react'
import { listApps } from '../apps/registry'
import { openApp, showDesktop } from '../sdk/desktop'
import { getAppContextMenu } from '../sdk/desktop'
import Icon from '@mdi/react'
import { mdiCogOutline, mdiRobot } from '@mdi/js'
import { Monitor, LayoutGrid } from 'lucide-react'

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

const GlassTile = ({ children, color, active, activeColor = '#2563eb' }: { children: React.ReactNode; color?: string; active?: boolean; activeColor?: string }) => (
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      background: active ? activeColor : 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      boxShadow: active
        ? `0 4px 12px ${activeColor}4d`
        : '0 2px 5px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: active ? '#fff' : (color || '#334155'),
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
  >
    {children}
  </div>
)

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
  const [menu, setMenu] = useState<{ x: number; y: number; items: { label: string; onClick?: () => void }[] } | null>(null)
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
      className="panda-taskbar"
      style={{
        position: 'fixed',
        left: 12,
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
        border: '1px solid rgba(255,255,255,0.2)'
      }}
      onMouseDownCapture={(e) => {
        const t = e.target as HTMLElement
        if (!t.closest('.dock-item') && isLauncherOpen && onCloseLauncher) {
          onCloseLauncher()
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const items = getAppContextMenu('dock', { x: e.clientX, y: e.clientY, target: e.currentTarget })
        if (items && items.length > 0) {
          setMenu({ x: e.clientX, y: e.clientY, items })
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
          <GlassTile>
            <Monitor size={20} color="#334155" strokeWidth={1.5} />
          </GlassTile>
        </button>
        <button
          className="dock-item"
          title="全部应用"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer', position: 'relative' }}
          onClick={onOpenLauncher}
          onMouseEnter={(e) => showTip('全部应用', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <GlassTile active={isLauncherOpen} activeColor="#2563eb">
            <LayoutGrid size={20} color={isLauncherOpen ? '#fff' : '#2563eb'} strokeWidth={1.5} />
          </GlassTile>
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
          // If any window of this app is not minimized, the app is considered "active" (showing on desktop)
          const isAppActive = arr.some(w => !w.minimized)

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
              className="panda-button dock-item"
              title={title}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
              onMouseEnter={(e) => showTip(title, e.currentTarget)}
              onMouseLeave={() => setTip(null)}
            >
              {iconUrl ? <img src={iconUrl} alt="" width={22} height={22} style={{ borderRadius: 6 }} /> : <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,0.06)' }} />}
            </button>
          )
        })}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        padding: '8px 0',
        background: 'rgba(203, 213, 225, 0.8)',
         borderRadius: 999,
         width: 40,
        marginTop: 10,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <button
          className="dock-item"
          title="AI助手"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            openApp('agent-chat')
          }}
          onMouseEnter={(e) => showTip('AI助手', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <Icon path={mdiRobot} size={0.9} color="#3b82f6" />
        </button>
        <button
          className="dock-item"
          title="通知"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            onOpenApp('notifications')
          }}
          onMouseEnter={(e) => showTip('通知', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M12 3a6 6 0 0 1 6 6v4l2 2H4l2-2V9a6 6 0 0 1 6-6z" fill="#3b82f6" />
            <circle cx="12" cy="20" r="2" fill="#93c5fd" />
          </svg>
        </button>
        <button
          className="dock-item"
          title="账号"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            focusOrOpen('user-center')
          }}
          onMouseEnter={(e) => showTip('我的账号', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" fill="#475569" />
            <path d="M4 20a8 8 0 0 1 16 0" fill="#94a3b8" />
          </svg>
        </button>
        <button
          className="dock-item"
          title="设置"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            onOpenApp('system-settings')
          }}
          onMouseEnter={(e) => showTip('设置', e.currentTarget)}
          onMouseLeave={() => setTip(null)}
        >
          <Icon path={mdiCogOutline} size="22px" color="#475569" />
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
      {menu && (
        <div className="semi-portal" style={{ zIndex: 10005 }}>
          <div tabIndex={-1} className="semi-portal-inner" style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 10006 }}>
            <div style={{ minWidth: 160, padding: 6, borderRadius: 10, background: 'rgba(243,244,246,0.96)', backdropFilter: 'blur(8px)', border: '1px solid var(--win-border)', boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}>
              {menu.items.map((it, idx) => (
                <button
                  key={idx}
                  style={{ width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => {
                    setMenu(null)
                    try {
                      it.onClick && it.onClick()
                    } catch {}
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#e5e7eb'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10004 }} onMouseDown={() => setMenu(null)} />
        </div>
      )}
    </div>
  )
}
