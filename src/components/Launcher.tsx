import React, { useEffect, useMemo, useState, memo } from 'react'
import { listApps, loadApp } from '../apps/registry'
import { requestPermission } from '../sdk/permissions'
import { setAnimating, setLauncherOpen } from '../sdk/desktop'

type Props = {
  onOpen: (id: string, title: string, Comp: React.ComponentType<any>, iconUrl?: string) => void
  onClose: () => void
}

const AppItem = memo(({ a, onOpen, onClose }: { a: any, onOpen: Props['onOpen'], onClose: Props['onClose'] }) => {
  return (
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
      className="launcher-app-item"
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
         color: '#000',
          cursor: 'pointer',
        }}
      >
        <div 
            className="launcher-icon-container"
            style={{ 
            width: 76, 
            height: 76, 
            borderRadius: 18, 
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,255,0.5)',
        }}>
            {a.iconUrl ? (
              <img src={a.iconUrl} alt="" style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)' }} />
            )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f' }}>{a.title}</div>
    </button>
  )
})

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
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: isOpen 
           ? 'opacity 0.1s ease' 
           : 'opacity 0.1s ease, visibility 0s linear 0.1s',
        pointerEvents: isOpen ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '10vh',
        contain: 'layout paint style'
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target === e.currentTarget || target.classList.contains('launcher-grid')) {
          onClose();
        }
      }}
    >
      {/* 独立背景层，避免子元素更新导致全屏重绘 */}
      <div 
         style={{
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: isOpen ? 'blur(40px)' : 'none',
            pointerEvents: 'none',
            transform: 'translateZ(0)'
          }}
        />
        <div
          style={{
            width: '100%',
            maxWidth: 600,
            marginBottom: 48,
            padding: '0 20px',
            // 使用简单的淡入淡出，移除缩放动画以节省资源
            animation: isOpen ? 'launcher-fade-in 0.1s ease forwards' : 'none',
            contain: 'content'
          }}
        >
          <input
             ref={inputRef}
             value={q}
             onChange={e => setQ(e.target.value)}
             placeholder="搜索"
             onMouseDown={(e) => e.stopPropagation()}
             onClick={(e) => e.stopPropagation()}
             style={{ 
               width: '100%', 
               padding: '12px 16px', 
               borderRadius: 22, 
               border: '1px solid rgba(0, 0, 0, 0.1)', 
               background: 'rgba(255, 255, 255, 0.6)', 
               boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
               fontSize: 17,
               color: '#000',
               textAlign: 'center',
               outline: 'none',
               boxSizing: 'border-box'
             }}
           />
        </div>

      <div 
        className="hide-scrollbar launcher-grid"
        style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
            gap: 0, 
            width: '100%',
            maxWidth: 1200,
            padding: '0 40px',
            justifyContent: 'center',
            overflow: 'auto',
            animation: isOpen ? 'launcher-fade-in 0.15s ease forwards' : 'none',
            opacity: 0,
            transform: 'translateZ(0)',
            contain: 'layout paint',
            flex: 1
        }}
      >
        {filtered.map(a => (
          <AppItem key={a.id} a={a} onOpen={onOpen} onClose={onClose} />
        ))}
      </div>
    </div>
  )
}
