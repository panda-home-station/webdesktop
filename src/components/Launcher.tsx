import React, { useEffect, useMemo, useState } from 'react'
import { listApps, loadApp } from '../apps/registry'
import { requestPermission } from '../sdk/permissions'

type Props = {
  onOpen: (id: string, title: string, Comp: React.ComponentType<any>, iconUrl?: string) => void
  onClose: () => void
}

export default function Launcher({ onOpen, onClose }: Props) {
  const [q, setQ] = useState('')
  const [enter, setEnter] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const apps = listApps()
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? apps.filter(a => (a.title || '').toLowerCase().includes(s) || a.id.toLowerCase().includes(s)) : apps
  }, [q, apps])
  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 0)
    return () => clearTimeout(t)
  }, [])
  const closeWithAnim = () => {
    setLeaving(true)
    setTimeout(() => onClose(), 180)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.2)',
        zIndex: 9000,
        opacity: enter && !leaving ? 1 : 0,
        transition: 'opacity 160ms ease'
      }}
      onClick={(e) => {
        if (e.currentTarget === e.target) closeWithAnim()
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 16,
          borderRadius: 0,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(10px)',
          transform: enter && !leaving ? 'scale(1)' : 'scale(0.96)',
          opacity: enter && !leaving ? 1 : 0,
          transition: 'opacity 160ms ease, transform 200ms ease',
          willChange: 'opacity, transform'
        }}
        onClick={closeWithAnim}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}
        >
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜索应用"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '33vw', maxWidth: 600, minWidth: 280, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--button-border)', background: 'var(--button-bg)', color: 'var(--text)' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, alignContent: 'start', overflow: 'auto', marginLeft: '8vw', pointerEvents: 'auto' }}>
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
                closeWithAnim()
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: 14,
                borderRadius: 14,
                border: '1px solid var(--button-border)',
                background: 'var(--button-bg)',
                color: 'var(--text)',
              }}
            >
              {a.iconUrl ? (
                <img src={a.iconUrl} alt="" width={64} height={64} style={{ borderRadius: 8 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 8, background: '#1f2937' }} />
              )}
              <div>{a.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
