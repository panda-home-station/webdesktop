import React, { useState, useEffect, useContext, useRef } from 'react'
import { Sidebar } from '@desktop/components/Sidebar'
import { WindowContext } from '@shared/sdk/window'
import {
  Users,
  HardDrive,
  Network,
  Globe,
  Server,
  Info,
  ChevronRight,
  Cpu,
  Copy,
  MemoryStick,
} from 'lucide-react'
import { systemService } from '@truenas/services/system'
import { truenasApi } from '@truenas/api'
import type {
  SystemInfo,
  ReportingRealtimeUpdate,
} from '@shared/types/system-types'

// Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// Format Unix timestamp to datetime string
function formatDatetime(timestamp: number): string {
  const d = new Date(timestamp * 1000)
  if (isNaN(d.getTime())) return 'N/A'
  const pad = (n: number) => n < 10 ? '0' + n : n
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// Calculate CPU usage percentage from AllCpusUpdate
function getCpuUsage(realtime: ReportingRealtimeUpdate | null): string {
  if (!realtime?.cpu?.cpu) return '0%'
  const usage = realtime.cpu.cpu.usage
  return `${usage.toFixed(1)}%`
}

// Network interface alias from interface.query
interface NetworkInterfaceAlias {
  address: string;
  type?: string;
  netmask?: number;
}

// Network interface from interface.query
interface NetworkInterfaceFromApi {
  name: string;
  state: {
    link_state: string;
    flags: string[];
    aliases: NetworkInterfaceAlias[];
  };
}

// Get network info
function getNetworkInfo(
  networkInterfaces: NetworkInterfaceFromApi[]
): { ip: string; status: string } {
  if (!networkInterfaces || networkInterfaces.length === 0) {
    return { ip: 'Loading...', status: 'Loading...' }
  }

  // Find primary interface (up and has IP)
  const primaryIface = networkInterfaces.find(
    (iface) => iface.state?.link_state === 'LINK_STATE_UP' || iface.state?.flags?.includes('UP')
  ) || networkInterfaces[0]

  if (!primaryIface) {
    return { ip: 'N/A', status: 'Disconnected' }
  }

  // Get IP address from state.aliases
  const aliases = primaryIface.state?.aliases || []
  const ip = aliases.find(
    (alias) => alias.address?.startsWith('192.168.') || alias.address?.startsWith('10.') || alias.address?.startsWith('172.')
  )?.address || aliases[0]?.address || 'N/A'

  return {
    ip,
    status: primaryIface.state?.link_state === 'LINK_STATE_UP' ? 'Connected' : 'Disconnected',
  }
}

// Get storage pools info
function getPoolsInfo(pools: Record<string, { available: number; used: number; total: number }> | null): { used: string; total: string; percent: string }[] {
  if (!pools) return []
  return Object.entries(pools).map(([name, data]) => ({
    name,
    used: formatBytes(data.used),
    total: formatBytes(data.total),
    percent: data.total > 0 ? ((data.used / data.total) * 100).toFixed(0) : '0',
  }))
}

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
  const lastTitleRef = useRef<string>('')

  // Static system info (fetched once)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterfaceFromApi[]>([])

  // Realtime data (continuously updated)
  const [realtime, setRealtime] = useState<ReportingRealtimeUpdate | null>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (win && win.setTitle) {
      if (lastTitleRef.current !== 'Settings') {
        lastTitleRef.current = 'Settings'
        win.setTitle('Settings')
      }
    }
  }, [win])

  // Fetch static data on mount
  useEffect(() => {
    let cancelled = false

    async function fetchStaticData() {
      try {
        const [sysInfo, ifaces] = await Promise.all([
          systemService.getSystemInfo(),
          systemService.getNetworkInterfaces(),
        ])

        if (cancelled) return

        setSystemInfo(sysInfo)
        setNetworkInterfaces(ifaces as NetworkInterfaceFromApi[])
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch system info:', err)
        setError('Failed to load system information')
        setLoading(false)
      }
    }

    fetchStaticData()
    return () => { cancelled = true }
  }, [])

  // Subscribe to realtime updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    try {
      unsubscribe = systemService.subscribeRealtime((data) => {
        setRealtime(data)
      })
    } catch (err) {
      console.error('Failed to subscribe to realtime updates:', err)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#1c1c1e', background: '#f2f2f7' }} className="noselect">
      <Sidebar items={TABS} activeId={activeTab} onSelect={setActiveTab} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '32px 40px', maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <TabContent
            id={activeTab}
            systemInfo={systemInfo}
            realtime={realtime}
            networkInterfaces={networkInterfaces}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}

function TabContent({
  id,
  systemInfo,
  realtime,
  networkInterfaces,
  loading,
  error,
}: {
  id: string
  systemInfo: SystemInfo | null
  realtime: ReportingRealtimeUpdate | null
  networkInterfaces: NetworkInterfaceFromApi[]
  loading: boolean
  error: string | null
}) {
  switch (id) {
    case 'device':
      return <DeviceInfo systemInfo={systemInfo} realtime={realtime} networkInterfaces={networkInterfaces} loading={loading} error={error} />
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
        <div style={{ fontSize: 17, color: destructive ? '#ff3b30' : '#000', fontWeight: 400 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
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
        border: checked ? 'none' : '2px solid #e9e9ea'
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

function DeviceInfo({
  systemInfo,
  realtime,
  networkInterfaces,
  loading,
  error,
}: {
  systemInfo: SystemInfo | null
  realtime: ReportingRealtimeUpdate | null
  networkInterfaces: NetworkInterfaceFromApi[]
  loading: boolean
  error: string | null
}) {
  const [displayTime, setDisplayTime] = useState('')
  const [copied, setCopied] = useState(false)

  // Live clock from system time
  useEffect(() => {
    if (!systemInfo) return

    // Get timestamp from datetime field
    const datetimeValue = systemInfo.datetime
    let baseTs: number
    if (typeof datetimeValue === 'object' && datetimeValue !== null && '$date' in datetimeValue) {
      baseTs = datetimeValue.$date * 1000
    } else if (typeof datetimeValue === 'number') {
      baseTs = datetimeValue > 1e12 ? datetimeValue : datetimeValue * 1000
    } else {
      baseTs = Date.now()
    }

    const format = (ms: number) => {
      const d = new Date(ms)
      if (isNaN(d.getTime())) return 'N/A'
      const pad = (n: number) => n < 10 ? '0' + n : n
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

    setDisplayTime(format(baseTs))
    let ts = baseTs
    const timer = setInterval(() => {
      ts += 1000
      setDisplayTime(format(ts))
    }, 1000)
    return () => clearInterval(timer)
  }, [systemInfo])

  const copyId = () => {
    if (systemInfo?.system_serial) {
      navigator.clipboard.writeText(systemInfo.system_serial)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
        <div style={{ height: 100, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 200, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`}</style>
      </div>
    )
  }

  if (error || !systemInfo) {
    return (
      <div style={{ padding: 20, color: '#ef4444' }}>
        {error || 'Failed to load system information'}
      </div>
    )
  }

  // Calculate uptime
  const uptimeSeconds = systemInfo.uptime_seconds || 0
  const days = Math.floor(uptimeSeconds / 86400)
  const hours = Math.floor((uptimeSeconds % 86400) / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const uptime = days > 0
    ? `${days} days ${hours} hours ${minutes} minutes`
    : `${hours} hours ${minutes} minutes`

  // Get dynamic data
  const cpuUsage = getCpuUsage(realtime)
  const networkInfo = getNetworkInfo(networkInterfaces)
  const poolsInfo = getPoolsInfo(realtime?.pools || null)

  // Physical memory
  const physmemGb = (systemInfo.physmem / (1024 ** 3)).toFixed(1)

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 20, transform: 'translateZ(0)' }}>
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>{systemInfo.hostname || 'Panda Home Station'}</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, transform: 'translateZ(0)' }}>
              <Cpu size={14} /> {cpuUsage}
            </span>
            <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, transform: 'translateZ(0)' }}>
              <MemoryStick size={14} /> {physmemGb} GB
            </span>
          </div>
        </div>
      </div>

      <SpecGroup title="硬件规格">
        <SpecRow label="处理器" value={systemInfo.model || `${systemInfo.cores} cores`} />
        <SpecRow label="核心数" value={`${systemInfo.cores} (${systemInfo.physical_cores} physical)`} />
        <SpecRow label="内存" value={`${physmemGb} GB`} />
        <SpecRow label="ECC 内存" value={systemInfo.ecc_memory ? '是' : '否'} />
        <SpecRow label="系统产品" value={systemInfo.system_product || 'N/A'} />
        <SpecRow label="设备 ID" value={systemInfo.system_serial || 'N/A'} action={
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
        <SpecRow label="版本" value={systemInfo.version || 'N/A'} />
        <SpecRow label="平台" value={systemInfo.platform || 'N/A'} />
        <SpecRow label="本次运行时间" value={uptime} />
        <SpecRow label="系统时间" value={displayTime || 'N/A'} />
      </SpecGroup>

      <SpecGroup title="网络连接">
        <SpecRow label="IP 地址" value={networkInfo.ip} />
        <SpecRow label="连接状态" value={
          <span style={{ color: networkInfo.status === 'Connected' ? '#059669' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
            ● {networkInfo.status}
          </span>
        } />
      </SpecGroup>

      <SpecGroup title="存储空间">
        {poolsInfo.length > 0 ? (
          poolsInfo.map((pool, index) => (
            <DiskRow
              key={pool.name}
              name={pool.name}
              data={{ used: pool.used, total: pool.total, percent: pool.percent }}
              isLast={index === poolsInfo.length - 1}
            />
          ))
        ) : (
          <div style={{ padding: '16px 20px', color: '#6b7280', fontSize: 13 }}>
            No pools available
          </div>
        )}
      </SpecGroup>
    </div>
  )
}

function SpecGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12, paddingLeft: 2 }}>{title}</h3>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e5eb', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
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

function DiskRow({ name, data, isLast }: { name: string, data: { used: string; total: string; percent: string }, isLast?: boolean }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{name}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {data.used} / {data.total}
        </div>
      </div>
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${data.percent}%`,
          height: '100%',
          background: Number(data.percent) > 90 ? '#ef4444' : '#3b82f6',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#007aff' }} /> 文档 (30%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34c759' }} /> 图片 (20%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9500' }} /> 视频 (15%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e5e5ea' }} /> 空闲 (35%)</div>
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
        <Row label="Disk 3 (SATA)" value="WD Red Plus 4TB" border={false} />
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
