import React, { useMemo, useState } from 'react'
import { listApps, loadApp } from '../apps/registry'
import { requestPermission } from '../sdk/permissions'

type Props = {
  onOpen: (id: string, title: string, Comp: React.ComponentType<any>, iconUrl?: string) => void
  onClose: () => void
}

export default function Launcher({ onOpen, onClose }: Props) {
  const [q, setQ] = useState('')
  const apps = listApps()
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? apps.filter(a => (a.title || '').toLowerCase().includes(s) || a.id.toLowerCase().includes(s)) : apps
  }, [q, apps])

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)' }} onClick={onClose}>
      <div
        className="puter-window"
        style={{ width: 800, maxWidth: '90vw', height: 500, maxHeight: '80vh', margin: '8vh auto', padding: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜索应用"
            style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--button-border)', background: 'var(--button-bg)', color: 'var(--text)' }}
          />
          <button className="puter-button" onClick={onClose}>关闭</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {filtered.map(a => (
            <div key={a.id} className="puter-window" style={{ padding: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {a.iconUrl ? <img src={a.iconUrl} alt="" width={64} height={64} style={{ borderRadius: 8 }} /> : <div style={{ width: 64, height: 64, borderRadius: 8, background: '#1f2937' }} />}
                <div style={{ color: 'var(--text)' }}>{a.title}</div>
                <button
                  className="puter-button"
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
                >
                  打开
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
