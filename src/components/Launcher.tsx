import React, { useEffect, useMemo, useState } from 'react'
import { listApps, loadApp } from '../apps/registry'
import { requestPermission } from '../sdk/permissions'
import { setAnimating, setLauncherOpen } from '../sdk/desktop'

type Props = {
  onOpen: (id: string, title: string, Comp: React.ComponentType<any>, iconUrl?: string) => void
  onClose: () => void
}

export default function Launcher({ isOpen, onOpen, onClose }: Props & { isOpen: boolean }) {
  const [q, setQ] = useState('')
  const apps = listApps()
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? apps.filter(a => (a.title || '').toLowerCase().includes(s) || a.id.toLowerCase().includes(s)) : apps
  }, [q, apps])

  // Reset search on open
  const inputRef = React.useRef<HTMLInputElement>(null)
  useEffect(() => {
    setLauncherOpen(isOpen)
    if (isOpen) {
        setAnimating(true)
        setQ('')
        // Focus input when opened
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
        // 动画大约 200-300ms
        const timer = setTimeout(() => setAnimating(false), 300)
        return () => clearTimeout(timer)
    } else {
        setAnimating(true)
        const timer = setTimeout(() => setAnimating(false), 200)
        return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(220, 220, 220, 0.6)',
        backdropFilter: 'blur(30px)',
        // Use CSS transitions for visibility
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: isOpen 
           ? 'opacity 0.1s ease' 
           : 'opacity 0.1s ease, visibility 0s linear 0.1s',
        pointerEvents: isOpen ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '10vh'
      }}
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          marginBottom: 48,
          padding: '0 20px',
          // Re-trigger animation when opening
          animation: isOpen ? 'launcher-zoom-in 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' : 'none',
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="搜索"
          // autoFocus logic needs to be handled carefully or just keep it
          // If hidden, it loses focus?
          // autoFocus={isOpen} 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            width: '100%', 
            padding: '12px 16px', 
            borderRadius: 12, 
            border: 'none', 
            background: 'rgba(255,255,255,0.6)', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            fontSize: 16,
            color: '#333',
            textAlign: 'center',
            outline: 'none'
          }}
        />
      </div>

      <div 
        className="hide-scrollbar"
        style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
            gap: 0, 
            width: '100%',
            maxWidth: 1200,
            padding: '0 40px',
            justifyContent: 'center',
            overflow: 'auto',
            animation: isOpen ? 'launcher-zoom-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'launcher-zoom-out 0.1s ease forwards',
            // Delay for stagger effect on open
            animationDelay: isOpen ? '0.02s' : '0s',
            opacity: 0 // handled by animation
        }}
      >
        {filtered.map(a => (
          <button
            key={a.id}
            title={a.title}
            onClick={async () => {
              const caps = (a as any).capabilities as string[] | undefined
              if (Array.isArray(caps)) {
                for (const cap of caps) {
                  const ok = requestPermission(a.id, cap)
                  if (!ok) return
                }
              }
              const Comp = await loadApp(a.id)
              onOpen(a.id, a.title, Comp, a.iconUrl)
              onClose()
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              height: 156,
              width: '100%',
              border: 'none',
              borderRadius: 20,
              background: 'transparent',
              color: '#333',
              cursor: 'pointer',
              transition: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.12)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ 
                width: 76, 
                height: 76, 
                borderRadius: 18, 
                background: 'rgba(255, 255, 255, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 1px rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(20px)',
            }}>
                {a.iconUrl ? (
                  <img src={a.iconUrl} alt="" style={{ width: '65%', height: '65%', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)' }} />
                )}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#222' }}>{a.title}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
