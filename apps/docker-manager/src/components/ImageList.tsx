import React from 'react'
import { Image } from '../types'
import { iOSButtonStyle, fmtSize, fmtImageName } from '../utils'
import Icon from '@mdi/react'
import { mdiPlay, mdiDelete } from '@mdi/js'

interface ImageListProps {
  images: Image[]
  onRun: (img: Image) => void
  onDelete: (img: Image) => void
}

export function ImageList({ images, onRun, onDelete }: ImageListProps) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>本地镜像</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {images.map(img => (
          <div key={img.id} style={{
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
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {(img.repo_tags && img.repo_tags[0]) ? fmtImageName(img.repo_tags[0]) : img.id.slice(0, 12)}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#8e8e93' }}>
                <span style={{ fontFamily: 'monospace' }}>{img.id.slice(0, 12)}</span>
                <span>{fmtSize(img.size)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onRun(img)} style={iOSButtonStyle('primary')} title="运行">
                <Icon path={mdiPlay} size={0.8} /> 运行
              </button>
              <button onClick={() => onDelete(img)} style={iOSButtonStyle('danger')} title="删除">
                <Icon path={mdiDelete} size={0.8} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {images.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>
          暂无镜像
        </div>
      )}
    </div>
  )
}
