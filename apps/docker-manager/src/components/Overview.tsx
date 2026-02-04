import React from 'react'
import { Container, Image, Volume, Network } from '../types'

const iOSCard = {
  background: '#fff',
  borderRadius: 16,
  padding: 16,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
  height: 100
}

const iOSLabel = {
  fontSize: 13,
  fontWeight: 500,
  color: '#8e8e93',
  marginBottom: 4
}

const iOSValue = {
  fontSize: 34,
  fontWeight: 700,
  color: '#000',
  letterSpacing: -0.5
}

interface OverviewProps {
  containers: Container[]
  images: Image[]
  volumes: Volume[]
  networks: Network[]
  loading: boolean
}

export function Overview({ containers, images, volumes, networks, loading }: OverviewProps) {
  const running = containers.filter(c => c.state === 'running').length
  
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>概览</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <div style={iOSCard}>
          <div style={iOSLabel}>运行中容器</div>
          <div style={{...iOSValue, color: '#34c759'}}>{running}</div>
        </div>
        
        <div style={iOSCard}>
          <div style={iOSLabel}>容器总数</div>
          <div style={iOSValue}>{containers.length}</div>
        </div>
        
        <div style={iOSCard}>
          <div style={iOSLabel}>本地镜像</div>
          <div style={iOSValue}>{images.length}</div>
        </div>

        <div style={iOSCard}>
          <div style={iOSLabel}>存储卷</div>
          <div style={iOSValue}>{volumes.length}</div>
        </div>

        <div style={iOSCard}>
          <div style={iOSLabel}>网络</div>
          <div style={iOSValue}>{networks.length}</div>
        </div>
      </div>
      
      {loading && <div style={{ marginTop: 20, color: '#8e8e93', fontSize: 13 }}>正在刷新数据...</div>}
    </div>
  )
}
