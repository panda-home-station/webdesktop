/**
 * Disk Size Selector Component
 * Select disk size and type for automatic allocation
 */

import React, { useMemo } from 'react'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { DetailsDisk } from '@truenas/types/disk-types'
import { colors } from '@apps/system-settings/styles/theme'

interface DiskSizeOption {
  label: string
  value: string // format: "size-diskType"
  size: number
  type: DiskType
}

interface DiskSizeSelectorProps {
  availableDisks: DetailsDisk[]
  selectedSize: number | null
  selectedType: DiskType | null
  treatAsMinimum: boolean
  onSizeChange: (size: number | null) => void
  onTypeChange: (type: DiskType | null) => void
  onTreatAsMinimumChange: (treat: boolean) => void
}

const formatSize = (bytes: number): string => {
  if (typeof bytes !== 'number' || bytes <= 0 || isNaN(bytes)) {
    return 'Unknown'
  }
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(1)} TB`
  }
  return `${gb.toFixed(0)} GB`
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
  // Generate size+type options grouped by type like webui
  const sizeOptions = useMemo(() => {
    const disks = availableDisks ?? []
    const options: DiskSizeOption[] = []

    // Group disks by type
    const byType: Record<DiskType, Map<number, number>> = {
      [DiskType.Hdd]: new Map(),
      [DiskType.Ssd]: new Map(),
      [DiskType.Nvme]: new Map(),
    }

    disks.forEach((disk) => {
      // Skip disks with invalid size
      if (typeof disk.size !== 'number' || disk.size <= 0 || isNaN(disk.size)) {
        return
      }
      // Skip unknown disk types
      if (disk.type !== DiskType.Hdd && disk.type !== DiskType.Ssd && disk.type !== DiskType.Nvme) {
        return
      }
      const current = byType[disk.type]?.get(disk.size) ?? 0
      byType[disk.type].set(disk.size, current + 1)
    })

    // Create options for each type
    Object.entries(byType).forEach(([type, sizeMap]) => {
      if (sizeMap.size === 0) return
      const typeLabel = type === DiskType.Hdd ? 'HDD' : type === DiskType.Ssd ? 'SSD' : 'NVMe'
      Array.from(sizeMap.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([size]) => {
          options.push({
            label: `${formatSize(size)} (${typeLabel})`,
            value: `${size}-${type}`,
            size,
            type: type as DiskType,
          })
        })
    })

    return options.sort((a, b) => a.size - b.size)
  }, [availableDisks])

  // Check if selected option is still valid
  const selectedValue = selectedSize && selectedType
    ? `${selectedSize}-${selectedType}`
    : ''

  const handleChange = (value: string) => {
    if (!value) {
      onSizeChange(null)
      onTypeChange(null)
      return
    }
    const [size, type] = value.split('-')
    onSizeChange(Number(size))
    onTypeChange(type as DiskType)
  }

  // Check if we can offer "treat as minimum" option
  const canSelectLarger = useMemo(() => {
    if (!selectedSize) return false
    const disks = availableDisks ?? []
    return disks.some((d) => d.size > selectedSize)
  }, [selectedSize, availableDisks])

  return (
    <div style={styles.container}>
      {/* Disk Size and Type Dropdown */}
      <div style={styles.field}>
        <label style={styles.label}>硬盘大小</label>
        <select
          value={selectedValue}
          onChange={(e) => handleChange(e.target.value)}
          style={styles.select}
        >
          <option value="">选择硬盘大小...</option>
          {sizeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Treat as Minimum Option */}
      {canSelectLarger && (
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
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    color: colors.text,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238e8e93' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
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
