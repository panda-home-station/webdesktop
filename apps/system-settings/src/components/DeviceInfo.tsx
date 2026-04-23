import { useState, useEffect } from 'react'
import { Server, Cpu, MemoryStick } from 'lucide-react'
import type { SystemInfo, ReportingRealtimeUpdate } from '@truenas/types/system-types'
import type { Pool } from '@shared/types/pool-types'
import type { Disk } from '@shared/types/disk-types'
import { SpecGroup, SpecRow, PoolRow } from './shared'
import { formatBytes, getNetworkInfo, formatUptime, parseSystemDatetime, formatDatetime } from '../utils/system'
import type { NetworkInterfaceFromApi } from '../utils/system'

interface DeviceInfoProps {
  systemInfo: SystemInfo | null
  realtime: ReportingRealtimeUpdate | null
  networkInterfaces: NetworkInterfaceFromApi[]
  pools: Pool[]
  disks: Disk[]
  loading: boolean
  error: string | null
}

export function DeviceInfo({
  systemInfo,
  realtime: _realtime,
  networkInterfaces,
  pools,
  disks,
  loading,
  error,
}: DeviceInfoProps) {
  const [displayTime, setDisplayTime] = useState('')

  // Live clock from system time
  useEffect(() => {
    if (!systemInfo) return

    const baseTs = parseSystemDatetime(systemInfo.datetime)

    setDisplayTime(formatDatetime(baseTs))
    let ts = baseTs
    const timer = setInterval(() => {
      ts += 1000
      setDisplayTime(formatDatetime(ts))
    }, 1000)
    return () => clearInterval(timer)
  }, [systemInfo])

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

  const networkInfo = getNetworkInfo(networkInterfaces)
  const physmemGb = (systemInfo.physmem / (1024 ** 3)).toFixed(1)
  const uptime = formatUptime(systemInfo.uptime_seconds || 0)

  // Compute pool info
  const poolsOverview = pools.map(pool => {
    const total = pool.size
    const used = pool.allocated || (total - (pool.free || 0))
    const free = pool.free || (total - used)
    const percent = total > 0 ? ((used / total) * 100).toFixed(1) : '0'
    return {
      name: pool.name,
      status: pool.healthy ? 'Healthy' : (pool.status_detail || pool.status),
      isHealthy: pool.healthy,
      total,
      used,
      free,
      percent,
      totalStr: formatBytes(total),
      usedStr: formatBytes(used),
      freeStr: formatBytes(free),
    }
  })

  const diskCount = disks.length

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
              <Cpu size={14} /> {systemInfo.cores} cores
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
        <SpecRow label="设备 ID" value={systemInfo.system_serial?.replace(/\s+/g, '') || 'N/A'} />
      </SpecGroup>

      <SpecGroup title="系统规格">
        <SpecRow label="版本" value={systemInfo.version || 'N/A'} />
        <SpecRow label="平台" value={systemInfo.platform || 'N/A'} />
        <SpecRow label="本次运行时间" value={uptime} />
        <SpecRow label="系统时间" value={displayTime || 'N/A'} />
      </SpecGroup>

      <SpecGroup title="网络连接">
        <SpecRow label="IP 地址" value={networkInfo.ip} />
        <SpecRow
          label="连接状态"
          value={
            <span style={{ color: networkInfo.status === 'Connected' ? '#059669' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
              ● {networkInfo.status}
            </span>
          }
        />
      </SpecGroup>

      <SpecGroup title="存储空间">
        {poolsOverview.length > 0 ? (
          <>
            {poolsOverview.map((pool) => (
              <PoolRow
                key={pool.name}
                name={pool.name}
                status={pool.status}
                isHealthy={pool.isHealthy}
                usedStr={pool.usedStr}
                totalStr={pool.totalStr}
                freeStr={pool.freeStr}
                percent={pool.percent}
                isLast={false}
              />
            ))}
            {diskCount > 0 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
                共 {diskCount} 个硬盘 · {poolsOverview.length} 个存储池
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '16px 20px', color: '#6b7280', fontSize: 13 }}>
            No pools available
          </div>
        )}
      </SpecGroup>
    </div>
  )
}
