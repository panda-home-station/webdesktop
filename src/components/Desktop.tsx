import React, { useCallback, useEffect, useMemo, useState } from 'react'
import StatusBar from './StatusBar'
import WindowManager from './WindowManager'
import Notifications from './Notifications'
import { getWallpaper, setWallpaper } from '../state/desktop'
import { openLauncher } from '../sdk/desktop'
import DesktopIcons from './DesktopIcons'

export default function Desktop() {
  const [wallpaper, setWallpaperUrl] = useState<string>(getWallpaper())
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const url = getWallpaper()
    setWallpaperUrl(url)
  }, [])

  const style = useMemo(() => {
    const base: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : undefined
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
      <StatusBar />
      <WindowManager />
      <Notifications />
      <DesktopIcons />
      {menu && (
        <div
          style={{ position: 'fixed', left: menu.x, top: menu.y, background: 'var(--win-bg)', color: 'var(--text)', border: '1px solid var(--win-border)', borderRadius: 12, minWidth: 160, zIndex: 10000, backdropFilter: 'blur(12px)' }}
          onMouseLeave={closeMenu}
        >
          <button
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px' }}
            onClick={() => {
              openLauncher()
              closeMenu()
            }}
          >
            打开应用
          </button>
          <button
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px' }}
            onClick={() => {
              const url = prompt('输入壁纸 URL')
              if (url) {
                setWallpaper(url)
                setWallpaperUrl(url)
              }
              closeMenu()
            }}
          >
            更换壁纸
          </button>
          <button
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px' }}
            onClick={() => {
              setWallpaper(null)
              setWallpaperUrl('')
              closeMenu()
            }}
          >
            重置壁纸
          </button>
        </div>
      )}
    </div>
  )
}
