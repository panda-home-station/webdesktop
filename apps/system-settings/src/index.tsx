import React, { useState, useEffect } from 'react'
import { Sidebar } from '../../../src/components/Sidebar'
import axios from 'axios'

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
  // Load from local storage immediately for "zero delay"
  const [deviceInfo, setDeviceInfo] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('pnas_device_info')
      return cached ? JSON.parse(cached) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    const fetchInfo = () => {
      axios.get('/api/system/info').then(r => {
        const data = r.data
        setDeviceInfo(data)
        try { localStorage.setItem('pnas_device_info', JSON.stringify(data)) } catch {}
      }).catch(console.error)
    }
    
    fetchInfo()
    // Poll every 5 seconds for hardware stats (CPU temp, etc)
    // We don't need fast polling for time anymore as it's handled locally
    const interval = setInterval(fetchInfo, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, sans-serif', color: '#1f2937' }} className="noselect">
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
          <TabContent id={activeTab} deviceInfo={deviceInfo} />
        </div>
      </div>
    </div>
  )
}

function TabContent({ id, deviceInfo }: { id: string; deviceInfo: any }) {
  switch (id) {
    case 'device': return <DeviceInfo info={deviceInfo} />
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

function DeviceInfo({ info }: { info: any }) {
  const [cloudAccount, setCloudAccount] = useState<{ email: string; type: string } | null>(null)
  const [cloudConnect, setCloudConnect] = useState<{ id: string; server: string } | null>(null)
  const [displayTime, setDisplayTime] = useState('')

  useEffect(() => {
    if (!info) return
    
    // Use backend timestamp if available, fallback to current time
    let ts = info.system_time_ts ? info.system_time_ts * 1000 : Date.now()
    
    const format = (ms: number) => {
      const d = new Date(ms)
      const pad = (n: number) => n < 10 ? '0' + n : n
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

    setDisplayTime(format(ts))

    const timer = setInterval(() => {
      ts += 1000
      setDisplayTime(format(ts))
    }, 1000)

    return () => clearInterval(timer)
  }, [info]) // Resync when backend info updates

  if (!info) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ 
            background: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: 12, 
            height: 120,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }} />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `}</style>
      </div>
    )
  }

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
            <div style={{ fontSize: 13, color: '#374151' }}>{displayTime || info.system_time}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#6b7280' }}>本次运行时间</div>
            <div style={{ fontSize: 13, color: '#374151' }}>{info.uptime}</div>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Panda 账号">
        {cloudAccount ? (
          <div style={{ fontSize: 14, color: '#374151', fontWeight: 500, height: 21.33, display: 'flex', alignItems: 'center' }}>{cloudAccount.email}</div>
        ) : (
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => {}}
              disabled
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'not-allowed',
                fontSize: 12,
                fontWeight: 500,
                height: 21.33,
                display: 'flex',
                alignItems: 'center',
                opacity: 0.5,
              }}
            >
              点击登录
            </button>
          </div>
        )}
      </InfoCard>

      <InfoCard title="Panda Connect">
        {cloudConnect ? (
          <div style={{ fontSize: 14, fontWeight: 500, height: 21.33, display: 'flex', alignItems: 'center' }}>
            <a
              href={`https://${cloudConnect.id}.lingxi-agent.com`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb', textDecoration: 'none' }}
            >
              {`https://${cloudConnect.id}.lingxi-agent.com`}
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => {}}
              disabled
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'not-allowed',
                fontSize: 12,
                fontWeight: 500,
                height: 21.33,
                display: 'flex',
                alignItems: 'center',
                opacity: 0.5,
              }}
            >
              点击绑定
            </button>
          </div>
        )}
      </InfoCard>

      <InfoCard title="系统盘信息">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>{info.system_disk.percent}%</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>已使用</span>
        </div>
        <div style={{ fontSize: 13, color: '#374151' }}>
          容量 {info.system_disk.total} / 已用 {info.system_disk.used}
        </div>
      </InfoCard>

      <InfoCard title="数据盘信息">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>{info.data_disk.percent}%</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>已使用</span>
        </div>
        <div style={{ fontSize: 13, color: '#374151' }}>
          容量 {info.data_disk.total} / 已用 {info.data_disk.used}
        </div>
      </InfoCard>

      <InfoCard title="硬件信息">
        <CardRow label="CPU" value={info.hardware.cpu} />
        <CardRow label="内存" value={info.hardware.memory} />
        <CardRow label="温度" value={info.hardware.temperature} />
      </InfoCard>

      <InfoCard title="网络信息">
        <CardRow label="IP 地址" value={info.network.ip} />
        <CardRow label="连接速度" value={info.network.speed} />
        <CardRow label="上传/下载" value={info.network.transfer} />
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
