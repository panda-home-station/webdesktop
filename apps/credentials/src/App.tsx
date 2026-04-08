import { useEffect, useState } from 'react'
import { SidebarLayout, SidebarItem } from '@desktop/layouts/SidebarLayout'

interface User {
  uid: number
  username: string
  full_name: string
  home: string
  shell: string
  email?: string
  locked: boolean
}

interface Group {
  gid: number
  group: string
}

export default function Credentials() {
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { uid: 0, username: 'root', full_name: 'Administrator', home: '/root', shell: '/bin/sh', locked: false },
        { uid: 1000, username: 'admin', full_name: 'Admin User', home: '/home/admin', shell: '/bin/zsh', email: 'admin@example.com', locked: false },
        { uid: 1001, username: 'guest', full_name: 'Guest User', home: '/nonexistent', shell: '/usr/sbin/nologin', locked: true }
      ])
      setGroups([
        { gid: 0, group: 'wheel' },
        { gid: 1000, group: 'admin' },
        { gid: 1001, group: 'users' }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const renderUsers = () => (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div style={{ fontSize: 16, color: '#666' }}>加载中...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#1a1a1a' }}>用户列表</h2>
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
              创建用户
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
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>用户名</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>全名</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>UID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>主目录</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>Shell</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#666' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.uid}
                    style={{ borderBottom: index < users.length - 1 ? '1px solid #f0f0f0' : undefined }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#1a1a1a', fontWeight: 500 }}>
                      {user.username}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#1a1a1a' }}>{user.full_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#666' }}>{user.uid}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{user.home}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#666' }}>{user.shell}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: user.locked ? '#ffebee' : '#e8f5e9',
                        color: user.locked ? '#f44336' : '#4caf50',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        {user.locked ? '已锁定' : '正常'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderGroups = () => (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <div style={{ fontSize: 16, color: '#666' }}>加载中...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#1a1a1a' }}>用户组列表</h2>
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
              创建用户组
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
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>组名</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#666' }}>GID</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, index) => (
                  <tr
                    key={group.gid}
                    style={{ borderBottom: index < groups.length - 1 ? '1px solid #f0f0f0' : undefined }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#1a1a1a', fontWeight: 500 }}>
                      {group.group}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#666' }}>{group.gid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderComingSoon = (title: string) => (
    <div style={{ padding: 20 }}>
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

  const sidebarItems: SidebarItem[] = [
    {
      id: 'users',
      label: '用户',
      icon: <span>👤</span>,
      content: renderUsers()
    },
    {
      id: 'groups',
      label: '用户组',
      icon: <span>👥</span>,
      content: renderGroups()
    },
    {
      id: 'ssh-keys',
      label: 'SSH 密钥',
      icon: <span>🔑</span>,
      content: renderComingSoon('SSH 密钥管理')
    },
    {
      id: 'certificates',
      label: '证书',
      icon: <span>📜</span>,
      content: renderComingSoon('证书管理')
    },
    {
      id: 'directory-services',
      label: '目录服务',
      icon: <span>🌐</span>,
      content: renderComingSoon('目录服务 (AD/LD)')
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>用户凭据</h1>
      </div>
      <div style={{ flex: 1 }}>
        <SidebarLayout items={sidebarItems} defaultActiveId="users" />
      </div>
    </div>
  )
}
