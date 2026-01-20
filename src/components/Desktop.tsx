import React, { useCallback, useEffect, useMemo, useState } from 'react'
import WindowManager from './WindowManager'
import { getWallpaper, setWallpaper } from '../state/desktop'
import { openApp } from '../sdk/desktop'
import Icon from '@mdi/react'
import { mdiRefresh, mdiCogOutline, mdiAccountCircleOutline } from '@mdi/js'

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
      background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : '#f0f0f0'
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
