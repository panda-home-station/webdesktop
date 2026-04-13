/**
 * VDevs Card Component
 * Displays VDEVs topology in a clean list format (similar to webui)
 */

import { useState } from 'react'
import { PoolTopology } from '@truenas/types/pool'
import { VDevItem, isTopologyDisk } from '@truenas/types/storage-types'
import { TopologyItemType } from '@truenas/types/vdev-enum-types'
import { TopologyItemStatus, getTopologyStatusColor, getTopologyStatusLabel } from '@truenas/types/vdev-status-enum'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'
import {
  HardDrive,
  Database,
  Layers,
  Archive,
  Box,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'

interface VDevsCardProps {
  topology: PoolTopology
  onDiskClick?: (diskName: string) => void
  onViewDetails?: () => void
}

// Get redundancy level for a vdev (0 = no redundancy)
function getRedundancyLevel(vdev: VDevItem): number {
  switch (vdev.type) {
    case TopologyItemType.Disk:
    case TopologyItemType.Stripe:
      return 0
    case TopologyItemType.Mirror:
      return (vdev.children?.length || 0) - 1
    case TopologyItemType.Raidz:
    case TopologyItemType.Raidz1:
      return 1
    case TopologyItemType.Raidz2:
      return 2
    case TopologyItemType.Raidz3:
      return 3
    default:
      return 0
  }
}

export function VDevsCard({ topology, onDiskClick, onViewDetails }: VDevsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Build list of vdev groups with their vdevs
  const groups: {
    label: string
    key: keyof PoolTopology
    icon: React.ReactNode
    vdevs: VDevItem[]
    hasNoRedundancy: boolean
  }[] = []

  const dataVdevs = topology.data || []
  const hasDataNoRedundancy = dataVdevs.some((vdev) => getRedundancyLevel(vdev) === 0)

  if (topology.data && topology.data.length > 0) {
    groups.push({
      label: '数据',
      key: 'data',
      icon: <Database size={16} />,
      vdevs: topology.data,
      hasNoRedundancy: hasDataNoRedundancy,
    })
  }
  if (topology.special && topology.special.length > 0) {
    groups.push({
      label: '元数据',
      key: 'special',
      icon: <Layers size={16} />,
      vdevs: topology.special,
      hasNoRedundancy: false,
    })
  }
  if (topology.dedup && topology.dedup.length > 0) {
    groups.push({
      label: '重删',
      key: 'dedup',
      icon: <Archive size={16} />,
      vdevs: topology.dedup,
      hasNoRedundancy: false,
    })
  }
  if (topology.log && topology.log.length > 0) {
    groups.push({
      label: '日志',
      key: 'log',
      icon: <HardDrive size={16} />,
      vdevs: topology.log,
      hasNoRedundancy: false,
    })
  }
  if (topology.cache && topology.cache.length > 0) {
    groups.push({
      label: '缓存',
      key: 'cache',
      icon: <Box size={16} />,
      vdevs: topology.cache,
      hasNoRedundancy: false,
    })
  }
  if (topology.spare && topology.spare.length > 0) {
    groups.push({
      label: '热备',
      key: 'spare',
      icon: <HardDrive size={16} />,
      vdevs: [],
      hasNoRedundancy: false,
    })
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <HardDrive size={18} color={colors.primary} />
          <span style={styles.title}>存储设备</span>
          <span style={styles.titleBadge}>{groups.length} 个</span>
        </div>
        <button
          style={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? '折叠' : '展开'}
        >
          <ChevronDown
            size={18}
            style={{
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div style={styles.content}>
          {groups.length === 0 ? (
            <div style={styles.emptyState}>未配置存储设备</div>
          ) : (
            <div style={styles.vdevList}>
              {/* Table Header */}
              <div style={styles.tableHeader}>
                <span style={styles.headerName}>类型</span>
                <span style={styles.headerStatus}>状态</span>
                <span style={styles.headerCapacity}>容量</span>
                <span style={styles.headerErrors}>磁盘</span>
              </div>

              {/* VDev Rows */}
              {groups.map((group) => (
                <VDevGroupRow
                  key={group.key}
                  label={group.label}
                  icon={group.icon}
                  vdevs={group.vdevs}
                  hasNoRedundancy={group.hasNoRedundancy}
                  onDiskClick={onDiskClick}
                />
              ))}
            </div>
          )}
          {onViewDetails && (
            <div style={styles.footer}>
              <button style={styles.viewDetailsButton} onClick={onViewDetails}>
                查看 VDEVs 详情 →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface VDevGroupRowProps {
  label: string
  icon: React.ReactNode
  vdevs: VDevItem[]
  hasNoRedundancy: boolean
  onDiskClick?: (diskName: string) => void
}

function VDevGroupRow({
  label,
  icon,
  vdevs,
  hasNoRedundancy,
  onDiskClick: _onDiskClick,
}: VDevGroupRowProps) {
  // Calculate totals for this group
  const totalSize = vdevs.reduce((sum, vdev) => sum + (vdev.stats?.size || 0), 0)
  const totalAllocated = vdevs.reduce((sum, vdev) => sum + (vdev.stats?.allocated || 0), 0)

  // Get overall status (worst status of all vdevs)
  const getWorstStatus = (): TopologyItemStatus => {
    const statusPriority: TopologyItemStatus[] = [
      TopologyItemStatus.Online,
      TopologyItemStatus.Available,
      TopologyItemStatus.Degraded,
      TopologyItemStatus.Offline,
      TopologyItemStatus.Faulted,
      TopologyItemStatus.Unavailable,
    ]

    let worst = TopologyItemStatus.Online
    for (const vdev of vdevs) {
      const idx = statusPriority.indexOf(vdev.status)
      const worstIdx = statusPriority.indexOf(worst)
      if (idx > worstIdx) {
        worst = vdev.status
      }
    }
    return worst
  }

  const worstStatus = getWorstStatus()
  const statusColor = getTopologyStatusColor(worstStatus)
  const statusLabel = getTopologyStatusLabel(worstStatus)

  // Get disk count
  const diskCount = vdevs.reduce((sum, vdev) => {
    if (isTopologyDisk(vdev)) return sum + 1
    return sum + (vdev.children?.length || 0)
  }, 0)

  const vdevTypeName = vdevs.length === 1 ? getVdevTypeName(vdevs[0].type) : null

  return (
    <div style={styles.vdevRow}>
      {/* VDEV Name Cell */}
      <div style={styles.nameCell}>
        <div style={styles.nameCellIcon}>{icon}</div>
        <div style={styles.nameCellContent}>
          <span style={styles.vdevLabel}>{label}</span>
          {vdevTypeName && (
            <span style={styles.vdevTypeName}>{vdevTypeName}</span>
          )}
          {hasNoRedundancy && (
            <span style={styles.warningBadge}>
              <AlertTriangle size={10} />
              无冗余
            </span>
          )}
        </div>
      </div>

      {/* Status Cell */}
      <div style={styles.statusCell}>
        <span style={{ ...styles.statusBadge, backgroundColor: statusColor }}>
          {statusLabel}
        </span>
      </div>

      {/* Capacity Cell */}
      <div style={styles.capacityCell}>
        <span style={styles.capacityValue}>{formatBytes(totalSize)}</span>
        <span style={styles.capacityUsed}>
          {formatBytes(totalAllocated)} used
        </span>
      </div>

      {/* Disks Cell */}
      <div style={styles.disksCell}>
        <span style={styles.diskCount}>{diskCount}</span>
        <span style={styles.diskLabel}>disks</span>
      </div>
    </div>
  )
}

function getVdevTypeName(type: TopologyItemType): string {
  const names: Record<string, string> = {
    [TopologyItemType.Mirror]: 'Mirror',
    [TopologyItemType.Raidz]: 'RAIDZ',
    [TopologyItemType.Raidz1]: 'RAIDZ1',
    [TopologyItemType.Raidz2]: 'RAIDZ2',
    [TopologyItemType.Raidz3]: 'RAIDZ3',
    [TopologyItemType.Draid]: 'DRAID',
    [TopologyItemType.Stripe]: 'Stripe',
    [TopologyItemType.L2Cache]: 'L2ARC',
    [TopologyItemType.Log]: 'Log',
    [TopologyItemType.Spare]: 'Spare',
    [TopologyItemType.Disk]: 'Disk',
  }
  return names[type] || type
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  titleBadge: {
    padding: '4px 10px',
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  expandButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    border: 'medium',
    borderRadius: 6,
    cursor: 'pointer',
    transition: '0.2s',
  },
  content: {
    padding: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    color: colors.textSecondary,
    fontSize: 14,
  },
  vdevList: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 0.8fr',
    gap: 12,
    padding: '10px 20px',
    backgroundColor: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 11,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  headerName: {
    display: 'flex',
    alignItems: 'center',
  },
  headerStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  headerCapacity: {
    display: 'flex',
    alignItems: 'center',
  },
  headerErrors: {
    display: 'flex',
    alignItems: 'center',
  },
  vdevRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 0.8fr',
    gap: 12,
    padding: '14px 20px',
    borderBottom: `1px solid ${colors.border}`,
    alignItems: 'center',
    transition: 'background-color 0.15s ease',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  nameCellIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.background,
    borderRadius: 8,
    color: colors.primary,
  },
  nameCellContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  vdevLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  vdevTypeName: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  warningBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 6px',
    backgroundColor: colors.warning + '15',
    color: colors.warning,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 500,
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4px 10px',
    color: 'white',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  capacityCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  capacityValue: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    fontFamily: 'monospace',
  },
  capacityUsed: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  disksCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  diskCount: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  },
  diskLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '12px 20px',
    borderTop: `1px solid ${colors.border}`,
  },
  viewDetailsButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
}