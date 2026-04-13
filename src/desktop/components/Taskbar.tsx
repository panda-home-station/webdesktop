import React, { useState, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import { listApps } from '../../framework/registry'
import { openApp, showDesktop, lockScreen } from '../../shared/sdk/desktop'
import Icon from '@mdi/react'
import { mdiCogOutline, mdiRobot } from '@mdi/js'
import { Monitor, LayoutGrid, User, Lock, LogOut, Bell } from 'lucide-react'
import { useAuthStore } from '@truenas/stores/auth'
import useAlertStore from '@truenas/stores/alert'
import { useJobStore } from '@truenas/stores/job'
import { Badge } from './Badge'
import { NotificationCenter } from './NotificationCenter'

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
  onMinimize: (id: string) => void
  onOpenLauncher: () => void
  onOpenApp: (id: string) => void
  isLauncherOpen?: boolean
  onCloseLauncher?: () => void
  zOrder?: string[]
  onToggleQuickAgent?: () => void
}

const GlassTile = memo(({ children, color, active, activeColor = '#2563eb' }: { children: React.ReactNode; color?: string; active?: boolean; activeColor?: string }) => (
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
      transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
  >
    {children}
  </div>
))
GlassTile.displayName = 'GlassTile'

const TaskbarIcon = memo(({
  id: _id,
  title,
  iconUrl,
  isAppActive,
  isFocused,
  onClick,
  onMouseEnter,
  onMouseLeave
}: {
  id: string,
  title: string,
  iconUrl?: string,
  isAppActive: boolean,
  isFocused: boolean,
  onClick: () => void,
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void,
  onMouseLeave: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className="panda-button dock-item"
      title={title}
      style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isAppActive && (
        <div style={{
          position: 'absolute',
          left: 2,
          width: 3,
          height: isFocused ? 20 : 6,
          borderRadius: 2,
          background: isFocused ? '#2563eb' : '#64748b',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      )}
      {iconUrl ? (
        <img 
          src={iconUrl} 
          alt="" 
          width={22} 
          height={22} 
          style={{ borderRadius: 6, objectFit: 'contain' }} 
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,0.06)' }} />
      )}
    </button>
  )
})
TaskbarIcon.displayName = 'TaskbarIcon'

export default function Taskbar({ wins, onFocus, onRestore, onMinimize, onOpenLauncher, onOpenApp: _onOpenApp, isLauncherOpen, onCloseLauncher, zOrder = [], onToggleQuickAgent }: Props) {
  const apps = listApps()
  const { user, logout } = useAuthStore()
  const unreadAlertCount = useAlertStore(state => state.getImportantUnreadAlertsCount())
  const jobCounts = useJobStore(state => state.counts)

  const byApp = useMemo(() => {
    const map: Record<string, WinItem[]> = {}
    for (const w of wins) {
      const aid = w.appId
      map[aid] = map[aid] || []
      map[aid].push(w)
    }
    return map
  }, [wins])

  const runningAppIds = useMemo(() => Object.keys(byApp), [byApp])
  
  const activeAppId = useMemo(() => {
    const topWinId = [...zOrder].reverse().find(id => {
      const w = wins.find(win => win.id === id)
      return w && !w.minimized
    })
    if (!topWinId) return null
    return wins.find(w => w.id === topWinId)?.appId
  }, [wins, zOrder])

  const isRunning = (id?: string) => !!(id && byApp[id] && byApp[id].length > 0)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const tipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTip = (text: string, el: HTMLElement) => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
    
    // 如果已经在显示一个 tip，则切换得快一点；如果是从无到有，则稍微延迟
    const delay = tip ? 50 : 200 
    
    tipTimerRef.current = setTimeout(() => {
        const r = el.getBoundingClientRect()
        setTip({ text, x: r.right + 6, y: r.top + r.height / 2 })
    }, delay)
  }

  const hideTip = () => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
    setTip(null)
  }

  const [menu, setMenu] = useState<{ x: number; y: number; items: { label: string; onClick?: () => void }[] } | null>(null)
  const [accountMenu, setAccountMenu] = useState<{ x: number; y: number } | null>(null)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [notificationCenterAnchor, setNotificationCenterAnchor] = useState<{ x: number; y: number } | null>(null)

  // Calculate total notification count
  const totalNotificationCount = useMemo(() => {
    return unreadAlertCount + jobCounts.running + jobCounts.failed
  }, [unreadAlertCount, jobCounts])
  
  const focusOrOpen = (appId: string) => {
    const appWins = byApp[appId] || []
    if (appWins.length === 0) {
      openApp(appId)
      return
    }

    // Find the "topmost" window of this app according to zOrder
    const sortedWins = [...appWins].sort((a, b) => {
      const ia = zOrder.indexOf(a.id)
      const ib = zOrder.indexOf(b.id)
      return ib - ia
    })
    
    const topWin = sortedWins[0]
    // The globally active window is the topmost one that is NOT minimized
    const activeWinId = [...zOrder].reverse().find(id => {
      const w = wins.find(win => win.id === id)
      return w && !w.minimized
    })

    if (topWin.id === activeWinId) {
      // If the topmost window of this app is the currently active window, minimize it
      onMinimize(topWin.id)
    } else {
      // If not active, or minimized, bring it to focus/restore
      if (topWin.minimized) {
        onRestore(topWin.id)
      } else {
        onFocus(topWin.id)
      }
    }
  }
  const handleAIAssistantClick = () => {
    if (isRunning('agent')) {
      focusOrOpen('agent')
    } else {
      onToggleQuickAgent?.()
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
        border: '1px solid rgba(255,255,255,0.2)',
        transform: 'translateZ(0)',
        willChange: 'transform'
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
          onMouseLeave={hideTip}
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
          onMouseLeave={hideTip}
        >
          <GlassTile active={isLauncherOpen} activeColor="#2563eb">
            <LayoutGrid size={20} color={isLauncherOpen ? '#fff' : '#2563eb'} strokeWidth={1.5} />
          </GlassTile>
        </button>
      </div>
      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.3)', margin: '10px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1, width: '100%' }}>
        {runningAppIds.map(id => {
          const a = apps.find(x => x.id === id)
          const arr = byApp[id] || []
          const title = a?.title || id
          const iconUrl = a?.iconUrl
          const _anyMin = arr.find(x => x.minimized)
          const _anyWin = arr.find(x => !x.minimized) || arr[0]
          // If any window of this app is not minimized, the app is considered "active" (showing on desktop)
          const isAppActive = arr.some(w => !w.minimized)

          return (
            <TaskbarIcon
              key={`tb-${id}`}
              id={id}
              title={title}
              iconUrl={iconUrl}
              isAppActive={isAppActive}
              isFocused={activeAppId === id}
              onClick={() => {
                if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
                focusOrOpen(id)
              }}
              onMouseEnter={(e) => showTip(title, e.currentTarget)}
              onMouseLeave={hideTip}
            />
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
            handleAIAssistantClick()
          }}
          onMouseEnter={(e) => showTip('AI助手', e.currentTarget)}
          onMouseLeave={hideTip}
        >
          <Icon path={mdiRobot} size={0.9} color="#3b82f6" />
        </button>
        <button
          className="dock-item"
          title="通知中心"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer', position: 'relative' }}
          onClick={(e) => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            const r = e.currentTarget.getBoundingClientRect()
            setNotificationCenterAnchor({ x: r.right + 12, y: r.top })
            setIsNotificationCenterOpen(true)
          }}
          onMouseEnter={(e) => showTip('通知中心', e.currentTarget)}
          onMouseLeave={hideTip}
        >
          <Bell size={22} color={totalNotificationCount > 0 ? '#ef4444' : '#3b82f6'} />
          {totalNotificationCount > 0 && <Badge count={totalNotificationCount} />}
        </button>
        <button
          className="dock-item"
          title="账号"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
          onClick={(e) => {
            if (isLauncherOpen && onCloseLauncher) onCloseLauncher()
            const r = e.currentTarget.getBoundingClientRect()
            setAccountMenu({ x: r.right + 12, y: r.top })
          }}
          onMouseEnter={(e) => showTip('我的账号', e.currentTarget)}
          onMouseLeave={hideTip}
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
            focusOrOpen('system-settings')
          }}
          onMouseEnter={(e) => showTip('设置', e.currentTarget)}
          onMouseLeave={hideTip}
        >
          <Icon path={mdiCogOutline} size="22px" color="#475569" />
        </button>
      </div>
      {tip && createPortal(
        <div className="semi-portal" style={{ zIndex: 10002, pointerEvents: 'none' }}>
          <div tabIndex={-1} className="semi-portal-inner" style={{ position: 'fixed', left: tip.x, top: tip.y, transform: 'translateY(-50%)' }}>
            <div className="semi-tooltip-wrapper semi-tooltip-wrapper-show semi-tooltip-with-arrow" role="tooltip" style={{ transformOrigin: '0% 50%', animationFillMode: 'forwards' }}>
              <div className="semi-tooltip-content">{tip.text}</div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {menu && createPortal(
        <div className="semi-portal" style={{ zIndex: 10005 }}>
          <div tabIndex={-1} className="semi-portal-inner" style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 10006 }}>
            <div style={{ minWidth: 160, padding: 6, borderRadius: 10, background: 'rgba(243,244,246,0.96)', backdropFilter: 'blur(8px)', border: '1px solid var(--win-border)', boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}>
              {menu.items.map((it, idx) => (
                <button
                  key={idx}
                  style={{ width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  onClick={() => {
                    setMenu(null)
                    if (it.onClick) {
                      it.onClick()
                    }
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#94a3b8'
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
        </div>,
        document.body
      )}
      {accountMenu && createPortal(
        <div className="semi-portal" style={{ zIndex: 10005 }}>
          <div tabIndex={-1} className="semi-portal-inner" style={{ 
            position: 'fixed', 
            left: accountMenu.x, 
            bottom: window.innerHeight - accountMenu.y < 300 ? 12 : 'auto',
            top: window.innerHeight - accountMenu.y < 300 ? 'auto' : accountMenu.y,
            zIndex: 10006 
          }}>
            <div style={{ 
              minWidth: 220, 
              padding: '12px 6px', 
              borderRadius: 12, 
              background: 'rgba(255,255,255,0.95)', 
              backdropFilter: 'blur(16px)', 
              border: '1px solid rgba(255,255,255,0.3)', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              maxHeight: 'calc(100vh - 24px)',
              overflowY: 'auto'
            }}>
              {/* User Info Section */}
              <div style={{ padding: '0 12px 12px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {(user as { avatar_url?: string })?.avatar_url ? (
                    <img src={(user as { avatar_url?: string }).avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user?.username || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.pw_name || '未登录'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: user?.pw_uid ? '#10b981' : '#94a3b8' }} />
                    {user?.pw_uid ? '在线' : '离线'}
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <button
                style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#334155', transition: 'all 0.2s', transform: 'translateZ(0)' }}
                onClick={() => {
                  setAccountMenu(null)
                  focusOrOpen('user-center')
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#cbd5e1'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <User size={18} />
                <span style={{ fontSize: 14 }}>用户中心</span>
              </button>
              
              <button
                style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#334155', transition: 'all 0.2s', transform: 'translateZ(0)' }}
                onClick={() => {
                  setAccountMenu(null)
                  lockScreen()
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#cbd5e1'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Lock size={18} />
                <span style={{ fontSize: 14 }}>锁定屏幕</span>
              </button>
              
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
              
              <button
                style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', transition: 'all 0.2s', transform: 'translateZ(0)' }}
                onClick={async () => {
                  setAccountMenu(null)
                  await logout()
                  window.location.reload()
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fca5a5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={18} />
                <span style={{ fontSize: 14 }}>退出登录</span>
              </button>
            </div>
          </div>
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10004 }} onMouseDown={() => setAccountMenu(null)} />
        </div>,
        document.body
      )}

      {/* Notification Center */}
      <NotificationCenter
        open={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        anchorEl={notificationCenterAnchor}
      />
    </div>
  )
}
