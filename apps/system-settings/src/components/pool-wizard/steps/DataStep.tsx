/**
 * Data Step Component
 * Data vdev configuration using manual disk selection UI
 * Redesigned with compact, efficient layout
 */

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, Trash2, Search, X, HardDrive, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { VDevType, CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { DetailsDisk, getDiskTypeLabel, getDiskBusLabel } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { usePoolWizardStore, LAYOUT_OPTIONS } from '../store/poolWizardStore'
import { minDisksPerLayout } from '../store/poolWizardStore'
import { colors } from '@apps/system-settings/styles/theme'
import { DiskIcon } from '../components/DiskIcon'
import { formatBytes } from '@truenas/utils/storage.utils'

interface DataStepProps {
  errors: Record<string, string>
  warnings: Record<string, string>
}

// 布局选项中文标签和描述
const LAYOUT_INFO: Record<CreateVdevLayout, { label: string; description: string; badge: string }> = {
  [CreateVdevLayout.Stripe]: {
    label: 'Stripe',
    description: '无冗余，数据分散存储在所有磁盘上',
    badge: '高性能',
  },
  [CreateVdevLayout.Mirror]: {
    label: 'Mirror',
    description: '数据完全镜像到多个磁盘，提供最高保护',
    badge: '高可靠',
  },
  [CreateVdevLayout.Raidz1]: {
    label: 'RAIDZ1',
    description: '单奇偶校验，相当于带一块冗余的 RAID5',
    badge: '推荐',
  },
  [CreateVdevLayout.Raidz2]: {
    label: 'RAIDZ2',
    description: '双奇偶校验，可同时损坏2块磁盘而不丢数据',
    badge: '高冗余',
  },
  [CreateVdevLayout.Raidz3]: {
    label: 'RAIDZ3',
    description: '三奇偶校验，可同时损坏3块磁盘',
    badge: '超高冗余',
  },
  [CreateVdevLayout.Draid1]: {
    label: 'dRAID1',
    description: '分布式奇偶校验的镜像，数据分布存储',
    badge: '分布式',
  },
  [CreateVdevLayout.Draid2]: {
    label: 'dRAID2',
    description: '分布式双奇偶校验，提供双磁盘冗余',
    badge: '分布式',
  },
  [CreateVdevLayout.Draid3]: {
    label: 'dRAID3',
    description: '分布式三奇偶校验，提供三磁盘冗余',
    badge: '分布式',
  },
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
      // MIRROR uses the smallest disk's size
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

// 检查 VDEV 中磁盘大小是否一致（使用 10MB 阈值，与 webui 一致）
const MiB = 1024 * 1024
const hasMixedDiskSizes = (disks: DetailsDisk[]): boolean => {
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

export function DataStep({ errors }: DataStepProps) {
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
    Object.entries(topology).forEach(([_type, cat]) => {
      cat.vdevs.forEach((vdev) => {
        vdev.forEach((disk) => used.add(disk.devname))
      })
    })
    return used
  }, [topology])

  // Filter disks
  const availableDisks = useMemo(() => {
    return unusedDisks.filter((d) => {
      if (usedDisks.has(d.devname)) return false
      if (!allowNonUniqueSerialDisks && d.duplicate_serial && d.duplicate_serial.length > 0) return false
      return true
    })
  }, [unusedDisks, usedDisks, allowNonUniqueSerialDisks])

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

  // VDEVs state - 初始化时同步 store 中的 vdevs
  const [vdevs, setVdevs] = useState<DetailsDisk[][]>(() => {
    return category.vdevs.length > 0 ? category.vdevs : []
  })

  // 使用 ref 保存上一次的 category.vdevs 值，用于检测 category.vdevs 的真实变化
  const prevCategoryVdevsRef = useRef<string>(JSON.stringify(category.vdevs))

  // 同步 category.vdevs 到本地 vdevs 状态
  // 解决步骤返回时 store 与本地不同步的问题，以及布局切换时 category.vdevs 被清空的问题
  useEffect(() => {
    const currentCategoryVdevsStr = JSON.stringify(category.vdevs)
    const prevCategoryVdevsStr = prevCategoryVdevsRef.current

    // 只有当 category.vdevs 实际发生变化时才处理
    if (currentCategoryVdevsStr === prevCategoryVdevsStr) {
      return
    }

    // 更新保存的值
    prevCategoryVdevsRef.current = currentCategoryVdevsStr

    // 如果 category.vdevs 被重置为空（布局切换），清空本地 vdevs
    if (category.vdevs.length === 0 && vdevs.length > 0) {
      setVdevs([])
    }
    // 如果 category.vdevs 有数据且与本地 vdevs 不同步（步骤返回场景），以 store 为准
    else if (category.vdevs.length > 0) {
      const localVdevsStr = JSON.stringify(vdevs)
      if (currentCategoryVdevsStr !== localVdevsStr) {
        setVdevs(category.vdevs)
      }
    }
  }, [category.vdevs, vdevs])

  const addVdev = () => {
    const newVdevs = [...vdevs, []]
    setVdevs(newVdevs)
    setManualDisks(VDevType.Data, newVdevs)
  }

  const removeVdev = (index: number) => {
    const newVdevs = [...vdevs]
    newVdevs.splice(index, 1)
    setVdevs(newVdevs)
    setManualDisks(VDevType.Data, newVdevs)
  }

  const addDiskToVdev = (disk: DetailsDisk, vdevIndex: number) => {
    // 检查硬盘是否已在目标VDEV中，避免重复添加
    if (vdevs[vdevIndex]?.some((d) => d.devname === disk.devname)) {
      return
    }
    const newVdevs = [...vdevs]
    newVdevs[vdevIndex] = [...newVdevs[vdevIndex], disk]
    setVdevs(newVdevs)
    setManualDisks(VDevType.Data, newVdevs)
  }

  const removeDiskFromVdev = (vdevIndex: number, diskDevname: string) => {
    const newVdevs = [...vdevs]
    newVdevs[vdevIndex] = newVdevs[vdevIndex].filter((d) => d.devname !== diskDevname)
    setVdevs(newVdevs)
    setManualDisks(VDevType.Data, newVdevs)
  }

  const handleLayoutChange = (layout: CreateVdevLayout | null) => {
    setLayout(VDevType.Data, layout)
  }

  const _minDisks = minDisksPerLayout[category.layout ?? CreateVdevLayout.Stripe] ?? 1
  const currentLayoutInfo = category.layout ? LAYOUT_INFO[category.layout] : null

  return (
    <div style={styles.container}>
      {/* 标题气泡框 */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <div style={styles.bubbleTitleRow}>
            <h3 style={styles.title}>数据 Vdev</h3>
          </div>
          <p style={styles.description}>配置池的数据存储设备（必填）</p>
        </div>
      </div>

      {/* 存储布局选择 */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <div style={styles.bubbleTitleRow}>
            <Layers size={14} color={colors.primary} />
            <span style={styles.bubbleTitle}>存储布局</span>
          </div>
        </div>
        <div style={styles.bubbleContent}>
          <select
            value={category.layout ?? ''}
            onChange={(e) => handleLayoutChange(e.target.value ? e.target.value as CreateVdevLayout : null)}
            style={styles.layoutSelect}
          >
            <option value="">选择存储布局...</option>
            {allowedLayouts.map((layout) => {
              const info = LAYOUT_INFO[layout]
              return (
                <option key={layout} value={layout}>
                  {info.label} - {info.description} (最少{minDisksPerLayout[layout]}块)
                </option>
              )
            })}
          </select>
          {currentLayoutInfo && (
            <div style={styles.layoutInfoPill}>
              <CheckCircle2 size={12} color={colors.primary} />
              <span style={styles.layoutBadge}>{currentLayoutInfo.badge}</span>
              <span style={styles.layoutDivider}>|</span>
              <span style={styles.layoutDesc}>{currentLayoutInfo.description}</span>
            </div>
          )}
          {errors.layout && (
            <div style={styles.errorRow}>
              <AlertTriangle size={12} />
              <span>{errors.layout}</span>
            </div>
          )}
        </div>
      </div>

      {/* 磁盘分配 - 左右分栏 */}
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
                <option key={size} value={size}>{formatSize(size)}</option>
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
            <button
              onClick={addVdev}
              disabled={!category.layout}
              style={{
                ...styles.addVdevButton,
                ...(category.layout ? {} : styles.addVdevButtonDisabled),
              }}
            >
              <Plus size={12} />
              新建
            </button>
          </div>

          <div style={styles.vdevsList}>
            {vdevs.length === 0 ? (
              <button
                type="button"
                onClick={() => category.layout && addVdev()}
                disabled={!category.layout}
                style={{
                  ...styles.vdevEmptyState,
                  ...(category.layout ? styles.vdevEmptyStateClickable : {}),
                  ...(!category.layout ? styles.vdevEmptyStateDisabled : {}),
                }}
              >
                <Layers size={32} color={category.layout ? colors.border : colors.textSecondary} />
                <span style={styles.vdevEmptyTitle}>
                  {!category.layout ? '请先选择布局' : '创建第一个 VDEV'}
                </span>
                <span style={styles.vdevEmptyHint}>
                  {!category.layout ? '在上方选择存储布局以开始' : '点击此处添加磁盘组'}
                </span>
              </button>
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
                      {currentLayoutInfo?.label ?? 'VDEV'} #{vdevIndex + 1}
                    </span>
                    <span style={styles.vdevDiskCount}>
                      {vdev.length} 块 {vdev.length < _minDisks && <span style={styles.vdevError}>(需要 {_minDisks} 块)</span>}
                    </span>
                    {vdev.length > 0 && (
                      <span style={styles.vdevCapacity}>
                        {formatGibiBytes(calculateVdevRawCapacity(vdev, category.layout))}
                      </span>
                    )}
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

// Disk Card Component - TrueNAS SCALE style
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
      {/* Left: Disk Icon */}
      <div style={diskCardStyles.iconContainer}>
        <DiskIcon disk={disk} width={40} height={45} />
      </div>

      {/* Middle: Disk Info */}
      <div style={diskCardStyles.infoContainer}>
        {/* Row 1: Name + Size */}
        <div style={diskCardStyles.nameSizeRow}>
          <span style={diskCardStyles.diskName}>{disk.devname}</span>
          <span style={diskCardStyles.size}>{formatSize(disk.size || 0)}</span>
        </div>
        {/* Row 2: Details */}
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
          <span style={diskCardStyles.bus}>{getDiskBusLabel(disk.bus)}</span>
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
  layoutInfoPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    fontSize: 12,
    color: colors.primary,
    border: `1px solid ${colors.primary}20`,
  },
  layoutBadge: {
    fontWeight: 600,
  },
  layoutDivider: {
    color: colors.border,
  },
  layoutDesc: {
    color: colors.text,
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: `${colors.danger}10`,
    borderRadius: 8,
    fontSize: 12,
    color: colors.danger,
    border: `1px solid ${colors.danger}30`,
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
    display: 'flex',
    flexDirection: 'column',
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
    cursor: 'default',
    border: 'none',
  },
  vdevEmptyStateClickable: {
    cursor: 'pointer',
    backgroundColor: 'transparent',
    transition: 'all 0.15s ease',
    flex: 1,
    justifyContent: 'center',
  },
  vdevEmptyStateDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
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
  vdevError: {
    color: colors.danger,
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
  addVdevButtonDisabled: {
    backgroundColor: colors.border,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
}
