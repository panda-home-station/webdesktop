import React from 'react'
import { Volume } from '../types'
import { iOSButtonStyle } from '../utils'
import Icon from '@mdi/react'
import { mdiDelete, mdiPlus } from '@mdi/js'

interface VolumeListProps {
  volumes: Volume[]
  onCreate: () => void
  onRemove: (name: string) => void
}

export function VolumeList({ volumes, onCreate, onRemove }: VolumeListProps) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0' }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>存储卷</h2>
        <button onClick={onCreate} style={iOSButtonStyle('primary')} title="创建存储卷">
          <Icon path={mdiPlus} size={0.8} /> 创建存储卷
        </button>
      </div>
      
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
              <div style={{ fontSize: 16, fontWeight: 600 }}>{v.name}</div>
              <div style={{ fontSize: 13, color: '#8e8e93' }}>
                {v.driver} · {v.mountpoint}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onRemove(v.name)} style={iOSButtonStyle('danger')} title="删除">
                <Icon path={mdiDelete} size={0.8} />
              </button>
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
