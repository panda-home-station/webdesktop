import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import Desktop from './components/Desktop'
import LoginForm from './components/LoginForm'
import InitForm from './components/InitForm'
import axios from 'axios'
import { getWallpaper } from './state/desktop'

const host = window.location.hostname || 'localhost'
const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
axios.defaults.baseURL = `${protocol}://${host}:${apiPort}`
{
  const t = localStorage.getItem('authToken') || ''
  if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
}

const api = {
  getToken(): string {
    return localStorage.getItem('authToken') || ''
  },
  getUser(): { user_id: string; username: string } | null {
    try {
      const raw = localStorage.getItem('authUser')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  async whoami(): Promise<{ user_id: string; username: string } | null> {
    const r = await axios.get('/api/auth/whoami')
    const u = r.data && typeof r.data === 'object' ? r.data : null
    if (u) {
      try { localStorage.setItem('authUser', JSON.stringify(u)) } catch {}
    }
    return u
  },
  async initState(): Promise<{ initialized: boolean }> {
    const r = await axios.get('/api/system/init/state')
    const d = r.data || {}
    return { initialized: !!d.initialized }
  },
  async getWallpaper(): Promise<string> {
    const p = localStorage.getItem('wallpaperPath') || ''
    return p
  },
  fsDownloadUrl(path: string): string {
    const host = window.location.hostname || 'localhost'
    const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
    const base = `${protocol}://${host}:${apiPort}`
    const token = (localStorage.getItem('authToken') || '')
    const u = new URL(`${base}/api/docs/download`)
    u.searchParams.set('path', path || '')
    if (token) u.searchParams.set('token', token)
    return u.toString()
  },
  logout() {
    try { localStorage.removeItem('authToken') } catch {}
    try { localStorage.removeItem('authUser') } catch {}
    delete axios.defaults.headers.common['Authorization']
  }
}

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
  const [needInit, setNeedInit] = useState(false)
  useEffect(() => {
    if (api.getToken()) {
      api.whoami().then(u => {
        setUser(u)
      }).catch(() => {
        api.logout()
        setUser(null)
      })
    }
    api.initState().then(s => {
      setNeedInit(!s.initialized)
      setInitChecked(true)
    }).catch(() => {
      setNeedInit(true)
      setInitChecked(true)
    })
    api.getWallpaper().then(path => {
      const fallback = (path && path.length > 0) ? path : (localStorage.getItem('wallpaperPath') || '')
      const url = fallback ? api.fsDownloadUrl(fallback) : ''
      setWallpaperUrl(url)
      try {
        const ev = new CustomEvent('desktop:wallpaper', { detail: { url } })
        window.dispatchEvent(ev)
      } catch {}
    }).catch(() => {})
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
    return () => {
      window.removeEventListener('desktop:wallpaper', onWp)
    }
  }, [])
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
  if (!initChecked) {
    return null
  }
  if (needInit) {
    return (
      <div style={bgStyle}>
        <SmoothWallpaper src={wallpaper} />
        <div
          className="puter-window"
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
          className="puter-window"
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
          <LoginForm onSuccess={() => setUser(api.getUser())} />
          <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 10 }}>请输入管理员或用户账号登录</div>
        </div>
      </div>
    )
  }
  return <Desktop />
}
