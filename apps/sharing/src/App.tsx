import { useEffect, useState } from 'react'
import { TabsLayout, TabItem } from '@desktop/layouts/TabsLayout'

interface Share {
  name: string
  path: string
  enabled: boolean
}

export default function Sharing() {
  const [smbShares, setSmbShares] = useState<Share[]>([])
  const [nfsShares, setNfsShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setSmbShares([
        { name: 'homes', path: '/mnt/tank/homes', enabled: true },
        { name: 'media', path: '/mnt/tank/media', enabled: true }
      ])
      setNfsShares([
        { name: 'backups', path: '/mnt/tank/backups', enabled: true }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const renderSharesTable = (shares: Share[]) => (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div style={{ fontSize: 16, color: '#666' }}>加载中...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#1a1a1a' }}>共享列表</h2>
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
              创建共享
            </button>
          </div>

          {shares.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              backgroundColor: '#f8f8f8',
              borderRadius: 8,
              fontSize: 14,
              color: '#666'
            }}>
              暂无共享
            </div>
          ) : (
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
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>路径</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#666' }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((share, index) => (
                    <tr
                      key={share.name}
                      style={{ borderBottom: index < shares.length - 1 ? '1px solid #f0f0f0' : undefined }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#1a1a1a' }}>{share.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{share.path}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: share.enabled ? '#e8f5e9' : '#ffebee',
                          color: share.enabled ? '#4caf50' : '#f44336',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 500
                        }}>
                          {share.enabled ? '已启用' : '已禁用'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderComingSoon = (title: string) => (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#1a1a1a' }}>{title}</h2>
      <div style={{
        backgroundColor: '#fff9c4',
        borderRadius: 8,
        padding: 16,
        fontSize: 14,
        color: '#f57f17'
      }}>
        此功能即将上线...
      </div>
    </div>
  )

  const tabs: TabItem[] = [
    {
      id: 'smb',
      label: 'SMB',
      content: renderSharesTable(smbShares)
    },
    {
      id: 'nfs',
      label: 'NFS',
      content: renderSharesTable(nfsShares)
    },
    {
      id: 'afp',
      label: 'AFP',
      content: renderComingSoon('AFP 共享')
    },
    {
      id: 'webdav',
      label: 'WebDAV',
      content: renderComingSoon('WebDAV 共享')
    },
    {
      id: 'iscsi',
      label: 'iSCSI',
      content: renderComingSoon('iSCSI 目标')
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>共享</h1>
      </div>
      <div style={{ flex: 1 }}>
        <TabsLayout items={tabs} defaultActiveId="smb" />
      </div>
    </div>
  )
}
