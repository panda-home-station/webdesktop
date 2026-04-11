/**
 * Data Step Component
 * Data vdev configuration using manual disk selection UI
 */

import React, { useState, useMemo } from 'react'
import { Plus, Trash2, Search, X } from 'lucide-react'
import { VDevType, CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { DetailsDisk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { usePoolWizardStore, LAYOUT_OPTIONS } from '../store/poolWizardStore'
import { minDisksPerLayout } from '../store/poolWizardStore'
import { colors } from '@apps/system-settings/styles/theme'

interface DataStepProps {
  errors: Record<string, string>
  warnings: Record<string, string>
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

const getTypeColor = (type: DiskType) => {
  switch (type) {
    case DiskType.Hdd:
      return { bg: '#e3f2fd', text: '#1976d2' }
    case DiskType.Ssd:
      return { bg: '#e8f5e9', text: '#388e3c' }
    case DiskType.Nvme:
      return { bg: '#fff3e0', text: '#f57c00' }
    default:
      return { bg: '#f5f5f5', text: '#666' }
  }
}

export function DataStep({ errors, warnings: _warnings }: DataStepProps) {
  const {
    topology,
    unusedDisks,
    allowNonUniqueSerialDisks,
    setLayout,
    setManualDisks,
  } = usePoolWizardStore()

  const category = topology[VDevType.Data]
  const allowedLayouts = LAYOUT_OPTIONS[VDevType.Data]

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DiskType | ''>('')
  const [sizeFilter, setSizeFilter] = useState<number | ''>('')

  // Calculate available disks for this category, filtering based on allowNonUniqueSerialDisks
  const usedDisks = useMemo(() => {
    const used = new Set<string>()
    Object.entries(topology).forEach(([type, cat]) => {
      if (type !== VDevType.Data) {
        cat.vdevs.forEach((vdev) => {
          vdev.forEach((disk) => used.add(disk.devname))
        })
      }
    })
    return used
  }, [topology])

  // Filter disks: exclude used disks and disks with non-unique serials if not allowed
  const availableDisks = useMemo(() => {
    return unusedDisks.filter((d) => {
      if (usedDisks.has(d.devname)) {
        return false
      }
      if (!allowNonUniqueSerialDisks && d.duplicate_serial && d.duplicate_serial.length > 0) {
        return false
      }
      return true
    })
  }, [unusedDisks, usedDisks, allowNonUniqueSerialDisks])

  // Filter available disks for selection
  const filteredDisks = useMemo(() => {
    return availableDisks.filter((disk) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matches =
          disk.name?.toLowerCase().includes(query) ||
          disk.model?.toLowerCase().includes(query) ||
          disk.serial?.toLowerCase().includes(query)
        if (!matches) return false
      }
      // Type filter
      if (typeFilter && disk.type !== typeFilter) {
        return false
      }
      // Size filter
      if (sizeFilter && disk.size !== sizeFilter) {
        return false
      }
      return true
    })
  }, [availableDisks, searchQuery, typeFilter, sizeFilter])

  // Get unique disk sizes for filter dropdown
  const diskSizes = useMemo(() => {
    const sizes = new Set<number>()
    availableDisks.forEach((disk) => {
      if (disk.size) sizes.add(disk.size)
    })
    return Array.from(sizes).sort((a, b) => a - b)
  }, [availableDisks])

  // VDEVs: array of vdevs, each vdev is an array of disks
  const [vdevs, setVdevs] = useState<DetailsDisk[][]>(() => {
    return category.vdevs.length > 0 ? category.vdevs : [[]]
  })

  // Add a new empty VDEV
  const addVdev = () => {
    setVdevs([...vdevs, []])
  }

  // Remove a VDEV and return its disks to available
  const removeVdev = (index: number) => {
    const newVdevs = [...vdevs]
    newVdevs.splice(index, 1)
    if (newVdevs.length === 0) {
      newVdevs.push([])
    }
    setVdevs(newVdevs)
    setManualDisks(VDevType.Data, newVdevs)
  }

  // Add a disk to a specific VDEV
  const addDiskToVdev = (disk: DetailsDisk, vdevIndex: number) => {
    const newVdevs = [...vdevs]
    newVdevs[vdevIndex] = [...newVdevs[vdevIndex], disk]
    setVdevs(newVdevs)
    setManualDisks(VDevType.Data, newVdevs)
  }

  // Remove a disk from a VDEV
  const removeDiskFromVdev = (vdevIndex: number, diskDevname: string) => {
    const newVdevs = [...vdevs]
    newVdevs[vdevIndex] = newVdevs[vdevIndex].filter((d) => d.devname !== diskDevname)
    setVdevs(newVdevs)
    setManualDisks(VDevType.Data, newVdevs)
  }

  // Handle layout change
  const handleLayoutChange = (layout: CreateVdevLayout | null) => {
    setLayout(VDevType.Data, layout)
  }

  // Get min disks for current layout
  const minDisks = minDisksPerLayout[category.layout ?? CreateVdevLayout.Stripe] ?? 1

  return (
    <div style={styles.container}>
      {/* Layout Selection */}
      <div style={styles.layoutSection}>
        <label style={styles.label}>布局</label>
        <select
          value={category.layout ?? ''}
          onChange={(e) => handleLayoutChange(e.target.value ? e.target.value as CreateVdevLayout : null)}
          style={styles.select}
        >
          <option value="">选择布局...</option>
          {allowedLayouts.map((layout) => (
            <option key={layout} value={layout}>
              {layout}
            </option>
          ))}
        </select>
        {errors.layout && (
          <div style={styles.error}>
            <X size={14} />
            {errors.layout}
          </div>
        )}
      </div>

      {/* Disk Selection UI - similar to manual selection dialog */}
      <div style={styles.selectionContainer}>
        {/* Left Pane - Available Disks */}
        <div style={styles.leftPane}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>可用硬盘 ({filteredDisks.length})</span>
          </div>

          {/* Filters */}
          <div style={styles.filters}>
            <div style={styles.searchContainer}>
              <Search size={14} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterRow}>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DiskType | '')}
                style={styles.filterSelect}
              >
                <option value="">所有类型</option>
                <option value={DiskType.Hdd}>HDD</option>
                <option value={DiskType.Ssd}>SSD</option>
                <option value={DiskType.Nvme}>NVMe</option>
              </select>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value ? Number(e.target.value) : '')}
                style={styles.filterSelect}
              >
                <option value="">所有大小</option>
                {diskSizes.map((size) => (
                  <option key={size} value={size}>
                    {formatSize(size)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Disk List */}
          <div style={styles.diskList}>
            {filteredDisks.length === 0 ? (
              <div style={styles.emptyState}>没有可用的硬盘</div>
            ) : (
              filteredDisks.map((disk) => (
                <div
                  key={disk.devname}
                  style={styles.diskCard}
                  onClick={() => {
                    // Add to first VDEV
                    if (vdevs.length === 0) {
                      setVdevs([[disk]])
                    } else {
                      addDiskToVdev(disk, 0)
                    }
                  }}
                >
                  <div style={styles.diskIcon}>
                    <svg width="36" height="32" viewBox="0 0 40 36">
                      <rect x="2" y="2" width="36" height="32" rx="2" fill="#1e1e1e" stroke="#414141" />
                      <rect x="4" y="4" width="32" height="6" fill="rgba(255,255,255,0.3)" />
                      <rect x="4" y="28" width="32" height="4" fill="rgba(255,255,255,0.3)" />
                      <text x="20" y="22" textAnchor="middle" fill="#fff" fontSize="7">
                        {formatSize(disk.size)}
                      </text>
                    </svg>
                  </div>
                  <div style={styles.diskInfo}>
                    <div style={styles.diskName}>{disk.name}</div>
                    <div style={styles.diskDetails}>
                      <span style={styles.diskModel}>{disk.model || '-'}</span>
                      <span
                        style={{
                          ...styles.diskType,
                          backgroundColor: getTypeColor(disk.type).bg,
                          color: getTypeColor(disk.type).text,
                        }}
                      >
                        {disk.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - VDEVs */}
        <div style={styles.rightPane}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>VDEVs ({vdevs.length})</span>
            <button onClick={addVdev} style={styles.addVdevButton}>
              <Plus size={14} />
              添加
            </button>
          </div>

          <div style={styles.vdevsList}>
            {vdevs.map((vdev, vdevIndex) => (
              <div key={vdevIndex} style={styles.vdevCard}>
                <div style={styles.vdevHeader}>
                  <span style={styles.vdevTitle}>Vdev {vdevIndex + 1}</span>
                  <span style={styles.vdevCount}>
                    {vdev.length} / {minDisks}+ 硬盘
                  </span>
                  <button
                    onClick={() => removeVdev(vdevIndex)}
                    style={styles.removeVdevButton}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={styles.vdevDisks}>
                  {vdev.length === 0 ? (
                    <div style={styles.vdevEmpty}>点击左侧硬盘添加</div>
                  ) : (
                    vdev.map((disk) => (
                      <div key={disk.devname} style={styles.vdevDisk}>
                        <span style={styles.vdevDiskName}>{disk.name}</span>
                        <span style={styles.vdevDiskSize}>{formatSize(disk.size)}</span>
                        <button
                          onClick={() => removeDiskFromVdev(vdevIndex, disk.devname)}
                          style={styles.removeDiskButton}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.vdevs && (
        <div style={styles.error}>
          <X size={14} />
          {errors.vdevs}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    overflow: 'hidden',
  },
  layoutSection: {
    flexShrink: 0,
  },
  label: {
    display: 'block',
    marginBottom: 8,
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
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: colors.danger,
    flexShrink: 0,
  },
  selectionContainer: {
    flex: 1,
    display: 'flex',
    gap: 12,
    overflow: 'hidden',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  rightPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
  },
  sectionHeader: {
    padding: '10px 12px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  filters: {
    padding: 10,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: 8,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textSecondary,
  },
  searchInput: {
    width: '100%',
    padding: '8px 10px 8px 30px',
    fontSize: 13,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.background,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
  },
  filterSelect: {
    flex: 1,
    padding: '6px 8px',
    fontSize: 12,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.background,
    color: colors.text,
    cursor: 'pointer',
  },
  diskList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 8,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 24,
    color: colors.textSecondary,
    fontSize: 13,
  },
  diskCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 6,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  diskIcon: {
    flexShrink: 0,
  },
  diskInfo: {
    flex: 1,
    minWidth: 0,
  },
  diskName: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 2,
  },
  diskDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  diskModel: {
    fontSize: 11,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: 80,
  },
  diskType: {
    fontSize: 9,
    fontWeight: 600,
    padding: '2px 5px',
    borderRadius: 4,
    flexShrink: 0,
  },
  vdevsList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 8,
  },
  vdevCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  vdevHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    backgroundColor: colors.border,
  },
  vdevTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
  },
  vdevCount: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
  },
  removeVdevButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    color: colors.danger,
  },
  vdevDisks: {
    padding: 6,
    minHeight: 50,
  },
  vdevEmpty: {
    textAlign: 'center' as const,
    padding: 12,
    color: colors.textSecondary,
    fontSize: 12,
  },
  vdevDisk: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 6px',
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    marginBottom: 4,
  },
  vdevDiskName: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  vdevDiskSize: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  removeDiskButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    color: colors.textSecondary,
  },
  addVdevButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
}
