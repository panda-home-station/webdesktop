/**
 * Disk List Component
 * Display available disks with selection
 */

import React from 'react'
import { DetailsDisk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { colors } from '@apps/system-settings/styles/theme'

interface DiskListProps {
  disks: DetailsDisk[]
  selectedDisks: DetailsDisk[]
  onToggle: (disk: DetailsDisk) => void
  showSelection?: boolean
}

export function DiskList({
  disks,
  selectedDisks,
  onToggle,
  showSelection = true,
}: DiskListProps) {
  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`
    }
    return `${gb.toFixed(0)} GB`
  }

  const getTypeIcon = (type: DiskType): string => {
    switch (type) {
      case DiskType.Hdd:
        return 'HDD'
      case DiskType.Ssd:
        return 'SSD'
      case DiskType.Nvme:
        return 'NVMe'
      default:
        return type
    }
  }

  const selectedDevnames = new Set(selectedDisks.map((d) => d.devname))

  if (disks.length === 0) {
    return (
      <div style={styles.empty}>
        <span>没有可用的硬盘</span>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerCell}>选择</span>
        <span style={styles.headerCell}>设备名</span>
        <span style={styles.headerCell}>型号</span>
        <span style={styles.headerCell}>大小</span>
        <span style={styles.headerCell}>类型</span>
      </div>
      <div style={styles.list}>
        {disks.map((disk) => {
          const isSelected = selectedDevnames.has(disk.devname)
          return (
            <div
              key={disk.devname}
              onClick={() => showSelection && onToggle(disk)}
              style={{
                ...styles.row,
                ...(isSelected ? styles.rowSelected : {}),
                cursor: showSelection ? 'pointer' : 'default',
              }}
            >
              {showSelection && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(disk)}
                  style={{ marginRight: 12 }}
                />
              )}
              <span style={styles.cell}>{disk.name}</span>
              <span style={styles.cell}>{disk.model || '-'}</span>
              <span style={styles.cell}>{formatSize(disk.size)}</span>
              <span style={styles.cell}>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor:
                      disk.type === DiskType.Hdd
                        ? '#e3f2fd'
                        : disk.type === DiskType.Ssd
                          ? '#e8f5e9'
                          : '#fff3e0',
                    color:
                      disk.type === DiskType.Hdd
                        ? '#1976d2'
                        : disk.type === DiskType.Ssd
                          ? '#388e3c'
                          : '#f57c00',
                  }}
                >
                  {getTypeIcon(disk.type)}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  empty: {
    padding: 24,
    textAlign: 'center' as const,
    color: colors.textSecondary,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 1fr 80px 60px',
    gap: 8,
    padding: '10px 12px',
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
  },
  headerCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  list: {
    maxHeight: 300,
    overflowY: 'auto' as const,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 1fr 80px 60px',
    gap: 8,
    padding: '10px 12px',
    borderBottom: `1px solid ${colors.border}`,
    alignItems: 'center',
    transition: 'background-color 0.15s ease',
  },
  rowSelected: {
    backgroundColor: '#e3f2fd',
  },
  cell: {
    fontSize: 13,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
}
