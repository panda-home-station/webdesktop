import React, { useState, useEffect, useContext } from 'react'
import { Sidebar } from '@src/components/Sidebar'
import { WindowContext } from '@src/sdk/window'
import { getWallpaper, setWallpaper } from '@src/state/desktop'

// Mock API for now - will be replaced with TrueNAS API
const api = {
  fsMkdir: async (path: string) => { },
  fsList: async (path: string) => ({ entries: [] }),
  fsUpload: async (path: string, file: File) => { },
  fsDownloadUrl: (path: string) => '',
  getSecuritySettings: async () => ({ idle_timeout: 0, idle_action: 'lock' }),
  setSecuritySettings: async (settings: any) => { },
}
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
  Cpu,
  Copy,
  Thermometer,
  Microchip,
  MemoryStick,
  Lock,
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
  const win = useContext(WindowContext)
  const [activeTab, setActiveTab] = useState('device')

  useEffect(() => {
    if (win && win.setTitle) {
      const tabName = TABS.find(t => t.id === activeTab)?.label || '设置'
      win.setTitle(`Settings - ${tabName}`)
    }
  }, [activeTab, win])

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
      api.getDeviceInfo().then(data => {
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!info) return
    let ts = info.system_time_ts ? info.system_time_ts * 1000 : Date.now()
    const format = (ms: number) => {
      const d = new Date(ms)
      const pad = (n: number) => n < 10 ? '0' + n : n
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }
    setDisplayTime(format(ts))
    const timer = setInterval(() => {
      ts += 1000
      setDisplayTime(format(ts))
    }, 1000)
    return () => clearInterval(timer)
  }, [info])

  const copyId = () => {
    if (info?.device_id) {
      navigator.clipboard.writeText(info.device_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!info) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
         <div style={{ height: 100, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
         <div style={{ height: 200, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
         <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 20 }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
          borderRadius: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)'
        }}>
          <Server size={32} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>{info.device_name}</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
             <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
               <Cpu size={14} /> {info.hardware.cpu.split(' ')[0]}
             </span>
             <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
               <MemoryStick size={14} /> {info.hardware.memory.split(' ')[0]} {info.hardware.memory.split(' ')[1]}
             </span>
          </div>
        </div>
      </div>

      <SpecGroup title="硬件规格">
        <SpecRow label="处理器" value={info.hardware.cpu} />
        <SpecRow label="显卡" value={info.hardware.gpu || 'N/A'} />
        <SpecRow label="内存" value={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>
              {info.hardware.memory}
              {info.hardware.memory_slots && info.hardware.memory_slots.length > 0 && (
                <span style={{ color: '#6b7280', marginLeft: 8 }}>
                  - {info.hardware.memory_slots.map((s: any) => `${s.size} ${s.memory_type}`).join(' | ')}
                </span>
              )}
            </div>
          </div>
        } />
        <SpecRow label="硬盘" value={
          info.phy_disks && info.phy_disks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
              {info.phy_disks.map((disk: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', fontSize: 13, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>{disk.name}</span>
                  <span style={{ margin: '0 6px', color: '#9ca3af' }}>-</span>
                  <span style={{ color: '#6b7280' }}>
                    {disk.is_rotational ? 'HDD' : 'SSD'} 
                    <span style={{ margin: '0 4px', color: '#e5e7eb' }}>|</span> 
                    {disk.size} 
                  </span>
                </div>
              ))}
            </div>
          ) : '未检测到磁盘'
        } />
        <SpecRow label="设备 ID" value={info.device_id} action={
          <button 
            onClick={copyId}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              color: copied ? '#059669' : '#6b7280', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              padding: '4px 8px',
              borderRadius: 4,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => !copied && (e.currentTarget.style.color = '#374151')}
            onMouseLeave={e => !copied && (e.currentTarget.style.color = '#6b7280')}
          >
            {copied ? '已复制' : '复制'}
            {!copied && <Copy size={14} />}
          </button>
        } />
      </SpecGroup>

      <SpecGroup title="系统规格">
        <SpecRow label="版本" value="PandaNAS OS" />
        <SpecRow label="系统版本号" value={info.system_version} />
        <SpecRow label="本次运行时间" value={info.uptime} />
        <SpecRow label="系统时间" value={displayTime || info.system_time} />
      </SpecGroup>

      <SpecGroup title="网络连接">
        <SpecRow label="IP 地址" value={info.network.ip} />
        <SpecRow label="连接状态" value={
          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
            ● 已连接
          </span>
        } />
        <SpecRow label="传输数据" value={
          <div style={{ display: 'flex', gap: 16 }}>
             <span>{info.network.transfer.split(' ')[0]} {info.network.transfer.split(' ')[1]}</span>
             <span style={{ color: '#e5e7eb' }}>|</span>
             <span>{info.network.transfer.split(' ')[2]} {info.network.transfer.split(' ')[3]}</span>
          </div>
        } />
      </SpecGroup>

      <SpecGroup title="存储空间">
        <DiskRow name="系统盘 (System)" data={info.system_disk} />
        <DiskRow name="数据盘 (Data)" data={info.data_disk} isLast />
      </SpecGroup>
    </div>
  )
}

function SpecGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12, paddingLeft: 2 }}>{title}</h3>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        {children}
      </div>
    </div>
  )
}

function SpecRow({ label, value, action }: { label: string, value: React.ReactNode, action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f3f4f6', minHeight: 24 }}>
      <div style={{ width: 140, fontSize: 13, color: '#6b7280', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#111827', fontWeight: 500, flex: 1, userSelect: 'text', lineHeight: 1.5 }}>{value}</div>
      {action && <div style={{ marginLeft: 12 }}>{action}</div>}
    </div>
  )
}

function DiskRow({ name, data, isLast }: { name: string, data: any, isLast?: boolean }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{name}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {data.used.split(' ')[0]} / {data.total}
        </div>
      </div>
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ 
          width: `${data.percent}%`, 
          height: '100%', 
          background: data.percent > 90 ? '#ef4444' : '#3b82f6',
          borderRadius: 4,
          transition: 'width 0.5s ease-out'
        }} />
      </div>
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

