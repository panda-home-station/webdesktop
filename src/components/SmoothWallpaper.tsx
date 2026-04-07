import React, { useCallback, useEffect, useState } from 'react'

interface SmoothWallpaperProps {
  src?: string
}

const DEFAULT_WALLPAPER = '/wallpaper_default.webp'

export default function SmoothWallpaper({ src }: SmoothWallpaperProps) {
  const [cur, setCur] = useState<string | null>(src || DEFAULT_WALLPAPER)
  const [next, setNext] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    const wallpaperSrc = src || DEFAULT_WALLPAPER

    if (cur === wallpaperSrc || next === wallpaperSrc) return

    const img = new Image()
    img.src = wallpaperSrc
    img.decode?.().then(() => {
      setNext(wallpaperSrc)
      requestAnimationFrame(() => setFadeIn(true))
    }).catch(() => {
      setNext(wallpaperSrc)
      requestAnimationFrame(() => setFadeIn(true))
    })
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
      className="wallpaperContainer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: `var(--desktop-bg, linear-gradient(135deg, #eef3ff 0%, #e6edff 100%))`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {cur && (
        <img
          src={cur}
          decoding="async"
          draggable={false}
          className="wallpaperImage"
          style={{ opacity: 1, position: 'fixed', inset: 0, zIndex: 0 }}
          alt=""
        />
      )}
      {next && (
        <img
          src={next}
          decoding="async"
          draggable={false}
          onTransitionEnd={onTransitionEnd}
          className="wallpaperImage"
          style={{
            opacity: fadeIn ? 1 : 0,
            transition: 'opacity 220ms ease',
            position: 'fixed',
            inset: 0,
            zIndex: 0,
          }}
          alt=""
        />
      )}
    </div>
  )
}
