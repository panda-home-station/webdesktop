import React, { useState, useRef, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

interface LockScreenProps {
  onUnlock: () => void
  wallpaper?: string
  username?: string
}

export default function LockScreen({ onUnlock, wallpaper, username }: LockScreenProps) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleStart = (y: number) => {
    setIsDragging(true)
    startY.current = y
  }

  const handleMove = (y: number) => {
    if (!isDragging) return
    const delta = y - startY.current
    if (delta < 0) {
      setDragY(delta)
    }
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragY < -150) {
      onUnlock()
    } else {
      setDragY(0)
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
        background: 'transparent',
        opacity: 1 + dragY / 500, // 随着向上滑动逐渐变透明
        transition: isDragging ? 'none' : 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
      onMouseDown={(e) => handleStart(e.clientY)}
      onMouseMove={(e) => handleMove(e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientY)}
      onTouchEnd={handleEnd}
    >
      {/* Background with Blur */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${wallpaper || '/wallpaper_default.webp'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        filter: 'brightness(0.7)'
      }} />

      {/* Content Container */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px 20px 40px',
        color: '#fff',
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        {/* Time and Date */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 84, fontWeight: 200, marginBottom: 10 }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div style={{ fontSize: 24, fontWeight: 300 }}>
            {time.toLocaleDateString([], { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        {/* User and Unlock Tip */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {username && (
            <div style={{ 
              padding: '10px 20px', 
              borderRadius: 20, 
              background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)',
              fontSize: 16,
              fontWeight: 500
            }}>
              {username}
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 10,
            opacity: isDragging ? 0.3 : 1,
            transition: 'opacity 0.2s'
          }}>
            <div style={{
              animation: 'bounce 2s infinite'
            }}>
              <ChevronUp size={32} />
            </div>
            <div style={{ fontSize: 14, letterSpacing: 2, fontWeight: 300 }}>向上滑动解锁</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-10px);}
          60% {transform: translateY(-5px);}
        }
      `}</style>
    </div>
  )
}
