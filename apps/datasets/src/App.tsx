import React, { useEffect, useState } from 'react'
import { SidebarLayout, SidebarItem } from '../../../src/apps/layouts/SidebarLayout'

interface Dataset {
  name: string
  path: string
  mountpoint: string
  used_bytes: number
  available_bytes: number
  compression: string
}

export default function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setDatasets([
        { name: 'tank', path: 'tank', mountpoint: '/mnt/tank', used_bytes: 1099511627776, available_bytes: 549755813888, compression: 'lz4' },
        { name: 'tank/home', path: 'tank/home', mountpoint: '/mnt/tank/home', used_bytes: 549755813888, available_bytes: 274877906944, compression: 'lz4' },
        { name: 'tank/media', path: 'tank/media', mountpoint: '/mnt/tank/media', used_bytes: 274877906944, available_bytes: 824633720832, compression: 'zstd' },
        { name: 'tank/backups', path: 'tank/backups', mountpoint: '/mnt/tank/backups', used_bytes: 137438953472, available_bytes: 962072674304, compression: 'lz4' },
        { name: 'backup', path: 'backup', mountpoint: '/mnt/backup', used_bytes: 274877906944, available_bytes: 522241000960, compression: 'lz4' }
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

  const getDepth = (path: string) => path.split('/').length - 1
  const sortedDatasets = [...datasets].sort((a, b) => a.path.localeCompare(b.path))

  const sidebarItems: SidebarItem[] = [
    {
      id: 'datasets',
      label: '数据集',
      icon: <span>📁</span>,
      content: (
        <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div style={{ fontSize: 16, color: '#666' }}>加载中...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 20, color: '#1a1a1a' }}>数据集列表</h2>
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
                  创建数据集
                </button>
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>名称</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>挂载点</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#666' }}>已使用</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#666' }}>可用</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#666' }}>压缩</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDatasets.map((dataset) => {
                      const indent = getDepth(dataset.path) * 24
                      const total = dataset.used_bytes + dataset.available_bytes
                      const usedPercent = (dataset.used_bytes / total) * 100
                      return (
                        <tr
                          key={dataset.path}
                          style={{ borderBottom: '1px solid #f0f0f0', ':hover': { backgroundColor: '#f8f8f8' } }}
                        >
                          <td style={{ padding: '12px 16px', fontSize: 14, color: '#1a1a1a' }}>
                            <span style={{ display: 'inline-block', width: indent }} />
                            <span style={{
                              paddingLeft: indent > 0 ? 16 : 0,
                              fontSize: 15,
                              fontWeight: indent === 0 ? 500 : 400,
                              color: '#1976d2'
                            }}>
                              {dataset.name}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{dataset.mountpoint}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#1a1a1a' }}>
                            {formatBytes(dataset.used_bytes)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#1a1a1a' }}>
                            {formatBytes(dataset.available_bytes)}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              borderRadius: 4,
                              fontSize: 13,
                              fontWeight: 500
                            }}>
                              {dataset.compression}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'permissions',
      label: '权限',
      icon: <span>🔒</span>,
      content: (
        <div style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#1a1a1a' }}>权限管理</h2>
          <div style={{
            backgroundColor: '#fff9c4',
            borderRadius: 8,
            padding: 16,
            fontSize: 14,
            color: '#f57f17'
          }}>
            权限管理功能即将上线...
          </div>
        </div>
      )
    },
    {
      id: 'snapshots',
      label: '快照',
      icon: <span>📷</span>,
      content: (
        <div style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#1a1a1a' }}>快照管理</h2>
          <div style={{
            backgroundColor: '#fff9c4',
            borderRadius: 8,
            padding: 16,
            fontSize: 14,
            color: '#f57f17'
          }}>
            快照管理功能即将上线...
          </div>
        </div>
      )
    },
    {
      id: 'quotas',
      label: '配额',
      icon: <span>📊</span>,
      content: (
        <div style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#1a1a1a' }}>配额管理</h2>
          <div style={{
            backgroundColor: '#fff9c4',
            borderRadius: 8,
            padding: 16,
            fontSize: 14,
            color: '#f57f17'
          }}>
            配额管理功能即将上线...
          </div>
        </div>
      )
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>数据集</h1>
      </div>
      <div style={{ flex: 1 }}>
        <SidebarLayout items={sidebarItems} defaultActiveId="datasets" />
      </div>
    </div>
  )
}
