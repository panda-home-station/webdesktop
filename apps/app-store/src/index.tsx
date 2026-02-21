import React, { useEffect, useContext } from 'react'
import { listApps } from '../../../src/apps/registry'
import { WindowContext } from '../../../src/sdk/window'

export default function AppStore() {
  const win = useContext(WindowContext)
  useEffect(() => {
    if (win && win.setTitle) win.setTitle('App Store - 全部应用')
  }, [win])

  const apps = listApps()
  return (
    <div style={{ padding: 16 }} className="noselect">
      <h2 style={{ margin: 0, marginBottom: 12 }}>应用商店</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {apps.map(a => (
          <div key={`store-${a.id}`} className="panda-window" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {a.iconUrl ? <img src={a.iconUrl} alt="" width={36} height={36} style={{ borderRadius: 8 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,0,0,0.06)' }} />}
              <div>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{a.id}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
