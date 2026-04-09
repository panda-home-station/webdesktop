/**
 * Disk Size Selector Component
 * Select disk size and type for automatic allocation
 */

import React from 'react'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { DetailsDisk } from '@truenas/types/disk-types'
import { getAvailableDiskSizes } from '../utils/disk-selection'
import { colors } from '@apps/system-settings/styles/theme'

interface DiskSizeSelectorProps {
  availableDisks: DetailsDisk[]
  selectedSize: number | null
  selectedType: DiskType | null
  treatAsMinimum: boolean
  onSizeChange: (size: number | null) => void
  onTypeChange: (type: DiskType | null) => void
  onTreatAsMinimumChange: (treat: boolean) => void
}

export function DiskSizeSelector({
  availableDisks,
  selectedSize,
  selectedType,
  treatAsMinimum,
  onSizeChange,
  onTypeChange,
  onTreatAsMinimumChange,
}: DiskSizeSelectorProps) {
  const sizes = getAvailableDiskSizes(availableDisks)

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`
    }
    return `${gb.toFixed(0)} GB`
  }

  // Count disks by type
  const typeCounts = {
    [DiskType.Hdd]: availableDisks.filter((d) => d.type === DiskType.Hdd).length,
    [DiskType.Ssd]: availableDisks.filter((d) => d.type === DiskType.Ssd).length,
    [DiskType.Nvme]: availableDisks.filter((d) => d.type === DiskType.Nvme).length,
  }

  return (
    <div style={styles.container}>
      {/* Disk Type Selection */}
      <div style={styles.section}>
        <label style={styles.label}>硬盘类型</label>
        <div style={styles.typeGrid}>
          <button
            onClick={() => onTypeChange(null)}
            style={{
              ...styles.typeButton,
              ...(selectedType === null ? styles.typeButtonSelected : {}),
            }}
          >
            <span style={styles.typeLabel}>全部</span>
            <span style={styles.typeCount}>{availableDisks.length}</span>
          </button>
          {Object.entries(typeCounts)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <button
                key={type}
                onClick={() => onTypeChange(type as DiskType)}
                style={{
                  ...styles.typeButton,
                  ...(selectedType === type ? styles.typeButtonSelected : {}),
                }}
              >
                <span style={styles.typeLabel}>
                  {type === DiskType.Hdd ? 'HDD' : type === DiskType.Ssd ? 'SSD' : 'NVMe'}
                </span>
                <span style={styles.typeCount}>{count}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Disk Size Selection */}
      <div style={styles.section}>
        <label style={styles.label}>硬盘大小</label>
        <div style={styles.sizeGrid}>
          <button
            onClick={() => onSizeChange(null)}
            style={{
              ...styles.sizeButton,
              ...(selectedSize === null ? styles.sizeButtonSelected : {}),
            }}
          >
            任意大小
          </button>
          {sizes.map((size) => {
            const count = availableDisks.filter(
              (d) => d.size === size && (selectedType === null || d.type === selectedType)
            ).length
            return (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                style={{
                  ...styles.sizeButton,
                  ...(selectedSize === size ? styles.sizeButtonSelected : {}),
                }}
              >
                {formatSize(size)} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Treat as Minimum Option */}
      <div style={styles.checkboxRow}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={treatAsMinimum}
            onChange={(e) => onTreatAsMinimumChange(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          选择大于等于所选大小的硬盘
        </label>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  typeGrid: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  typeButton: {
    padding: '10px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
    minWidth: 80,
  },
  typeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  typeCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sizeGrid: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  sizeButton: {
    padding: '8px 14px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    color: colors.text,
  },
  sizeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
    color: colors.primary,
    fontWeight: 600,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
}
