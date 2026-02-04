import React from 'react'
import { Container } from '../types'
import { iOSButtonStyle } from '../utils'
import Icon from '@mdi/react'
import { mdiPlay, mdiStop, mdiRefresh, mdiDelete } from '@mdi/js'

interface ContainerListProps {
  containers: Container[]
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string) => void
}

export function ContainerList({ containers, onStart, onStop, onRestart, onRemove }: ContainerListProps) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>容器</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {containers.map(c => (
          <div key={c.id} style={{
            background: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: c.state === 'running' ? '#34c759' : '#ff3b30',
                boxShadow: `0 0 0 2px ${c.state === 'running' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)'}`
              }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{(c.names && c.names[0]) || c.id.slice(0, 12)}</div>
                <div style={{ fontSize: 13, color: '#8e8e93', fontFamily: 'monospace' }}>{c.image}</div>
                {c.ports?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#8e8e93', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {c.ports.map(([priv, pub, typ], i) => (
                      <span key={i} style={{ background: 'rgba(0,0,0,0.03)', padding: '2px 6px', borderRadius: 4 }}>
                        {pub ? `${pub}→${priv}` : `${priv}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {c.state !== 'running' && (
                <button onClick={() => onStart(c.id)} style={iOSButtonStyle('primary')} title="启动">
                  <Icon path={mdiPlay} size={0.8} />
                </button>
              )}
              {c.state === 'running' && (
                <button onClick={() => onStop(c.id)} style={iOSButtonStyle('default')} title="停止">
                  <Icon path={mdiStop} size={0.8} />
                </button>
              )}
              <button onClick={() => onRestart(c.id)} style={iOSButtonStyle('default')} title="重启">
                <Icon path={mdiRefresh} size={0.8} />
              </button>
              <button onClick={() => onRemove(c.id)} style={iOSButtonStyle('danger')} title="删除">
                <Icon path={mdiDelete} size={0.8} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {containers.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>
          暂无容器
        </div>
      )}
    </div>
  )
}
