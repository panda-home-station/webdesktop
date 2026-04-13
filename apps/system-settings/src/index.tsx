/**
 * System Settings App
 * Main system settings application
 */

import { useState, useEffect, Dispatch } from 'react'
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

// Storage tab has sub-views with different titles
const STORAGE_TITLES: Record<string, string> = {
  'overview': '存储空间',
  'create-pool': '创建存储池',
  'pool-details': '存储池',
  'vdevs-details': 'VDEVs详情',
  'datasets-details': '数据集详情',
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('device')
  const [storageView, setStorageView] = useState<string>('overview')

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
          poolService.query([], { extra: { is_upgraded: true } }),
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

  // Subscribe to pool changes for real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const refreshPools = async () => {
      try {
        const poolsData = await poolService.query([], { extra: { is_upgraded: true } })
        setPools(poolsData as Pool[])
      } catch (err) {
        console.error('Failed to refresh pools:', err)
      }
    }

    try {
      unsubscribe = poolService.subscribeToChanges(() => {
        refreshPools()
      })
    } catch (err) {
      console.error('Failed to subscribe to pool changes:', err)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Subscribe to disk changes for real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const refreshDisks = async () => {
      try {
        const disksData = await diskService.query([], { extra: { pools: true } })
        setDisks(disksData as Disk[])
      } catch (err) {
        console.error('Failed to refresh disks:', err)
      }
    }

    try {
      unsubscribe = diskService.subscribeToChanges(() => {
        refreshDisks()
      })
    } catch (err) {
      console.error('Failed to subscribe to disk changes:', err)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // Subscribe to dataset changes for real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const refreshDatasets = async () => {
      try {
        const datasetsData = await datasetService.query()
        setDatasets(datasetsData as Dataset[])
      } catch (err) {
        console.error('Failed to refresh datasets:', err)
      }
    }

    try {
      unsubscribe = datasetService.subscribeToChanges(() => {
        refreshDatasets()
      })
    } catch (err) {
      console.error('Failed to subscribe to dataset changes:', err)
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {activeTab === 'storage' ? STORAGE_TITLES[storageView] || TABS.find(t => t.id === activeTab)?.label : TABS.find(t => t.id === activeTab)?.label}
            </h2>
            {activeTab === 'storage' && storageView === 'create-pool' && (
              <button
                onClick={() => setStorageView('overview')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgb(142, 142, 147)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#FFFFFF',
                  transition: '0.15s',
                  marginRight: 16,
                }}
              >
                取消
              </button>
            )}
          </div>
          <TabContent
            id={activeTab}
            storageView={storageView}
            onStorageViewChange={setStorageView}
            systemInfo={systemInfo}
            realtime={realtime}
            networkInterfaces={networkInterfaces}
            pools={pools}
            disks={disks}
            datasets={datasets}
            loading={loading}
            error={error}
            setDisks={setDisks}
          />
        </div>
      </div>
    </div>
  )
}

function TabContent({
  id,
  storageView,
  onStorageViewChange,
  systemInfo,
  realtime,
  networkInterfaces,
  pools,
  disks,
  datasets,
  loading,
  error,
  setDisks,
  setPools,
}: {
  id: string
  storageView: string
  onStorageViewChange: (view: string) => void
  systemInfo: SystemInfo | null
  realtime: ReportingRealtimeUpdate | null
  networkInterfaces: NetworkInterfaceFromApi[]
  pools: Pool[]
  disks: Disk[]
  datasets: Dataset[]
  loading: boolean
  error: string | null
  setDisks: Dispatch<React.SetStateAction<Disk[]>>
  setPools: Dispatch<React.SetStateAction<Pool[]>>
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
          view={storageView}
          onViewChange={onStorageViewChange}
          pools={pools}
          datasets={datasets}
          onPoolsRefresh={setPools}
        />
      )
    case 'disk':
      return (
        <DiskOverview
          disks={disks}
          onDiskUpdate={(updatedDisk) => {
            setDisks(prev => prev.map(d =>
              d.identifier === updatedDisk.identifier ? updatedDisk : d
            ))
          }}
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
