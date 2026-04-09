/**
 * System Settings App
 * Main system settings application
 */

import { useState, useEffect } from 'react'
import { Sidebar } from '@desktop/components/Sidebar'
import { Info, Users, HardDrive, Network, Globe, Server } from 'lucide-react'
import { systemService } from '@truenas/services/system'
import { poolService } from '@truenas/services/pool'
import { diskService } from '@truenas/services/disk'
import { datasetService } from '@truenas/services/dataset'
import type { SystemInfo, ReportingRealtimeUpdate } from '@truenas/types/system'
import type { Pool } from '@truenas/types/pool'
import type { Disk } from '@truenas/types/disk'
import type { Dataset } from '@truenas/types/dataset'
import type { NetworkInterfaceFromApi } from './utils/system'
import { UserManagement } from './components/UserManagement'
import { DeviceInfo } from './components/DeviceInfo'
import { StorageOverview } from './components/StorageOverview'
import { DiskOverview } from './components/DiskOverview'
import { NetworkSettings } from './components/NetworkSettings'
import { RemoteAccess } from './components/RemoteAccess'

const TABS = [
  { id: 'device', label: '关于本机', icon: <Info size={20} /> },
  { id: 'users', label: '用户与群组', icon: <Users size={20} /> },
  { id: 'storage', label: '存储空间', icon: <Server size={20} /> },
  { id: 'disk', label: '硬盘管理', icon: <HardDrive size={20} /> },
  { id: 'network', label: '网络', icon: <Network size={20} /> },
  { id: 'remote', label: '远程访问', icon: <Globe size={20} /> },
]

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('device')

  // Static system info
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterfaceFromApi[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [disks, setDisks] = useState<Disk[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])

  // Realtime data
  const [realtime, setRealtime] = useState<ReportingRealtimeUpdate | null>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch static data on mount
  useEffect(() => {
    let cancelled = false

    async function fetchStaticData() {
      try {
        const [sysInfo, ifaces, poolsData, disksData, datasetsData] = await Promise.all([
          systemService.getSystemInfo(),
          systemService.getNetworkInterfaces(),
          poolService.query([], { extra: { is_upgraded: true } } as unknown as undefined),
          diskService.query([], { extra: { pools: true } }),
          datasetService.query(),
        ])

        if (cancelled) return

        setSystemInfo(sysInfo as SystemInfo)
        setNetworkInterfaces(ifaces as NetworkInterfaceFromApi[])
        setPools(poolsData as Pool[])
        setDisks(disksData as Disk[])
        setDatasets(datasetsData as Dataset[])
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
    <div
      style={{
        display: 'flex',
        height: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#1c1c1e',
        background: '#f2f2f7'
      }}
      className="noselect"
    >
      <Sidebar items={TABS} activeId={activeTab} onSelect={setActiveTab} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <TabContent
            id={activeTab}
            systemInfo={systemInfo}
            realtime={realtime}
            networkInterfaces={networkInterfaces}
            pools={pools}
            disks={disks}
            datasets={datasets}
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
  pools,
  disks,
  datasets,
  loading,
  error,
}: {
  id: string
  systemInfo: SystemInfo | null
  realtime: ReportingRealtimeUpdate | null
  networkInterfaces: NetworkInterfaceFromApi[]
  pools: Pool[]
  disks: Disk[]
  datasets: Dataset[]
  loading: boolean
  error: string | null
}) {
  switch (id) {
    case 'device':
      return (
        <DeviceInfo
          systemInfo={systemInfo}
          realtime={realtime}
          networkInterfaces={networkInterfaces}
          pools={pools}
          disks={disks}
          loading={loading}
          error={error}
        />
      )
    case 'users':
      return <UserManagement />
    case 'storage':
      return (
        <StorageOverview
          pools={pools}
          datasets={datasets}
        />
      )
    case 'disk':
      return (
        <DiskOverview
          disks={disks}
        />
      )
    case 'network':
      return <NetworkSettings />
    case 'remote':
      return <RemoteAccess />
    default:
      return null
  }
}
