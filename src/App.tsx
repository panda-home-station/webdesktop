import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Desktop from './components/Desktop'
import LoginForm from './components/LoginForm'
import InitForm from './components/InitForm'
import LockScreen from './components/LockScreen'
import { getWallpaper } from './state/desktop'
import { api } from './api/client'
import { subscribeLogout, subscribeLockScreen, getFileTasks } from './sdk/desktop'
import { clearPersistState } from './state/windows'

function SmoothWallpaper({ src }: { src?: string }) {
  const [cur, setCur] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)
  const timerRef = useRef<number | null>(null)
  useEffect(() => {
    if (!src) {
      setCur(null)
      setNext(null)
      setFadeIn(false)
      return
    }
    if (cur === src || next === src) return
    const img = new Image()
    img.src = src
    img.decode?.().then(() => {
      setNext(src)
      requestAnimationFrame(() => setFadeIn(true))
    }).catch(() => {
      setNext(src)
      requestAnimationFrame(() => setFadeIn(true))
    })
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [src, cur, next])
  const onTransitionEnd = useCallback(() => {
    if (next) {
      setCur(next)
      setNext(null)
      setFadeIn(false)
    }
  }, [next])
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        transform: 'translateZ(0)'
      }}
    >
      {cur && (
        <img
          src={cur}
          decoding="async"
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 1,
            willChange: 'opacity, transform',
            transform: 'translateZ(0)'
          }}
          alt=""
        />
      )}
      {next && (
        <img
          src={next}
          decoding="async"
          draggable={false}
          onTransitionEnd={onTransitionEnd}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 220ms ease',
            willChange: 'opacity, transform',
            transform: 'translateZ(0)'
          }}
          alt=""
        />
      )}
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(api.getUser())
  const [wallpaper, setWallpaperUrl] = useState(getWallpaper())
  const [initChecked, setInitChecked] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [needInit, setNeedInit] = useState(false)
  const [isLocked, setIsLocked] = useState(() => {
    // Initialize lock state from localStorage
    return localStorage.getItem('isLocked') === 'true'
  })

  // Sync isLocked state to localStorage
  useEffect(() => {
    localStorage.setItem('isLocked', String(isLocked))
  }, [isLocked])

  useEffect(() => {
    const updateTitle = async () => {
      if (needInit) {
        document.title = '系统初始化 - PandaOS'
        return
      }
      const info = await api.getDeviceInfo()
      if (info && info.device_name) {
        document.title = `${info.device_name} - Panda OS`
      }
    }
    updateTitle().catch(() => {
      // ignore
    })
  }, [needInit])

  useEffect(() => {
    const checkAuth = async () => {
      const t = api.getToken()
      if (t) {
        try {
          const u = await api.whoami()
          if (u) {
            setUser(u)
            // Load wallpaper after successful auth
            api.getWallpaper().then(path => {
              const fallback = (path && path.length > 0) ? path : (localStorage.getItem('wallpaperPath') || '')
              const url = fallback ? api.fsDownloadUrl(fallback) : '/wallpaper_default.webp'
              setWallpaperUrl(url)
              try {
                const ev = new CustomEvent('desktop:wallpaper', { detail: { url } })
                window.dispatchEvent(ev)
              } catch {}
            }).catch(() => {})
          } else {
            api.logout()
            setUser(null)
          }
        } catch (err) {
          console.error('Auth check failed:', err)
          api.logout()
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setAuthChecked(true)
    }

    checkAuth()

    api.initState().then(s => {
      if (!s.initialized) {
        setNeedInit(true)
        clearPersistState()
      }
      setInitChecked(true)
    }).catch(() => {
      setNeedInit(true)
      clearPersistState()
      setInitChecked(true)
    })

    const onWp = (e: any) => {
      const u = e?.detail?.url
      if (typeof u === 'string' && u.length > 0) {
        setWallpaperUrl(u)
      } else {
        const next = getWallpaper()
        if (next && next.length > 0) {
          setWallpaperUrl(next)
        }
      }
    }
    window.addEventListener('desktop:wallpaper', onWp)

    const unSubLogout = subscribeLogout(() => {
      api.logout()
      clearPersistState()
      setUser(null)
    })
    const unSubLock = subscribeLockScreen(() => {
      setIsLocked(true)
    })
    return () => {
      window.removeEventListener('desktop:wallpaper', onWp)
      unSubLogout()
      unSubLock()
    }
  }, [])

  // Idle timer logic
  useEffect(() => {
    let idleTimer: any = null
    let settings: { idle_timeout: number; idle_action: 'lock' | 'logout' } | null = null
    
    const fetchSettings = async () => {
      try {
        settings = await api.getSecuritySettings()
      } catch (e) {
        console.error('Failed to fetch security settings', e)
      }
    }

    const checkAndPerformAction = async () => {
      if (!settings || settings.idle_timeout <= 0 || !user || isLocked) return

      // Check for active foreground tasks
      // 1. Local file tasks (upload/download/delete/mkdir)
      const localTasks = getFileTasks()
      const hasActiveLocalTasks = localTasks.some(t => t.status === 'running' || t.status === 'pending')
      
      if (hasActiveLocalTasks) {
        restartTimer()
        return
      }

      // 2. Remote download tasks
      try {
        const remoteTasks = await api.listDownloads()
        const hasActiveRemoteTasks = remoteTasks.some((t: any) => t.status === 'downloading' || t.status === 'pending')
        
        if (hasActiveRemoteTasks) {
          restartTimer()
          return
        }
      } catch (e) {
        // If API fails, we continue with the idle action for security, 
        // but we've already checked local tasks which covers most "foreground" activity.
      }

      // No active tasks, perform idle action
      const action = settings.idle_action
      if (action === 'logout') {
        api.logout()
        clearPersistState()
        setUser(null)
      } else {
        setIsLocked(true)
      }
    }

    const restartTimer = () => {
      if (idleTimer) clearTimeout(idleTimer)
      if (settings && settings.idle_timeout > 0 && user && !isLocked) {
        idleTimer = setTimeout(checkAndPerformAction, settings.idle_timeout * 60 * 1000)
      }
    }

    const onActivity = () => {
      restartTimer()
    }

    const onSettingsChanged = async () => {
      await fetchSettings()
      restartTimer()
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    
    fetchSettings().then(() => {
      restartTimer()
    })

    activityEvents.forEach(ev => window.addEventListener(ev, onActivity))
    window.addEventListener('pnas:settings-changed', onSettingsChanged)
    
    return () => {
      activityEvents.forEach(ev => window.removeEventListener(ev, onActivity))
      window.removeEventListener('pnas:settings-changed', onSettingsChanged)
      if (idleTimer) clearTimeout(idleTimer)
    }
  }, [user, isLocked])
  const bgStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6',
      position: 'relative',
      overflow: 'hidden'
    }
  }, [wallpaper])
  if (!initChecked || !authChecked) {
    return null
  }
  if (needInit) {
    return (
      <div style={bgStyle}>
        <SmoothWallpaper src={wallpaper} />
        <div
          className="panda-window"
          style={{
            width: 420,
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.86)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <InitForm onDone={() => {
            setNeedInit(false)
            setUser(api.getUser())
          }} />
        </div>
      </div>
    )
  }
  if (!user) {
    return (
      <div style={bgStyle}>
        <SmoothWallpaper src={wallpaper} />
        <div
          className="panda-window"
          style={{
            width: 360,
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.86)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f6', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 18 }}>
              🔒
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>登录到系统</div>
          </div>
          <LoginForm onSuccess={() => {
            setUser(api.getUser())
            setIsLocked(false)
          }} />
        </div>
      </div>
    )
  }
  return (
    <>
      <Desktop />
      {isLocked && (
        <LockScreen 
          onUnlock={() => setIsLocked(false)} 
          onLogout={() => {
            api.logout()
            clearPersistState()
            setUser(null)
            setIsLocked(false)
          }}
          wallpaper={wallpaper} 
          username={user.username}
        />
      )}
    </>
  )
}
