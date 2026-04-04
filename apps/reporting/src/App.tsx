import React from 'react'
import { TabsLayout, TabItem } from '../../../src/apps/layouts/TabsLayout'

export default function Reporting() {
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
      id: 'cpu',
      label: 'CPU',
      content: renderComingSoon('CPU 报告')
    },
    {
      id: 'memory',
      label: '内存',
      content: renderComingSoon('内存报告')
    },
    {
      id: 'disk',
      label: '磁盘',
      content: renderComingSoon('磁盘报告')
    },
    {
      id: 'network',
      label: '网络',
      content: renderComingSoon('网络报告')
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>报告</h1>
      </div>
      <div style={{ flex: 1 }}>
        <TabsLayout items={tabs} defaultActiveId="cpu" />
      </div>
    </div>
  )
}
