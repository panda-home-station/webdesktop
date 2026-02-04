import React from 'react'
import { Volume } from '../types'
import { iOSButtonStyle } from '../utils'
import Icon from '@mdi/react'
import { mdiDelete } from '@mdi/js'

interface VolumeListProps {
  volumes: Volume[]
  // onRemove: (name: string) => void // Assuming we add remove capability later
}

export function VolumeList({ volumes }: VolumeListProps) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>存储卷</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {volumes.map((v, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{v.Name}</div>
              <div style={{ fontSize: 13, color: '#8e8e93' }}>
                {v.Driver} · {v.Mountpoint}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {/* <button onClick={() => onRemove(v.Name)} style={iOSButtonStyle('danger')} title="删除">
                <Icon path={mdiDelete} size={0.8} />
              </button> */}
            </div>
          </div>
        ))}
      </div>
      
      {volumes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>
          暂无存储卷
        </div>
      )}
    </div>
  )
}
