import { SidebarLayout, SidebarItem } from '@desktop/layouts/SidebarLayout'

export default function System() {
  const renderComingSoon = (title: string, description?: string) => (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#1a1a1a' }}>{title}</h2>
      {description && <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666' }}>{description}</p>}
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
      id: 'general',
      label: '通用',
      icon: <span>⚙️</span>,
      content: renderComingSoon('通用设置', '配置系统全局设置')
    },
    {
      id: 'network',
      label: '网络',
      icon: <span>🌐</span>,
      content: renderComingSoon('网络设置', '配置网络接口和路由')
    },
    {
      id: 'update',
      label: '更新',
      icon: <span>🔄</span>,
      content: renderComingSoon('系统更新', '检查和安装系统更新')
    },
    {
      id: 'advanced',
      label: '高级',
      icon: <span>🔧</span>,
      content: renderComingSoon('高级设置', '配置高级系统选项')
    },
    {
      id: 'system-info',
      label: '系统信息',
      icon: <span>ℹ️</span>,
      content: renderComingSoon('系统信息', '查看系统硬件和软件信息')
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>系统</h1>
      </div>
      <div style={{ flex: 1 }}>
        <SidebarLayout items={sidebarItems} defaultActiveId="general" />
      </div>
    </div>
  )
}
