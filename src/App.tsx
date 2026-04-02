import React, { useEffect, useState } from 'react'
import Desktop from './components/Desktop'
import LoginForm from './components/LoginForm'
import LockScreen from './components/LockScreen'
import { getWallpaper } from './state/desktop'
import { truenasApi } from './truenas/api'
import { useAuthStore } from './truenas/stores/auth.store'
import { authService } from './truenas/services/auth.service'
import { LoginResult } from './truenas/types/login-result.enum'

function SmoothWallpaper({ src }: { src?: string }) {
  const [cur, setCur] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)

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
  }, [src, cur, next])

  const onTransitionEnd = () => {
    if (next) {
      setCur(next)
      setNext(null)
      setFadeIn(false)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        transform: 'translateZ(0)',
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
            transform: 'translateZ(0)',
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
            transform: 'translateZ(0)',
          }}
          alt=""
        />
      )}
    </div>
  )
}

export default function App() {
  const [wallpaper, setWallpaperUrl] = useState(getWallpaper())
  const [isLocked, setIsLocked] = useState(false)
  const { isAuthenticated, user } = useAuthStore()

  // Initialize WebSocket client on mount
  useEffect(() => {
    try {
      truenasApi.init()
      console.log('TrueNAS WebSocket client initialized')
    } catch (error) {
      console.error('Failed to initialize TrueNAS client:', error)
    }
  }, [])

  useEffect(() => {
    const url = getWallpaper()
    setWallpaperUrl(url)

    const onWp = (e: any) => {
      const u = e?.detail?.url
      if (typeof u === 'string' && u.length > 0) {
        setWallpaperUrl(u)
      } else {
        const next = getWallpaper()
        if (next && next.length) {
          setWallpaperUrl(next)
        }
      }
    }
    window.addEventListener('desktop:wallpaper', onWp)

    return () => {
      window.removeEventListener('desktop:wallpaper', onWp)
    }
  }, [])

  useEffect(() => {
    // Check for token in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')

    if (tokenParam) {
      authService.setQueryToken(tokenParam)
    }

    // Check for saved token in localStorage
    const savedToken = localStorage.getItem('token')
    if (savedToken && !isAuthenticated) {
      const authStore = useAuthStore.getState()
      authStore.setToken(savedToken)

      // Try to login with token
      authService.loginWithToken().then((result) => {
        if (result === LoginResult.Success) {
          // Login successful
          // Clean URL to remove token parameter
          if (tokenParam) {
            const cleanUrl = window.location.pathname
            window.history.replaceState({}, document.title, cleanUrl)
          }
        } else {
          // Token login failed, clear it
          authStore.setToken(null)
          localStorage.removeItem('token')
        }
      })
    }
  }, [isAuthenticated])

  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    background: 'transparent',
    position: 'relative',
  }

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div style={style} className="panda-desktop">
        <SmoothWallpaper src={wallpaper} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 380,
              padding: 32,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              TrueNAS Web Desktop
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    )
  }

  // If locked, show lock screen
  if (isLocked) {
    return (
      <LockScreen
        wallpaper={wallpaper}
        username={user?.pw_name}
        onUnlock={() => setIsLocked(false)}
        onLogout={async () => {
          const authStore = useAuthStore.getState()
          await authStore.logout()
          window.location.reload()
        }}
      />
    )
  }

  // Show desktop
  return (
    <div style={style} className="panda-desktop">
      <SmoothWallpaper src={wallpaper} />
      <Desktop />
    </div>
  )
}
