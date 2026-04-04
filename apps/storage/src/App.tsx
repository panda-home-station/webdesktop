import React, { useEffect, useState } from 'react'

interface Disk {
  name: string
  size_bytes: number
  serial: string
  status: string
  model: string
}

interface Pool {
  name: string
  size_bytes: number
  available_bytes: number
  healthy: boolean
  status: string
}

export default function Storage() {
  const [disks, setDisks] = useState<Disk[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setDisks([
        { name: 'ada0', size_bytes: 2000398934016, serial: 'WD-WCC12345678', status: 'ONLINE', model: 'WDC WD20EZAZ' },
        { name: 'ada1', size_bytes: 2000398934016, serial: 'WD-WCC87654321', status: 'ONLINE', model: 'WDC WD20EZAZ' },
        { name: 'ada2', size_bytes: 2000398934016, serial: 'WD-WCC11212344', status: 'ONLINE', model: 'WDC WD20EZAZ' },
        { name: 'ada3', size_bytes: 2000398934016, serial: 'WD-WCC55667788', status: 'ONLINE', model: 'WDC WD20EZAZ' }
      ])
      setPools([
        { name: 'tank', size_bytes: 8000000000000, available_bytes: 4000000000000, healthy: true, status: 'ONLINE' }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.floor(Math.log(bytes) / Math.log(1024))
    const value = bytes / Math.pow(1024, index)
    return `${value.toFixed(1)} ${units[index]}`
  }

  const formatSize = (bytes: number) => {
    const tb = bytes / (1024 * 1024 * 1024 * 1024)
    return `${tb.toFixed(2)} TB`
  }

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div style={{ fontSize: 16, color: '#666' }}>加载中...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400 }}>
          {/* Header */}
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: '#1a1a1a' }}>存储</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>
              管理磁盘和存储池
            </p>
          </div>

          {/* Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>磁盘数量</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#1a1a1a' }}>{disks.length}</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>存储池数量</div>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#1a1a1a' }}>{pools.length}</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>总容量</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a' }}>
                {formatSize(pools.reduce((acc, p) => acc + p.size_bytes, 0))}
              </div>
            </div>
          </div>

          {/* Pools */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#1a1a1a' }}>存储池</h2>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                创建存储池
              </button>
            </div>

            {pools.map(pool => {
              const usedPercent = ((pool.size_bytes - pool.available_bytes) / pool.size_bytes) * 100
              return (
                <div
                  key={pool.name}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 24,
                    marginBottom: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#1a1a1a' }}>{pool.name}</h3>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: pool.healthy ? '#e8f5e9' : '#ffebee',
                        color: pool.healthy ? '#4caf50' : '#f44336',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        {pool.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: '#666' }}>
                        已使用: {formatBytes(pool.size_bytes - pool.available_bytes)}
                      </span>
                      <span style={{ fontSize: 14, color: '#666' }}>
                        {usedPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: 12,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 6,
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${usedPercent}%`,
                          height: '100%',
                          backgroundColor: usedPercent > 80 ? '#f44336' : usedPercent > 60 ? '#ff9800' : '#4caf50',
                          borderRadius: 6,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: 14, color: '#666' }}>
                    总容量: {formatBytes(pool.size_bytes)} · 可用: {formatBytes(pool.available_bytes)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Disks */}
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#1a1a1a' }}>磁盘</h2>
            <div style={{
              backgroundColor: 'white',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {disks.map((disk, index) => (
                <div
                  key={disk.name}
                  style={{
                    padding: 20,
                    borderBottom: index < disks.length - 1 ? '1px solid #f0f0f0' : undefined,
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 1fr 150px 100px',
                    gap: 16,
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{disk.name}</div>
                  <div style={{ fontSize: 14, color: '#666' }}>{disk.model}</div>
                  <div style={{ fontSize: 14, color: '#666' }}>{disk.serial}</div>
                  <div style={{ fontSize: 14, color: '#666' }}>{formatBytes(disk.size_bytes)}</div>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: disk.status === 'ONLINE' ? '#e8f5e9' : '#ffebee',
                    color: disk.status === 'ONLINE' ? '#4caf50' : '#f44336',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: 'center'
                  }}>
                    {disk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
