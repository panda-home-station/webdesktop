import { useEffect, useState } from 'react'

interface CatalogApp {
  id: string
  name: string
  description: string
  icon: string
  installed: boolean
  category: string
}

export default function Apps() {
  const [apps, setApps] = useState<CatalogApp[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setTimeout(() => {
      setApps([
        { id: 'plex', name: 'Plex Media Server', description: '媒体服务器', icon: '🎬', installed: true, category: 'media' },
        { id: 'jellyfin', name: 'Jellyfin', description: '免费开源媒体服务器', icon: '📺', installed: false, category: 'media' },
        { id: 'nextcloud', name: 'Nextcloud', description: '文件共享和协作平台', icon: '☁️', installed: true, category: 'productivity' },
        { id: 'homeassistant', name: 'Home Assistant', description: '智能家居自动化平台', icon: '🏠', installed: false, category: 'automation' },
        { id: 'portainer', name: 'Portainer', description: 'Docker 容器管理界面', icon: '🐳', installed: true, category: 'management' },
        { id: 'pi-hole', name: 'Pi-hole', description: '网络广告拦截', icon: '🛡️', installed: false, category: 'network' },
        { id: 'minecraft', name: 'Minecraft Server', description: '我的世界服务器', icon: '⛏️', installed: false, category: 'gaming' },
        { id: 'grafana', name: 'Grafana', description: '数据可视化和监控平台', icon: '📊', installed: false, category: 'management' }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredApps = filter === 'all' ? apps : apps.filter(app => app.category === filter)

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'media', label: '媒体' },
    { id: 'productivity', label: '生产力' },
    { id: 'automation', label: '自动化' },
    { id: 'management', label: '管理' },
    { id: 'network', label: '网络' },
    { id: 'gaming', label: '游戏' }
  ]

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div style={{ fontSize: 16, color: '#666' }}>加载中...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
          {/* Header */}
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: '#1a1a1a' }}>应用</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>
              发现、安装和管理容器化应用
            </p>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filter === cat.id ? '#1976d2' : 'white',
                  color: filter === cat.id ? 'white' : '#666',
                  border: filter === cat.id ? 'none' : '1px solid #e0e0e0',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: filter === cat.id ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  ':hover': {
                    backgroundColor: filter === cat.id ? '#1976d2' : '#f8f8f8'
                  }
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Apps Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20
          }}>
            {filteredApps.map(app => (
              <div
                key={app.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: '1px solid #f0f0f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'all 0.15s ease',
                  ':hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    backgroundColor: '#f8f8f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32
                  }}>
                    {app.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                      {app.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>{app.description}</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  {app.installed ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{
                        padding: '6px 12px',
                        backgroundColor: '#e8f5e9',
                        color: '#4caf50',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        已安装
                      </span>
                      <button
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        打开
                      </button>
                    </div>
                  ) : (
                    <button
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        ':hover': {
                          backgroundColor: '#1565c0'
                        }
                      }}
                    >
                      安装
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
