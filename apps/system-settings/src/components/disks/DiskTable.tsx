/**
 * Disk Table Component
 * Display disks in a table format
 */

import { Disk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'

/**
 * Check if disk is a system disk (boot pool disk)
 */
function isSystemDisk(disk: Disk): boolean {
  return disk.pool === 'freenas-boot' || disk.pool === 'boot-pool'
}

/**
 * System disk badge component
 */
function SystemDiskBadge() {
  return (
    <span style={styles.systemBadge}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      系统盘
    </span>
  )
}

interface DiskTableProps {
  disks: Disk[]
  onDiskClick?: (disk: Disk) => void
}

export function DiskTable({ disks, onDiskClick }: DiskTableProps) {
  if (disks.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>未找到磁盘</p>
      </div>
    )
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            <th style={styles.headerCell}>名称</th>
            <th style={styles.headerCell}>类型</th>
            <th style={styles.headerCell}>容量</th>
            <th style={styles.headerCell}>总线</th>
            <th style={styles.headerCell}>型号</th>
            <th style={styles.headerCell}>存储池</th>
            <th style={styles.headerCell}>状态</th>
          </tr>
        </thead>
        <tbody>
          {disks.map((disk) => (
            <tr
              key={disk.identifier || disk.name}
              style={styles.row}
              onClick={() => onDiskClick?.(disk)}
            >
              <td style={styles.cell}>
                <div style={styles.diskNameContainer}>
                  <span style={styles.diskName}>{disk.name}</span>
                  {isSystemDisk(disk) && <SystemDiskBadge />}
                </div>
              </td>
              <td style={styles.cell}>
                <TypeBadge type={disk.type} />
              </td>
              <td style={styles.cell}>{formatBytes(disk.size)}</td>
              <td style={styles.cell}>{disk.bus}</td>
              <td style={styles.cell}>
                <span style={styles.modelText} title={disk.model}>
                  {disk.model || '-'}
                </span>
              </td>
              <td style={styles.cell}>
                {disk.pool ? (
                  <span style={styles.poolBadge}>{disk.pool}</span>
                ) : (
                  <span style={styles.unassignedText}>未分配</span>
                )}
              </td>
              <td style={styles.cell}>
                <StatusIndicator online={!disk.pool || disk.pool === ''} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TypeBadge({ type }: { type: DiskType }) {
  const colors_map: Record<DiskType, string> = {
    [DiskType.Hdd]: '#8e8e93',
    [DiskType.Ssd]: '#34c759',
    [DiskType.Nvme]: '#007aff',
    [DiskType.Usb]: '#ff9500',
    [DiskType.Hda]: '#8e8e93',
  }

  const labels: Record<DiskType, string> = {
    [DiskType.Hdd]: 'HDD',
    [DiskType.Ssd]: 'SSD',
    [DiskType.Nvme]: 'NVMe',
    [DiskType.Usb]: 'USB',
    [DiskType.Hda]: 'HDA',
  }

  return (
    <span
      style={{
        ...styles.typeBadge,
        backgroundColor: colors_map[type] || '#8e8e93',
      }}
    >
      {labels[type] || type}
    </span>
  )
}

function StatusIndicator({ online }: { online: boolean }) {
  return (
    <div style={styles.statusIndicator}>
      <div
        style={{
          ...styles.statusDot,
          backgroundColor: online ? colors.textSecondary : colors.success,
        }}
      />
      <span style={styles.statusText}>
        {online ? '可用' : '存储池中'}
      </span>
    </div>
  )
}

const styles = {
  tableContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  headerRow: {
    backgroundColor: colors.background,
  },
  headerCell: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  row: {
    borderBottom: `1px solid ${colors.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  cell: {
    padding: '14px 16px',
    fontSize: 14,
    color: colors.text,
  },
  diskName: {
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  diskNameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  systemBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    backgroundColor: '#ff9500',
    color: 'white',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  modelText: {
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    display: 'inline-block',
  },
  typeBadge: {
    padding: '4px 8px',
    color: 'white',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  poolBadge: {
    padding: '3px 8px',
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
  },
  unassignedText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  statusText: {
    fontSize: 13,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
  },
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: colors.textSecondary,
  },
}
