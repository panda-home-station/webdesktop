/**
 * Wallpaper Hook
 *
 * Manages desktop wallpaper
 */

import { useEffect, useState } from 'react'
import { getWallpaper, setWallpaper } from '../state/desktop'

type WallpaperEvent = {
  detail?: {
    url?: string
  }
}

export function useWallpaper() {
  const [wallpaper, setWallpaperUrl] = useState(getWallpaper())

  useEffect(() => {
    const url = getWallpaper()
    setWallpaperUrl(url)

    const onWp = (e: Event) => {
      const u = (e as WallpaperEvent)?.detail?.url
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

  return wallpaper
}

export function useWallpaperActions() {
  return {
    setWallpaper: (path: string) => {
      setWallpaper(path)
    },
    resetWallpaper: () => {
      const { resetWallpaper } = import('../state/desktop')
      resetWallpaper()
    },
  }
}
