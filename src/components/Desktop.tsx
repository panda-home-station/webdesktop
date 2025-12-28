import React, { useCallback, useEffect, useMemo, useState } from 'react'
import WindowManager from './WindowManager'
import { getWallpaper, setWallpaper } from '../state/desktop'

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
      background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : '#f0f0f0'
    }
    return base
  }, [wallpaper])

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const closeMenu = useCallback(() => setMenu(null), [])

  return (
    <div style={style} className="puter-desktop" onContextMenu={onContextMenu}>
      <WindowManager />
    </div>
  )
}
