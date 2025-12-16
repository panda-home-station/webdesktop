import React, { useState, useEffect } from 'react'
import { Sidebar } from '../../../src/components/Sidebar'
import { api } from '../../../src/api/client'

const TABS = [
  { id: 'device', label: '设备信息', icon: '💻' },
  { id: 'users', label: '用户管理', icon: '👥' },
  { id: 'storage', label: '存储空间管理', icon: '💾' },
  { id: 'disk', label: '硬盘信息', icon: '💿' },
  { id: 'network', label: '网络设置', icon: '🌐' },
  { id: 'remote', label: '远程访问', icon: '🖥️' },
]

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('device')

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, sans-serif', color: '#1f2937' }}>
      {/* Sidebar */}
      <Sidebar
        width={240}
        items={TABS}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
        <div style={{ padding: '24px 32px', maxWidth: 800 }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: 24, fontWeight: 600 }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <TabContent id={activeTab} />
        </div>
      </div>
    </div>
  )
}

function TabContent({ id }: { id: string }) {
  switch (id) {
    case 'device': return <DeviceInfo />
    case 'users': return <UserManagement />
    case 'storage': return <StorageManagement />
    case 'disk': return <DiskInfo />
    case 'network': return <NetworkSettings />
    case 'remote': return <RemoteAccess />
    default: return null
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#4b5563', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, border = true }: { label: string; value: React.ReactNode; border?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: border ? '1px solid #e5e7eb' : 'none' }}>
      <div style={{ color: '#374151', fontWeight: 500 }}>{label}</div>
      <div style={{ color: '#6b7280' }}>{value}</div>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 'bold', color: '#6b7280' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  )
}

function CardRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: '#374151', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function DeviceInfo() {
  const [info, setInfo] = useState<{
    device_name: string
    device_id: string
    system_version: string
    system_time: string
    uptime: string
  } | null>(null)

  useEffect(() => {
    api.getDeviceInfo().then(setInfo).catch(console.error)
  }, [])

  if (!info) return <div style={{ padding: 20 }}>加载中...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
      <InfoCard title="设备名称">
        <div style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '4px 0 12px 0' }}>
          {info.device_name}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280' }}>设备 ID</div>
          <div style={{ fontSize: 13, color: '#374151', fontFamily: 'monospace', wordBreak: 'break-all' }}>{info.device_id}</div>
        </div>
      </InfoCard>

      <InfoCard title="系统版本">
        <div style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '4px 0 12px 0' }}>
          {info.system_version}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280' }}>系统时间</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{info.system_time}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280' }}>本次运行时间</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{info.uptime}</div>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Panda 账号">
        <CardRow label="账号" value="zac@panda.com" />
        <CardRow label="状态" value={<span style={{ color: '#10b981' }}>已登录</span>} />
        <CardRow label="类型" value="Pro 用户" />
      </InfoCard>

      <InfoCard title="Panda Connect">
        <CardRow label="远程连接" value={<span style={{ color: '#10b981' }}>已启用</span>} />
        <CardRow label="Panda ID" value="pnas-8848-007" />
        <CardRow label="中继服务器" value="cn-sh-01" />
      </InfoCard>

      <InfoCard title="系统盘信息">
        <CardRow label="容量" value="256 GB NVMe SSD" />
        <CardRow label="已用" value="45.2 GB (17%)" />
        <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ width: '17%', height: '100%', background: '#3b82f6' }} />
        </div>
      </InfoCard>

      <InfoCard title="数据盘信息">
        <CardRow label="容量" value="4 TB RAID 1" />
        <CardRow label="已用" value="1.2 TB (30%)" />
        <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ width: '30%', height: '100%', background: '#10b981' }} />
        </div>
      </InfoCard>

      <InfoCard title="硬件信息">
        <CardRow label="CPU" value="i7-12700H (14核)" />
        <CardRow label="内存" value="32 GB DDR4 3200" />
        <CardRow label="温度" value="CPU 45°C / 硬盘 38°C" />
      </InfoCard>

      <InfoCard title="网络信息">
        <CardRow label="IP 地址" value="192.168.1.100" />
        <CardRow label="连接速度" value="1000 Mbps" />
        <CardRow label="上传/下载" value="↑ 1.2MB/s  ↓ 4.5MB/s" />
      </InfoCard>
    </div>
  )
}

function UserManagement() {
  const [users] = useState([
    { id: 1, name: 'admin', role: '管理员', status: '活跃' },
    { id: 2, name: 'guest', role: '访客', status: '禁用' },
  ])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
          添加用户
        </button>
      </div>
      <Section title="用户列表">
        {users.map((u, i) => (
          <Row
            key={u.id}
            label={u.name}
            value={
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ padding: '2px 8px', background: '#e5e7eb', borderRadius: 99, fontSize: 12 }}>{u.role}</span>
                <span style={{ color: u.status === '活跃' ? '#10b981' : '#ef4444' }}>{u.status}</span>
              </div>
            }
            border={i !== users.length - 1}
          />
        ))}
      </Section>
    </div>
  )
}

function StorageManagement() {
  return (
    <div>
      <Section title="存储概览">
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>已用 1.2 TB</span>
            <span>共 4.0 TB</span>
          </div>
          <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: '30%', height: '100%', background: '#3b82f6' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 13, color: '#6b7280' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> 文档 (40%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> 图片 (20%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> 视频 (15%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e7eb' }} /> 空闲 (25%)</div>
          </div>
        </div>
      </Section>
    </div>
  )
}

function DiskInfo() {
  return (
    <div>
      <Section title="物理硬盘">
        <Row label="Disk 1 (NVMe)" value="Samsung 980 PRO 1TB - 正常" />
        <Row label="Disk 2 (SATA)" value="WD Red Plus 4TB - 正常" />
        <Row label="Disk 3 (SATA)" value="WD Red Plus 4TB - 正常" border={false} />
      </Section>
      <Section title="RAID 状态">
        <Row label="RAID 模式" value="RAID 1" />
        <Row label="状态" value={<span style={{ color: '#10b981' }}>健康</span>} border={false} />
      </Section>
    </div>
  )
}

function NetworkSettings() {
  return (
    <div>
      <Section title="网络接口">
        <Row label="接口名称" value="eth0" />
        <Row label="MAC 地址" value="00:11:22:33:44:55" />
        <Row label="连接状态" value={<span style={{ color: '#10b981' }}>已连接 (1000 Mbps)</span>} border={false} />
      </Section>
      <Section title="IP 设置">
        <Row label="IPv4 地址" value="192.168.1.100" />
        <Row label="子网掩码" value="255.255.255.0" />
        <Row label="网关" value="192.168.1.1" />
        <Row label="DNS 服务器" value="8.8.8.8, 1.1.1.1" border={false} />
      </Section>
    </div>
  )
}

function RemoteAccess() {
  const [sshEnabled, setSshEnabled] = useState(true)
  const [vncEnabled, setVncEnabled] = useState(false)

  return (
    <div>
      <Section title="服务状态">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, color: '#374151' }}>SSH 服务</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>允许通过 SSH 终端访问</div>
          </div>
          <Switch checked={sshEnabled} onChange={setSshEnabled} />
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, color: '#374151' }}>VNC 远程桌面</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>允许通过 VNC 客户端访问桌面</div>
          </div>
          <Switch checked={vncEnabled} onChange={setVncEnabled} />
        </div>
      </Section>
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        background: checked ? '#2563eb' : '#e5e7eb',
        borderRadius: 12,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  )
}
