import React, { useEffect, useState } from 'react'
import Desktop from './components/Desktop'
import { getWallpaper } from './state/desktop'
import { truenasApi } from './truenas/api'

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
  const [wallpaper, setWallpaperUrl] = useState(getWallpaper())

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

  const style: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    background: 'transparent',
    position: 'relative'
  }

  return (
    <div style={style} className="panda-desktop">
      <SmoothWallpaper src={wallpaper} />
      <Desktop />
    </div>
  )
}
