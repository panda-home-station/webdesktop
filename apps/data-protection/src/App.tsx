import React, { useEffect, useState } from 'react'
import { TabsLayout, TabItem } from '../../../src/apps/layouts/TabsLayout'

export default function DataProtection() {
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
      id: 'snapshots',
      label: '快照',
      content: renderComingSoon('快照任务', '配置和管理周期性快照任务')
    },
    {
      id: 'replication',
      label: '复制',
      content: renderComingSoon('复制任务', '配置存储池复制和远程复制')
    },
    {
      id: 'cloud-sync',
      label: '云同步',
      content: renderComingSoon('云同步', '配置与云存储服务的同步任务')
    },
    {
      id: 'backup',
      label: '备份',
      content: renderComingSoon('备份恢复', '管理备份任务和恢复操作')
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>数据保护</h1>
      </div>
      <div style={{ flex: 1 }}>
        <TabsLayout items={tabs} defaultActiveId="snapshots" />
      </div>
    </div>
  )
}
