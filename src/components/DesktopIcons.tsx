import React, { useMemo } from 'react'
import { listApps } from '../apps/registry'
import { openApp } from '../sdk/desktop'

export default function DesktopIcons() {
  const apps = listApps()
  const items = useMemo(() => apps, [apps])
  return (
    <div style={{ position: 'absolute', left: 16, top: 64, display: 'grid', gridTemplateColumns: 'repeat(6, 96px)', gap: 16 }}>
      {items.map(a => (
        <div key={`desk-${a.id}`} style={{ width: 96, textAlign: 'center' }}>
          <button
            onClick={() => openApp(a.id)}
            style={{ width: 96, height: 96, borderRadius: 12, background: 'rgba(17,24,39,0.6)', border: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={a.title}
          >
            {a.iconUrl ? <img src={a.iconUrl} alt="" width={64} height={64} style={{ borderRadius: 8 }} /> : <div style={{ width: 64, height: 64, borderRadius: 8, background: '#1f2937' }} />}
          </button>
          <div style={{ marginTop: 6, color: '#e5e7eb', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{a.title}</div>
        </div>
      ))}
    </div>
  )
}
