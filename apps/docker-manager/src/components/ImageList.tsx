import React from 'react'
import { Image } from '../types'
import { iOSButtonStyle, fmtSize, fmtImageName } from '../utils'
import Icon from '@mdi/react'
import { mdiPlay, mdiDelete, mdiPlus, mdiRefresh } from '@mdi/js'

interface ImageListProps {
  images: Image[]
  onRun: (img: Image) => void
  onDelete: (img: Image) => void
  onDownload: () => void
  onRetryPull: (imgName: string) => void
}

export function ImageList({ images, onRun, onDelete, onDownload, onRetryPull }: ImageListProps) {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>本地镜像</h2>
        <button 
          onClick={onDownload} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: '#007aff',
            color: 'white',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,122,255,0.2)'
          }}
        >
          <Icon path={mdiPlus} size={0.8} /> 下载镜像
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {images.map(img => {
          const isPulling = img.status === 'pulling'
          const isError = img.status === 'error'
          
          return (
            <div key={img.id} style={{
              background: '#fff',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: `1px solid ${isError ? '#ff3b30' : 'rgba(0,0,0,0.05)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginRight: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {(img.repo_tags && img.repo_tags[0]) ? fmtImageName(img.repo_tags[0]) : img.id.slice(0, 12)}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#8e8e93' }}>
                    <span style={{ fontFamily: 'monospace' }}>{img.id.slice(0, 12)}</span>
                    {!isPulling && !isError && <span>{fmtSize(img.size)}</span>}
                    {isPulling && <span style={{ color: '#007aff' }}>正在下载...</span>}
                    {isError && <span style={{ color: '#ff3b30' }}>下载失败</span>}
                  </div>
                  {isError && img.error && (
                    <div style={{ fontSize: 12, color: '#ff3b30', marginTop: 4, opacity: 0.8 }}>
                      错误: {img.error}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {isError && (
                    <button 
                      onClick={() => onRetryPull(img.repo_tags[0] || img.id)} 
                      style={{ ...iOSButtonStyle('primary'), background: '#ff9500' }} 
                      title="重试"
                    >
                      <Icon path={mdiRefresh} size={0.8} /> 重试
                    </button>
                  )}
                  <button 
                    onClick={() => onRun(img)} 
                    style={{ ...iOSButtonStyle('primary'), opacity: (isPulling || isError) ? 0.5 : 1, cursor: (isPulling || isError) ? 'not-allowed' : 'pointer' }} 
                    disabled={isPulling || isError}
                    title="运行"
                  >
                    <Icon path={mdiPlay} size={0.8} /> 运行
                  </button>
                  <button 
                    onClick={() => onDelete(img)} 
                    style={{ ...iOSButtonStyle('danger'), opacity: isPulling ? 0.5 : 1, cursor: isPulling ? 'not-allowed' : 'pointer' }} 
                    disabled={isPulling}
                    title="删除"
                  >
                    <Icon path={mdiDelete} size={0.8} />
                  </button>
                </div>
              </div>

              {isPulling && (
                <div style={{ width: '100%', background: '#f2f2f7', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${img.progress || 0}%`, 
                    height: '100%', 
                    background: '#007aff', 
                    transition: 'width 0.3s ease' 
                  }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {images.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>
          暂无镜像
        </div>
      )}
    </div>
  )
}
