/**
 * VDev Tree Component
 * Visualize vDev topology structure
 */

import { PoolTopology } from '@truenas/types/pool'
import { VDevItem, isTopologyDisk } from '@truenas/types/storage-types'
import { TopologyItemType } from '@truenas/types/vdev-enum-types'
import { TopologyItemStatus, getTopologyStatusColor, getTopologyStatusLabel } from '@truenas/types/vdev-status-enum'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'

interface VDevTreeProps {
  topology: PoolTopology
  onDiskClick?: (diskName: string) => void
}

export function VDevTree({ topology, onDiskClick }: VDevTreeProps) {
  return (
    <div style={styles.container}>
      {/* Data vDevs */}
      {topology.data && topology.data.length > 0 && (
        <VDevGroup
          label="Data"
          vdevs={topology.data}
          onDiskClick={onDiskClick}
        />
      )}

      {/* Special/Metadata vDevs */}
      {topology.special && topology.special.length > 0 && (
        <VDevGroup
          label="Metadata"
          vdevs={topology.special}
          onDiskClick={onDiskClick}
        />
      )}

      {/* Dedup vDevs */}
      {topology.dedup && topology.dedup.length > 0 && (
        <VDevGroup
          label="Dedup"
          vdevs={topology.dedup}
          onDiskClick={onDiskClick}
        />
      )}

      {/* Log vDevs (SLOG) */}
      {topology.log && topology.log.length > 0 && (
        <VDevGroup
          label="SLOG (Log)"
          vdevs={topology.log}
          onDiskClick={onDiskClick}
        />
      )}

      {/* Cache vDevs (L2ARC) */}
      {topology.cache && topology.cache.length > 0 && (
        <VDevGroup
          label="L2ARC (Cache)"
          vdevs={topology.cache}
          onDiskClick={onDiskClick}
        />
      )}

      {/* Spare disks */}
      {topology.spare && topology.spare.length > 0 && (
        <div style={styles.group}>
          <div style={styles.groupHeader}>
            <span style={styles.groupLabel}>Spare</span>
          </div>
          <div style={styles.diskRow}>
            {topology.spare.map((diskName) => (
              <DiskNode
                key={diskName}
                name={diskName}
                status={TopologyItemStatus.Online}
                onClick={() => onDiskClick?.(diskName)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface VDevGroupProps {
  label: string
  vdevs: VDevItem[]
  onDiskClick?: (diskName: string) => void
}

function VDevGroup({ label, vdevs, onDiskClick }: VDevGroupProps) {
  return (
    <div style={styles.group}>
      <div style={styles.groupHeader}>
        <span style={styles.groupLabel}>{label}</span>
        <span style={styles.groupCount}>{vdevs.length} vDev{vdevs.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={styles.vdevList}>
        {vdevs.map((vdev, index) => (
          <VDevNode
            key={vdev.guid || index}
            vdev={vdev}
            onDiskClick={onDiskClick}
          />
        ))}
      </div>
    </div>
  )
}

interface VDevNodeProps {
  vdev?: VDevItem
  name?: string
  status?: TopologyItemStatus
  onClick?: () => void
}

function VDevNode({ vdev, name, status, onClick }: VDevNodeProps) {
  // If it's a disk directly (not a vdev group)
  if (!vdev) {
    return (
      <div style={styles.diskRow}>
        <DiskNode
          name={name!}
          status={status || TopologyItemStatus.Online}
          onClick={onClick}
        />
      </div>
    )
  }

  // It's a vdev group
  const vdevType = getVdevTypeName(vdev.type)
  const vdevStatusColor = getTopologyStatusColor(vdev.status)

  return (
    <div style={styles.vdevCard}>
      <div style={styles.vdevHeader}>
        <span style={styles.vdevType}>{vdevType}</span>
        <span style={{ ...styles.vdevStatus, backgroundColor: vdevStatusColor }}>
          {getTopologyStatusLabel(vdev.status)}
        </span>
      </div>
      <div style={styles.diskRow}>
        {vdev.children.map((child, index) => (
          <DiskNode
            key={child.guid || index}
            name={isTopologyDisk(child) ? child.disk : child.name}
            status={child.status}
            onClick={() => onClick?.(isTopologyDisk(child) ? child.disk : child.name)}
          />
        ))}
      </div>
      <div style={styles.vdevStats}>
        <span>Size: {formatBytes(vdev.stats.size)}</span>
        <span>Allocated: {formatBytes(vdev.stats.allocated)}</span>
      </div>
    </div>
  )
}

interface DiskNodeProps {
  name: string
  status: TopologyItemStatus
  onClick?: () => void
}

function DiskNode({ name, status, onClick }: DiskNodeProps) {
  const statusColor = getTopologyStatusColor(status)

  return (
    <div
      style={{
        ...styles.diskNode,
        borderColor: statusColor,
      }}
      onClick={onClick}
      title={`${name} - ${getTopologyStatusLabel(status)}`}
    >
      <div style={{ ...styles.diskIndicator, backgroundColor: statusColor }} />
      <span style={styles.diskName}>{name}</span>
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  group: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 16,
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  groupCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  vdevList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  vdevCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    border: `1px solid ${colors.border}`,
  },
  vdevHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vdevType: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  vdevStatus: {
    padding: '2px 8px',
    color: 'white',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
  },
  diskRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  diskNode: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    border: '2px solid',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  diskIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  diskName: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.text,
  },
  vdevStats: {
    display: 'flex',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${colors.border}`,
    fontSize: 11,
    color: colors.textSecondary,
  },
}
