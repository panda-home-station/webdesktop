import React, { useCallback, useEffect, useState } from 'react'

interface SmoothWallpaperProps {
  src?: string
}

export default function SmoothWallpaper({ src }: SmoothWallpaperProps) {
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

  const onTransitionEnd = useCallback(() => {
    if (next) {
      setCur(next)
      setNext(null)
      setFadeIn(false)
    }
  }, [next])

  return (
    <div className="wallpaperContainer">
      {cur && (
        <img
          src={cur}
          decoding="async"
          draggable={false}
          className="wallpaperImage"
          style={{ opacity: 1 }}
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
          }}
          alt=""
        />
      )}
    </div>
  )
}
