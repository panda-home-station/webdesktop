import React from 'react'
import { TabsLayout, TabItem } from '../../../src/apps/layouts/TabsLayout'

export default function VirtualMachines() {
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

  const tabs: TabItem[] = [
    {
      id: 'vms',
      label: '虚拟机',
      content: renderComingSoon('虚拟机管理', '创建和管理虚拟机')
    },
    {
      id: 'containers',
      label: '容器',
      content: renderComingSoon('容器管理', '管理 Docker 和 Kubernetes 容器')
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>虚拟机</h1>
      </div>
      <div style={{ flex: 1 }}>
        <TabsLayout items={tabs} defaultActiveId="vms" />
      </div>
    </div>
  )
}
