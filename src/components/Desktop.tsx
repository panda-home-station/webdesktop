import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import WindowManager from './WindowManager'
import { getWallpaper, setWallpaper } from '../state/desktop'
import { openApp } from '../sdk/desktop'
import { listApps } from '../apps/registry'
import Icon from '@mdi/react'
import { mdiRefresh, mdiCogOutline, mdiAccountCircleOutline, mdiChevronRight } from '@mdi/js'
import { showDesktop, openLauncher } from '../sdk/desktop'
import { mdiFolderOutline, mdiViewGridOutline, mdiMonitor } from '@mdi/js'

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

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: 'none',
  textAlign: 'left',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'inherit',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box'
}

const hoverColor = '#d1d5db'

export default function Desktop() {
  const [wallpaper, setWallpaperUrl] = useState<string>(getWallpaper())
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const allApps = useMemo(() => {
    return listApps().filter(a => !['file-manager', 'system-settings', 'user-center'].includes(a.id))
  }, [])

  useEffect(() => {
    const url = getWallpaper()
    setWallpaperUrl(url)
    const onWp = (e: any) => {
      const u = e?.detail?.url
      if (typeof u === 'string' && u.length > 0) {
        setWallpaperUrl(u)
      } else {
        const fallback = getWallpaper()
        if (fallback && fallback.length > 0) {
          setWallpaperUrl(fallback)
        }
        // Ignore empty to avoid clearing current wallpaper
      }
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
    <div style={style} className="panda-desktop" onContextMenu={onContextMenu}>
      <SmoothWallpaper src={wallpaper} />
      <WindowManager />
      {menu && createPortal(
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
                  ...menuItemStyle,
                  background: hoverIndex === 0 ? hoverColor : 'transparent'
                }}
                onClick={() => {
                  closeMenu()
                  showDesktop()
                }}
                onMouseEnter={() => setHoverIndex(0)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(0)}
                onBlur={() => setHoverIndex(null)}
              >
                <Icon path={mdiMonitor} size={0.85} />
                显示桌面
              </button>
              <div
                style={{
                  ...menuItemStyle,
                  background: hoverIndex === 1 ? hoverColor : 'transparent',
                  position: 'relative'
                }}
                onClick={() => {
                  closeMenu()
                  openLauncher()
                }}
                onMouseEnter={() => setHoverIndex(1)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <Icon path={mdiViewGridOutline} size={0.85} />
                <span style={{ flex: 1 }}>全部应用</span>
                <Icon path={mdiChevronRight} size={0.85} />

                {hoverIndex === 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: -4,
                      marginLeft: 4,
                      minWidth: 160,
                      padding: 6,
                      borderRadius: 10,
                      background: 'rgba(243,244,246,0.96)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--win-border)',
                      boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      zIndex: 10007
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {allApps.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          ...menuItemStyle,
                          width: undefined // Override width 100% to allow flex container sizing if needed, but 100% is fine in flex col
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          closeMenu()
                          openApp(app.id)
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = hoverColor}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {app.iconUrl ? (
                          <img src={app.iconUrl} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                        ) : (
                          <div style={{ width: 20, height: 20, background: hoverColor, borderRadius: 4 }} />
                        )}
                        {app.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                style={{
                  ...menuItemStyle,
                  background: hoverIndex === 2 ? hoverColor : 'transparent'
                }}
                onClick={() => {
                  closeMenu()
                  openApp('file-manager')
                }}
                onMouseEnter={() => setHoverIndex(2)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(2)}
                onBlur={() => setHoverIndex(null)}
              >
                <Icon path={mdiFolderOutline} size={0.85} />
                文档管理器
              </button>
              <button
                style={{
                  ...menuItemStyle,
                  background: hoverIndex === 3 ? hoverColor : 'transparent'
                }}
                onClick={() => {
                  closeMenu()
                  window.location.reload()
                }}
                onMouseEnter={() => setHoverIndex(3)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(3)}
                onBlur={() => setHoverIndex(null)}
              >
                <Icon path={mdiRefresh} size={0.85} />
                刷新
              </button>
              <button
                style={{
                  ...menuItemStyle,
                  background: hoverIndex === 4 ? hoverColor : 'transparent'
                }}
                onClick={() => {
                  closeMenu()
                  openApp('system-settings')
                }}
                onMouseEnter={() => setHoverIndex(4)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(4)}
                onBlur={() => setHoverIndex(null)}
              >
                <Icon path={mdiCogOutline} size={0.85} />
                系统设置
              </button>
              <button
                style={{
                  ...menuItemStyle,
                  background: hoverIndex === 5 ? hoverColor : 'transparent'
                }}
                onClick={() => {
                  closeMenu()
                  openApp('user-center')
                }}
                onMouseEnter={() => setHoverIndex(5)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(5)}
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
        </div>,
        document.body
      )}
    </div>
  )
}
