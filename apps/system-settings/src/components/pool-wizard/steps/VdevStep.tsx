/**
 * Vdev Step Component
 * Reusable component for optional vdev types (Log, Spare, Cache, Metadata, Dedup)
 * Follows DataStep UI design with split layout for disk/VDEV selection
 */

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Trash2,
  Plus,
  Search,
  X,
  HardDrive,
  Layers,
} from 'lucide-react'
import { VDevType, CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { DetailsDisk, getDiskTypeLabel } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { usePoolWizardStore, LAYOUT_OPTIONS } from '../store/poolWizardStore'
import { colors } from '@apps/system-settings/styles/theme'
import { DiskIcon } from '../components/DiskIcon'
import { formatBytes } from '@truenas/utils/storage.utils'

interface VdevStepProps {
  type: VDevType.Log | VDevType.Spare | VDevType.Cache | VDevType.Special | VDevType.Dedup
  title: string
  description: string
  errors: Record<string, string>
  warnings: Record<string, string>
}

// 检查 VDEV 中磁盘大小是否一致（使用 10MB 阈值，与 webui 一致）
const MiB = 1024 * 1024
function hasMixedDiskSizes(disks: DetailsDisk[]): boolean {
  if (disks.length <= 1) return false
  const firstDisk = disks[0]
  const threshold = 10 * MiB
  for (const disk of disks) {
    if (disk.size < firstDisk.size + threshold && disk.size > firstDisk.size - threshold) {
      continue
    }
    return true
  }
  return false
}

// 格式化 GiB 单位（用于 VDEV 容量显示）
const formatGibiBytes = (bytes: number): string => {
  if (typeof bytes !== 'number' || bytes <= 0 || isNaN(bytes)) {
    return 'Unknown'
  }
  const gib = bytes / (1024 * 1024 * 1024)
  if (gib >= 1024) {
    return `${(gib / 1024).toFixed(1)} TiB`
  }
  return `${gib.toFixed(1)} GiB`
}

// 计算 VDEV 的原始容量（根据布局类型）
const calculateVdevRawCapacity = (
  disks: DetailsDisk[],
  layout: CreateVdevLayout | null
): number => {
  if (disks.length === 0 || !layout) return 0

  const totalSize = disks.reduce((total, disk) => total + (disk.size || 0), 0)
  const diskCount = disks.length

  switch (layout) {
    case CreateVdevLayout.Stripe:
      return totalSize
    case CreateVdevLayout.Mirror: {
      const smallestDiskMirror = disks.reduce((min, disk) =>
        (disk.size || 0) < (min.size || 0) ? disk : min, disks[0])
      return smallestDiskMirror?.size || 0
    }
    case CreateVdevLayout.Raidz1:
      return ((disks.reduce((min, d) => (d.size || 0) < (min.size || 0) ? d : min, disks[0])).size || 0) * (diskCount - 1)
    case CreateVdevLayout.Raidz2:
      return ((disks.reduce((min, d) => (d.size || 0) < (min.size || 0) ? d : min, disks[0])).size || 0) * (diskCount - 2)
    case CreateVdevLayout.Raidz3:
      return ((disks.reduce((min, d) => (d.size || 0) < (min.size || 0) ? d : min, disks[0])).size || 0) * (diskCount - 3)
    case CreateVdevLayout.Draid1:
      return ((disks.reduce((min, d) => (d.size || 0) < (min.size || 0) ? d : min, disks[0])).size || 0) * (diskCount - 1)
    case CreateVdevLayout.Draid2:
      return ((disks.reduce((min, d) => (d.size || 0) < (min.size || 0) ? d : min, disks[0])).size || 0) * (diskCount - 2)
    case CreateVdevLayout.Draid3:
      return ((disks.reduce((min, d) => (d.size || 0) < (min.size || 0) ? d : min, disks[0])).size || 0) * (diskCount - 3)
    default:
      return totalSize
  }
}

export function VdevStep({ type, title, description, errors, warnings }: VdevStepProps) {
  const {
    topology,
    unusedDisks,
    setLayout,
    setManualDisks,
  } = usePoolWizardStore()

  const category = topology[type]
  const allowedLayouts = LAYOUT_OPTIONS[type]
  const isSingleVdev = type === VDevType.Spare || type === VDevType.Cache

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DiskType | ''>('')
  const [sizeFilter, setSizeFilter] = useState<number | ''>('')

  // Drag and drop state
  const [draggedDisk, setDraggedDisk] = useState<DetailsDisk | null>(null)
  const [dragOverVdevIndex, setDragOverVdevIndex] = useState<number | null>(null)
  const [isDraggingFromVdev, setIsDraggingFromVdev] = useState(false)

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, disk: DetailsDisk) => {
    setDraggedDisk(disk)
    e.dataTransfer.setData('disk', JSON.stringify(disk))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedDisk(null)
    setDragOverVdevIndex(null)
    setIsDraggingFromVdev(false)
  }

  const handleDragOver = (e: React.DragEvent, vdevIndex: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverVdevIndex(vdevIndex)
  }

  const handleDragLeave = () => {
    setDragOverVdevIndex(null)
  }

  const handleDrop = (e: React.DragEvent, vdevIndex: number) => {
    e.preventDefault()
    setDragOverVdevIndex(null)
    try {
      const diskData = e.dataTransfer.getData('disk')
      if (diskData) {
        const disk = JSON.parse(diskData) as DetailsDisk
        addDiskToVdev(disk, vdevIndex)
      }
    } catch {
      // Invalid data
    }
    setDraggedDisk(null)
    setIsDraggingFromVdev(false)
  }

  const handleDropOnAvailable = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverVdevIndex(null)
    try {
      const vdevDiskData = e.dataTransfer.getData('vdevDisk')
      if (vdevDiskData) {
        const { vdevIndex, disk } = JSON.parse(vdevDiskData) as { vdevIndex: number; disk: DetailsDisk }
        removeDiskFromVdev(vdevIndex, disk.devname)
      }
    } catch {
      // Invalid data
    }
    setDraggedDisk(null)
    setIsDraggingFromVdev(false)
  }

  // Calculate used disks
  const usedDisks = useMemo(() => {
    const used = new Set<string>()
    Object.entries(topology).forEach(([_t, cat]) => {
      cat.vdevs.forEach((vdev) => {
        vdev.forEach((disk) => used.add(disk.devname))
      })
    })
    return used
  }, [topology])

  // Filter disks
  const availableDisks = useMemo(() => {
    return unusedDisks.filter((d) => !usedDisks.has(d.devname))
  }, [unusedDisks, usedDisks])

  const filteredDisks = useMemo(() => {
    return availableDisks.filter((disk) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matches =
          disk.name?.toLowerCase().includes(query) ||
          disk.model?.toLowerCase().includes(query) ||
          disk.serial?.toLowerCase().includes(query)
        if (!matches) return false
      }
      if (typeFilter && disk.type !== typeFilter) return false
      if (sizeFilter && disk.size !== sizeFilter) return false
      return true
    })
  }, [availableDisks, searchQuery, typeFilter, sizeFilter])

  const diskSizes = useMemo(() => {
    const sizes = new Set<number>()
    availableDisks.forEach((disk) => {
      if (disk.size) sizes.add(disk.size)
    })
    return Array.from(sizes).sort((a, b) => a - b)
  }, [availableDisks])

  // VDEVs state
  const [vdevs, setVdevs] = useState<DetailsDisk[][]>(() => {
    return category.vdevs.length > 0 ? category.vdevs : []
  })

  // Sync with store
  const prevCategoryVdevsRef = useRef<string>(JSON.stringify(category.vdevs))

  useEffect(() => {
    const currentCategoryVdevsStr = JSON.stringify(category.vdevs)
    const prevCategoryVdevsStr = prevCategoryVdevsRef.current

    if (currentCategoryVdevsStr === prevCategoryVdevsStr) {
      return
    }

    prevCategoryVdevsRef.current = currentCategoryVdevsStr

    if (category.vdevs.length === 0 && vdevs.length > 0) {
      setVdevs([])
    } else if (category.vdevs.length > 0) {
      const localVdevsStr = JSON.stringify(vdevs)
      if (currentCategoryVdevsStr !== localVdevsStr) {
        setVdevs(category.vdevs)
      }
    }
  }, [category.vdevs, vdevs])

  const addVdev = () => {
    const newVdevs = [...vdevs, []]
    setVdevs(newVdevs)
    setManualDisks(type, newVdevs)
  }

  const removeVdev = (index: number) => {
    const newVdevs = [...vdevs]
    newVdevs.splice(index, 1)
    setVdevs(newVdevs)
    setManualDisks(type, newVdevs)
  }

  const addDiskToVdev = (disk: DetailsDisk, vdevIndex: number) => {
    if (vdevs[vdevIndex]?.some((d) => d.devname === disk.devname)) {
      return
    }
    const newVdevs = [...vdevs]
    newVdevs[vdevIndex] = [...newVdevs[vdevIndex], disk]
    setVdevs(newVdevs)
    setManualDisks(type, newVdevs)
  }

  const removeDiskFromVdev = (vdevIndex: number, diskDevname: string) => {
    const newVdevs = [...vdevs]
    newVdevs[vdevIndex] = newVdevs[vdevIndex].filter((d) => d.devname !== diskDevname)
    setVdevs(newVdevs)
    setManualDisks(type, newVdevs)
  }

  const handleLayoutChange = (layout: CreateVdevLayout | null) => {
    setLayout(type, layout)
    // Clear vdevs when layout changes
    setVdevs([])
    setManualDisks(type, [])
  }

  const handleClear = () => {
    setLayout(type, null)
    setVdevs([])
    setManualDisks(type, [])
  }

  return (
    <div style={styles.container}>
      {/* 气泡框 1: 标题和描述 */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <div style={styles.bubbleTitleRow}>
            <h3 style={styles.title}>{title}</h3>
          </div>
          <p style={styles.description}>{description}</p>
        </div>
      </div>

      {/* 警告信息 */}
      {warnings.layout && (
        <div style={styles.warningBubble}>
          <AlertCircle size={18} color={colors.warning} />
          <span>{warnings.layout}</span>
        </div>
      )}

      {/* 气泡框 2: 布局选择 */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <div style={styles.bubbleTitleRow}>
            <Layers size={14} color={colors.primary} />
            <span style={styles.bubbleTitle}>存储布局</span>
          </div>
          {category.layout && (
            <button onClick={handleClear} style={styles.clearButtonSmall}>
              <Trash2 size={12} />
              清除
            </button>
          )}
        </div>
        <div style={styles.bubbleContent}>
          <select
            value={category.layout ?? ''}
            onChange={(e) => handleLayoutChange(e.target.value ? e.target.value as CreateVdevLayout : null)}
            style={styles.layoutSelect}
          >
            <option value="">选择存储布局...</option>
            {allowedLayouts.map((layout) => (
              <option key={layout} value={layout}>
                {layout}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 磁盘分配 - 左右分栏 (仅在选择布局后显示) */}
      {category.layout && (
        <div style={styles.splitCard}>
          {/* 左侧：可用硬盘 */}
          <div style={styles.leftPane}>
            <div style={styles.paneHeader}>
              <HardDrive size={14} color={colors.primary} />
              <span style={styles.paneTitle}>可用硬盘</span>
              <span style={styles.diskCountBadge}>{filteredDisks.length}</span>
            </div>

            {/* 筛选器 */}
            <div style={styles.filtersRow}>
              <div style={styles.searchContainer}>
                <Search size={12} style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DiskType | '')}
                style={styles.filterSelect}
              >
                <option value="">类型</option>
                <option value={DiskType.Hdd}>HDD</option>
                <option value={DiskType.Ssd}>SSD</option>
                <option value={DiskType.Nvme}>NVMe</option>
              </select>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value ? Number(e.target.value) : '')}
                style={styles.filterSelect}
              >
                <option value="">容量</option>
                {diskSizes.map((size) => (
                  <option key={size} value={size}>{formatBytes(size)}</option>
                ))}
              </select>
            </div>

            {/* 硬盘列表 */}
            <div
              style={{
                ...styles.diskList,
                ...(isDraggingFromVdev ? styles.diskListDragOver : {}),
              }}
              onDragOver={(e) => {
                if (isDraggingFromVdev) {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }
              }}
              onDrop={handleDropOnAvailable}
            >
              {filteredDisks.length === 0 ? (
                <div style={styles.emptyState}>
                  <HardDrive size={28} color={colors.border} />
                  <span>没有可用硬盘</span>
                </div>
              ) : (
                <div style={styles.diskListContainer}>
                  {filteredDisks.map((disk) => (
                    <DiskCard
                      key={disk.devname}
                      disk={disk}
                      isDragging={draggedDisk?.devname === disk.devname}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：VDEVs */}
          <div style={styles.rightPane}>
            <div style={styles.paneHeader}>
              <Layers size={14} color={colors.primary} />
              <span style={styles.paneTitle}>VDEVs</span>
              <span style={styles.diskCountBadge}>{vdevs.length}</span>
              <div style={styles.headerSpacer} />
              {!isSingleVdev && (
                <button
                  onClick={addVdev}
                  style={styles.addVdevButton}
                >
                  <Plus size={12} />
                  新建
                </button>
              )}
            </div>

            <div style={styles.vdevsList}>
              {vdevs.length === 0 ? (
                <div style={styles.vdevEmptyState}>
                  <Layers size={32} color={colors.border} />
                  <span style={styles.vdevEmptyTitle}>创建 VDEV</span>
                  <span style={styles.vdevEmptyHint}>从左侧拖动硬盘到此处</span>
                </div>
              ) : (
                vdevs.map((vdev, vdevIndex) => (
                  <div
                    key={vdevIndex}
                    style={{
                      ...styles.vdevCard,
                      ...(dragOverVdevIndex === vdevIndex ? styles.vdevCardDragOver : {}),
                    }}
                    onDragOver={(e) => handleDragOver(e, vdevIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, vdevIndex)}
                  >
                    <div style={styles.vdevHeader}>
                      <span style={styles.vdevTitle}>
                        VDEV #{vdevIndex + 1}
                      </span>
                      <span style={styles.vdevDiskCount}>
                        {vdev.length} 块
                      </span>
                      {vdev.length > 0 && (
                        <span style={styles.vdevCapacity}>
                          {formatGibiBytes(calculateVdevRawCapacity(vdev, category.layout))}
                        </span>
                      )}
                      {!isSingleVdev && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeVdev(vdevIndex)
                          }}
                          style={styles.removeVdevButton}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div style={styles.vdevDisks}>
                      {vdev.length === 0 ? (
                        <div style={dragOverVdevIndex === vdevIndex ? styles.vdevEmptyDragOver : styles.vdevEmpty}>
                          <HardDrive size={20} color={colors.textSecondary} />
                          <span>拖动硬盘到此处</span>
                        </div>
                      ) : (
                        <div style={styles.vdevDisksGrid}>
                          {vdev.map((disk) => (
                            <div
                              key={disk.devname}
                              className="vdev-disk-card"
                              style={styles.vdevDiskCard}
                              draggable
                              onDragStart={(e) => {
                                setIsDraggingFromVdev(true)
                                e.dataTransfer.setData('vdevDisk', JSON.stringify({ vdevIndex, disk }))
                                e.dataTransfer.setData('disk', JSON.stringify(disk))
                              }}
                            >
                              <DiskIcon disk={disk} width={36} height={40} />
                              <div style={styles.vdevDiskInfo}>
                                <span style={styles.vdevDiskName}>{disk.devname}</span>
                                <span style={styles.vdevDiskSize}>{formatBytes(disk.size)}</span>
                              </div>
                              <button
                                type="button"
                                className="vdev-remove-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeDiskFromVdev(vdevIndex, disk.devname)
                                }}
                                style={styles.vdevRemoveDiskBtn}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 混合磁盘大小警告 */}
                    {vdev.length >= 2 && hasMixedDiskSizes(vdev) && (
                      <div style={styles.vdevWarning}>
                        <AlertTriangle size={12} color={colors.warning} />
                        <span>在 vdev 中混合不同大小的磁盘是不建议的</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {errors.vdevs && (
        <div style={styles.errorBubble}>
          <AlertCircle size={16} />
          <span>{errors.vdevs}</span>
        </div>
      )}

      <style>{`
        .disk-card:hover {
          box-shadow: 0 0 0 2px ${colors.primary}40;
        }
        .vdev-disk-card:hover {
          border-color: ${colors.primary}60 !important;
        }
        .vdev-disk-card:hover .vdev-remove-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}

// Disk Card Component
function DiskCard({
  disk,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  disk: DetailsDisk
  isDragging: boolean
  onDragStart: (e: React.DragEvent, disk: DetailsDisk) => void
  onDragEnd: () => void
}) {
  const typeColors: Record<DiskType, { bg: string; text: string }> = {
    [DiskType.Hdd]: { bg: '#e3f2fd', text: '#1976d2' },
    [DiskType.Ssd]: { bg: '#e8f5e9', text: '#388e3c' },
    [DiskType.Nvme]: { bg: '#fff3e0', text: '#f57c00' },
    [DiskType.Usb]: { bg: '#f5f5f5', text: '#666' },
    [DiskType.Hda]: { bg: '#f5f5f5', text: '#666' },
  }
  const typeColor = typeColors[disk.type] || typeColors[DiskType.Hdd]

  return (
    <div
      className="disk-card"
      draggable
      onDragStart={(e) => onDragStart(e, disk)}
      onDragEnd={onDragEnd}
      style={{
        ...diskCardStyles.card,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div style={diskCardStyles.iconContainer}>
        <DiskIcon disk={disk} width={40} height={45} />
      </div>
      <div style={diskCardStyles.infoContainer}>
        <div style={diskCardStyles.nameSizeRow}>
          <span style={diskCardStyles.diskName}>{disk.devname}</span>
          <span style={diskCardStyles.size}>{formatBytes(disk.size || 0)}</span>
        </div>
        <div style={diskCardStyles.detailsRow}>
          <span
            style={{
              ...diskCardStyles.typeBadge,
              backgroundColor: typeColor.bg,
              color: typeColor.text,
            }}
          >
            {getDiskTypeLabel(disk.type)}
          </span>
          <span style={diskCardStyles.bus}>{disk.bus}</span>
          <span style={diskCardStyles.divider}>|</span>
          <span style={diskCardStyles.model} title={disk.model}>
            {disk.model || '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

const diskCardStyles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'grab',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  },
  iconContainer: {
    flexShrink: 0,
  },
  infoContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  nameSizeRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  diskName: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
    fontFamily: 'monospace',
  },
  size: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  detailsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
  },
  typeBadge: {
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  bus: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  divider: {
    color: colors.border,
  },
  model: {
    color: colors.textSecondary,
    fontSize: 11,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

// Preset configurations for each vdev type
export function LogStep(props: Omit<VdevStepProps, 'type' | 'title' | 'description'>) {
  return (
    <VdevStep
      type={VDevType.Log}
      title="日志 Vdev"
      description="配置池的日志设备（可选）"
      {...props}
    />
  )
}

export function SpareStep(props: Omit<VdevStepProps, 'type' | 'title' | 'description'>) {
  return (
    <VdevStep
      type={VDevType.Spare}
      title="备用 Vdev"
      description="配置池的热备设备（可选）"
      {...props}
    />
  )
}

export function CacheStep(props: Omit<VdevStepProps, 'type' | 'title' | 'description'>) {
  return (
    <VdevStep
      type={VDevType.Cache}
      title="缓存 Vdev"
      description="配置池的缓存设备（可选）"
      {...props}
    />
  )
}

export function MetadataStep(props: Omit<VdevStepProps, 'type' | 'title' | 'description'>) {
  return (
    <VdevStep
      type={VDevType.Special}
      title="元数据 Vdev"
      description="配置池的特殊元数据设备（可选）"
      {...props}
    />
  )
}

export function DedupStep(props: Omit<VdevStepProps, 'type' | 'title' | 'description'>) {
  return (
    <VdevStep
      type={VDevType.Dedup}
      title="去重 Vdev"
      description="配置池的去重表设备（可选）"
      {...props}
    />
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  // 气泡框基础样式
  bubbleCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  bubbleHeader: {
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  bubbleTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: colors.text,
  },
  description: {
    margin: '6px 0 0 0',
    fontSize: 14,
    color: colors.textSecondary,
  },
  bubbleContent: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  // 布局选择
  layoutSelect: {
    width: '100%',
    padding: '10px 36px 10px 12px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    backgroundColor: colors.background,
    color: colors.text,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8e93' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    boxSizing: 'border-box',
  },

  // 清除按钮
  clearButtonSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    backgroundColor: `${colors.danger}10`,
    color: colors.danger,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },

  // 警告气泡
  warningBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    backgroundColor: `${colors.warning}15`,
    borderRadius: 12,
    border: `1px solid ${colors.warning}30`,
    fontSize: 14,
    color: colors.warning,
  },

  // 错误气泡
  errorBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    backgroundColor: `${colors.danger}10`,
    borderRadius: 12,
    border: `1px solid ${colors.danger}30`,
    fontSize: 14,
    color: colors.danger,
  },

  // 分栏卡片
  splitCard: {
    flex: 1,
    display: 'flex',
    gap: 12,
    minHeight: 0,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },

  // 左侧面板
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background,
    borderRadius: 10,
    margin: 8,
    overflow: 'hidden',
    minWidth: 0,
  },
  paneHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  paneTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  diskCountBadge: {
    padding: '1px 6px',
    backgroundColor: `${colors.primary}15`,
    color: colors.primary,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
  },
  headerSpacer: {
    flex: 1,
  },

  // 筛选器
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    flexShrink: 0,
    borderBottom: `1px solid ${colors.border}`,
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
  },
  searchIcon: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textSecondary,
  },
  searchInput: {
    width: '100%',
    padding: '8px 8px 8px 28px',
    fontSize: 13,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.cardBg,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box',
  },
  filterSelect: {
    padding: '6px 8px',
    fontSize: 12,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.cardBg,
    color: colors.text,
    cursor: 'pointer',
    outline: 'none',
  },

  // 硬盘列表
  diskList: {
    flex: 1,
    overflow: 'auto',
    padding: 8,
    boxSizing: 'border-box',
  },
  diskListDragOver: {
    backgroundColor: `${colors.danger}08`,
    outline: `2px dashed ${colors.danger}40`,
    outlineOffset: -8,
  },
  diskListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    color: colors.textSecondary,
    fontSize: 12,
  },

  // 右侧面板
  rightPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background,
    borderRadius: 10,
    margin: 8,
    overflow: 'hidden',
    minWidth: 0,
  },
  vdevsList: {
    flex: 1,
    overflowY: 'auto',
    padding: 6,
    boxSizing: 'border-box',
  },
  vdevEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    textAlign: 'center',
  },
  vdevEmptyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  vdevEmptyHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // VDEV 卡片
  vdevCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    transition: 'all 0.15s ease',
    border: `2px solid ${colors.border}`,
    boxSizing: 'border-box',
  },
  vdevCardDragOver: {
    border: `2px solid ${colors.primary}`,
    backgroundColor: `${colors.primary}08`,
  },
  vdevHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    backgroundColor: `${colors.border}20`,
    borderBottom: `1px solid ${colors.border}30`,
  },
  vdevTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
  },
  vdevCapacity: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: 500,
    backgroundColor: `${colors.primary}10`,
    padding: '1px 6px',
    borderRadius: 4,
  },
  vdevDiskCount: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  removeVdevButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    color: colors.textSecondary,
    transition: 'all 0.15s ease',
  },
  vdevDisks: {
    padding: 8,
    minHeight: 70,
    boxSizing: 'border-box',
  },
  vdevDisksGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 54,
    alignContent: 'flex-start',
  },
  vdevDiskCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    cursor: 'grab',
    transition: 'all 0.15s ease',
    minHeight: 72,
  },
  vdevDiskInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  vdevDiskName: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
    fontFamily: 'monospace',
  },
  vdevDiskSize: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'system-ui, sans-serif',
  },
  vdevRemoveDiskBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  vdevEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
    color: colors.textSecondary,
    fontSize: 11,
    border: `2px dashed ${colors.border}`,
    borderRadius: 8,
    minHeight: 54,
    boxSizing: 'border-box',
  },
  vdevEmptyDragOver: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
    color: colors.primary,
    fontSize: 11,
    fontWeight: 500,
    border: `2px dashed ${colors.primary}`,
    borderRadius: 8,
    backgroundColor: `${colors.primary}08`,
  },
  vdevWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    fontSize: 11,
    color: colors.warning,
    borderTop: `1px solid ${colors.border}30`,
  },

  // 添加按钮
  addVdevButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 10px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    transition: 'all 0.15s ease',
  },
}
