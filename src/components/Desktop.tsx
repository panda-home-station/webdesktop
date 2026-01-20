import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import WindowManager from './WindowManager'
import { getWallpaper, setWallpaper } from '../state/desktop'
import { openApp } from '../sdk/desktop'
import Icon from '@mdi/react'
import { mdiRefresh, mdiCogOutline, mdiAccountCircleOutline } from '@mdi/js'

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

export default function Desktop() {
  const [wallpaper, setWallpaperUrl] = useState<string>(getWallpaper())
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    const url = getWallpaper()
    setWallpaperUrl(url)
    const onWp = (e: any) => {
      const next = e?.detail?.url ?? getWallpaper()
      setWallpaperUrl(next)
    }
    window.addEventListener('desktop:wallpaper', onWp)
    return () => window.removeEventListener('desktop:wallpaper', onWp)
  }, [])

  const style = useMemo(() => {
    const base: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      position: 'relative'
    }
    return base
  }, [wallpaper])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const closeMenu = useCallback(() => setMenu(null), [])

  return (
    <div style={style} className="puter-desktop" onContextMenu={onContextMenu}>
      <SmoothWallpaper src={wallpaper} />
      <WindowManager />
      {menu && (
        <div className="semi-portal" style={{ zIndex: 10005 }}>
          <div
            tabIndex={-1}
            className="semi-portal-inner"
            style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 10006 }}
          >
            <div
              style={{
                minWidth: 160,
                padding: 6,
                borderRadius: 10,
                background: 'rgba(243,244,246,0.96)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--win-border)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.18)'
              }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  textAlign: 'left',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: hoverIndex === 0 ? '#e5e7eb' : 'transparent',
                  color: 'inherit'
                }}
                onClick={() => {
                  closeMenu()
                  window.location.reload()
                }}
                onMouseEnter={() => setHoverIndex(0)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(0)}
                onBlur={() => setHoverIndex(null)}
              >
                <Icon path={mdiRefresh} size={0.85} />
                刷新
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  textAlign: 'left',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: hoverIndex === 1 ? '#e5e7eb' : 'transparent',
                  color: 'inherit'
                }}
                onClick={() => {
                  closeMenu()
                  openApp('system-settings')
                }}
                onMouseEnter={() => setHoverIndex(1)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(1)}
                onBlur={() => setHoverIndex(null)}
              >
                <Icon path={mdiCogOutline} size={0.85} />
                系统设置
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  textAlign: 'left',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: hoverIndex === 2 ? '#e5e7eb' : 'transparent',
                  color: 'inherit'
                }}
                onClick={() => {
                  closeMenu()
                  openApp('user-center')
                }}
                onMouseEnter={() => setHoverIndex(2)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(2)}
                onBlur={() => setHoverIndex(null)}
              >
                <Icon path={mdiAccountCircleOutline} size={0.85} />
                我的账号
              </button>
            </div>
          </div>
          <div
            style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10004 }}
            onMouseDown={closeMenu}
          />
        </div>
      )}
    </div>
  )
}
