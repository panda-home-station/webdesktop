import React, { useState, useEffect } from 'react'
import { Sidebar } from '../../../src/components/Sidebar'
import axios from 'axios'
import { 
  Monitor, 
  Users, 
  HardDrive, 
  Network, 
  Globe, 
  Server,
  Info,
  ChevronRight,
  Wifi,
  Activity,
  Cpu
} from 'lucide-react'

const TABS = [
  { id: 'device', label: '关于本机', icon: <Info size={20} /> },
  { id: 'users', label: '用户与账户', icon: <Users size={20} /> },
  { id: 'storage', label: '存储空间', icon: <Server size={20} /> },
  { id: 'disk', label: '硬盘管理', icon: <HardDrive size={20} /> },
  { id: 'network', label: '网络', icon: <Network size={20} /> },
  { id: 'remote', label: '远程访问', icon: <Globe size={20} /> },
]

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('device')
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
    const interval = setInterval(fetchInfo, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#1c1c1e', background: '#f2f2f7' }} className="noselect">
      {/* Sidebar */}
      <Sidebar
        items={TABS}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '32px 40px', maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
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

// iPad Style Components

function Section({ title, children, footer }: { title?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {title && (
        <h3 style={{ 
          fontSize: 13, 
          fontWeight: 400, 
          color: '#6c6c70', 
          marginBottom: 8, 
          paddingLeft: 16,
          textTransform: 'uppercase'
        }}>
          {title}
        </h3>
      )}
      <div style={{ 
        background: '#fff', 
        borderRadius: 10, 
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)' 
      }}>
        {children}
      </div>
      {footer && (
        <div style={{ 
          fontSize: 13, 
          color: '#6c6c70', 
          marginTop: 8, 
          paddingLeft: 16,
          lineHeight: 1.4
        }}>
          {footer}
        </div>
      )}
    </div>
  )
}

function Row({ 
  label, 
  value, 
  icon, 
  border = true, 
  onClick,
  destructive = false
}: { 
  label: string; 
  value?: React.ReactNode; 
  icon?: React.ReactNode;
  border?: boolean; 
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        paddingLeft: 16,
        background: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 48
      }}
    >
      {icon && <div style={{ marginRight: 12, color: '#007aff' }}>{icon}</div>}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottom: border ? '1px solid #e5e5ea' : 'none',
        height: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          fontSize: 17, 
          color: destructive ? '#ff3b30' : '#000',
          fontWeight: 400
        }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 17, color: '#8e8e93' }}>{value}</div>
          {onClick && <ChevronRight size={16} color="#c7c7cc" />}
        </div>
      </div>
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      style={{
        width: 51,
        height: 31,
        background: checked ? '#34c759' : '#e9e9ea',
        borderRadius: 31,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease',
        boxSizing: 'border-box',
        border: checked ? 'none' : '2px solid #e9e9ea' // Fix border look
      }}
    >
      <div
        style={{
          width: 27,
          height: 27,
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  )
}

// Tab Implementations

function DeviceInfo({ info }: { info: any }) {
  const [displayTime, setDisplayTime] = useState('')

  useEffect(() => {
    if (!info) return
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
  }, [info])

  if (!info) return <div>加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          background: '#e5e5ea', 
          borderRadius: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 16,
          color: '#8e8e93'
        }}>
          <Monitor size={48} />
        </div>
        <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{info.device_name}</h3>
        <p style={{ margin: '4px 0 0 0', color: '#8e8e93', fontSize: 15 }}>{info.device_id}</p>
      </div>

      <Section title="概览">
        <Row label="系统版本" value={info.system_version} />
        <Row label="运行时间" value={info.uptime} />
        <Row label="系统时间" value={displayTime || info.system_time} border={false} />
      </Section>

      <Section title="硬件">
        <Row label="处理器" value={info.hardware.cpu} />
        <Row label="内存" value={info.hardware.memory} />
        <Row label="温度" value={info.hardware.temperature} border={false} />
      </Section>
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
      <Section title="当前用户">
        <Row 
          label="admin" 
          value="已登录" 
          icon={<div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8e8e93', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>}
          onClick={() => {}}
          border={false}
        />
      </Section>

      <Section title="所有用户" footer="管理员可以添加或移除用户，并管理其访问权限。">
        {users.map((u, i) => (
          <Row
            key={u.id}
            label={u.name}
            value={u.role}
            onClick={() => {}}
            border={i !== users.length - 1}
          />
        ))}
        <Row 
          label="添加用户..." 
          onClick={() => {}} 
          border={false}
          value={<span style={{ color: '#007aff' }}>+</span>}
        />
      </Section>
    </div>
  )
}

function StorageManagement() {
  return (
    <div>
      <Section title="存储概览">
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>已用 1.2 TB</span>
            <span style={{ fontSize: 15, color: '#8e8e93' }}>共 4.0 TB</span>
          </div>
          <div style={{ height: 16, background: '#e5e5ea', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: '30%', height: '100%', background: '#007aff' }} />
            <div style={{ width: '20%', height: '100%', background: '#34c759' }} />
            <div style={{ width: '15%', height: '100%', background: '#ff9500' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: 13, color: '#6c6c70', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#007aff' }} /> 文档 (30%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34c759' }} /> 图片 (20%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9500' }} /> 视频 (15%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e5ea' }} /> 空闲 (35%)</div>
          </div>
        </div>
      </Section>
      
      <Section title="建议">
        <Row label="清理重复文件" onClick={() => {}} />
        <Row label="优化存储空间" onClick={() => {}} border={false} />
      </Section>
    </div>
  )
}

function DiskInfo() {
  return (
    <div>
      <Section title="物理硬盘">
        <Row label="Disk 1 (NVMe)" value="Samsung 980 PRO 1TB" onClick={() => {}} />
        <Row label="Disk 2 (SATA)" value="WD Red Plus 4TB" onClick={() => {}} />
        <Row label="Disk 3 (SATA)" value="WD Red Plus 4TB" onClick={() => {}} border={false} />
      </Section>
      <Section title="RAID 阵列">
        <Row label="RAID 模式" value="RAID 1 (镜像)" />
        <Row label="状态" value={<span style={{ color: '#34c759' }}>健康</span>} border={false} />
      </Section>
    </div>
  )
}

function NetworkSettings() {
  return (
    <div>
      <Section title="以太网">
        <Row label="接口" value="eth0" />
        <Row label="状态" value={<span style={{ color: '#34c759' }}>已连接</span>} />
        <Row label="IP 地址" value="192.168.1.100" />
        <Row label="MAC 地址" value="00:11:22:33:44:55" border={false} />
      </Section>
      
      <Section title="DNS">
        <Row label="DNS 服务器" value="自动 (8.8.8.8)" onClick={() => {}} border={false} />
      </Section>
    </div>
  )
}

function RemoteAccess() {
  const [sshEnabled, setSshEnabled] = useState(true)
  const [vncEnabled, setVncEnabled] = useState(false)

  return (
    <div>
      <Section title="终端服务" footer="允许通过 SSH 协议访问系统终端。请确保使用强密码。">
        <Row 
          label="SSH" 
          value={<Switch checked={sshEnabled} onChange={setSshEnabled} />} 
          border={false}
        />
      </Section>

      <Section title="桌面共享" footer="允许通过 VNC 客户端查看和控制系统桌面。">
        <Row 
          label="VNC 远程桌面" 
          value={<Switch checked={vncEnabled} onChange={setVncEnabled} />} 
          border={false}
        />
      </Section>
    </div>
  )
}
