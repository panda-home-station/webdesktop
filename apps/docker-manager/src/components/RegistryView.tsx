import React from 'react'
import Icon from '@mdi/react'
import { mdiMagnify, mdiCogOutline, mdiOpenInNew } from '@mdi/js'
import { iOSButtonStyle } from '../utils'

interface RegistryViewProps {
  query: string
  setQuery: (q: string) => void
  onSearch: () => void
  loading: boolean
  items: any[]
  hotItems: any[]
  didSearch: boolean
  pulling: boolean
  onPull: (ref: string) => void
  page: number
  hasNext: boolean
  hasPrev: boolean
  onNextPage: () => void
  onPrevPage: () => void
  onOpenSettings: () => void
}

export function RegistryView({
  query, setQuery, onSearch, loading, items, hotItems, didSearch, pulling, onPull,
  page, hasNext, hasPrev, onNextPage, onPrevPage, onOpenSettings
}: RegistryViewProps) {
  
  const displayItems = didSearch ? items : hotItems
  const isEmpty = !loading && (didSearch ? items.length === 0 : hotItems.length === 0)

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>镜像仓库</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="搜索镜像"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
              className="panda-input"
              style={{
                width: 240,
                height: 36,
                padding: '0 12px 0 32px',
                borderRadius: 10,
                border: '1px solid #e5e5ea',
                background: '#f2f2f7',
                fontSize: 14
              }}
            />
            <div style={{ position: 'absolute', left: 8, top: 9, color: '#8e8e93' }}>
              <Icon path={mdiMagnify} size={0.8} />
            </div>
          </div>
          <button onClick={onSearch} disabled={loading} style={{ ...iOSButtonStyle('primary'), height: 36, padding: '0 16px' }}>
            搜索
          </button>
          <button onClick={onOpenSettings} style={{ ...iOSButtonStyle('default'), height: 36, width: 36, padding: 0 }}>
            <Icon path={mdiCogOutline} size={0.9} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>加载中...</div>}
        
        {!loading && !isEmpty && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {displayItems.map((it, idx) => {
              const name = it?.name || ''
              const ns = it?.namespace || ''
              const stars = typeof it?.star_count === 'number' ? it.star_count : 0
              const pulls = typeof it?.pull_count === 'number' ? it.pull_count : 0
              const official = !!it?.is_official
              const ref = official ? name : (ns && name ? `${ns}/${name}` : name)
              
              return (
                <div key={idx} style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{ref}</span>
                      {official && (
                        <span style={{ background: 'rgba(52, 199, 89, 0.1)', color: '#34c759', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                          OFFICIAL
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#8e8e93' }}>
                      {stars} stars · {pulls} pulls
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => onPull(ref)} 
                      disabled={pulling}
                      style={iOSButtonStyle('default')}
                    >
                      {pulling ? '下载中...' : '下载'}
                    </button>
                    <button
                      onClick={() => {
                         const href = official
                           ? `https://hub.docker.com/_/${name}`
                           : (ns ? `https://hub.docker.com/r/${ns}/${name}` : `https://hub.docker.com/_/${name}`)
                         window.open(href, '_blank')
                      }}
                      style={{ ...iOSButtonStyle('default'), width: 32, padding: 0 }}
                    >
                      <Icon path={mdiOpenInNew} size={0.8} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isEmpty && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93' }}>
            未找到相关镜像
          </div>
        )}
      </div>

      <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #e5e5ea', marginTop: 'auto' }}>
        <button 
          onClick={onPrevPage} 
          disabled={!hasPrev || page <= 1 || loading}
          style={{ ...iOSButtonStyle('default'), opacity: (!hasPrev || page <= 1 || loading) ? 0.5 : 1 }}
        >
          上一页
        </button>
        <span style={{ margin: '0 16px', color: '#8e8e93', fontSize: 14 }}>第 {page} 页</span>
        <button 
          onClick={onNextPage} 
          disabled={!hasNext || loading}
          style={{ ...iOSButtonStyle('default'), opacity: (!hasNext || loading) ? 0.5 : 1 }}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
