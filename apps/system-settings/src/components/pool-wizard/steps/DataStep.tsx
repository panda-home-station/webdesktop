/**
 * Data Step Component
 * Data vdev configuration using manual disk selection UI
 * Redesigned with modern, premium aesthetics
 */

import React, { useState, useMemo } from 'react'
import { Plus, Trash2, Search, X, HardDrive, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { VDevType, CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { DetailsDisk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { usePoolWizardStore, LAYOUT_OPTIONS } from '../store/poolWizardStore'
import { minDisksPerLayout } from '../store/poolWizardStore'
import { colors } from '@apps/system-settings/styles/theme'
import { DiskIcon } from '../components/DiskIcon'

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
    case CreateVdevLayout.Mirror:
      return disks[0]?.size || 0
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

// 检查 VDEV 中磁盘大小是否一致
const hasMixedDiskSizes = (disks: DetailsDisk[]): boolean => {
  if (disks.length <= 1) return false
  const firstSize = disks[0].size
  return disks.some((disk) => disk.size !== firstSize)
}

// VDEV 提示信息类型
interface VdevTip {
  message: string
  isError: boolean
}

// 获取 VDEV 提示信息
const getVdevTips = (
  vdev: DetailsDisk[],
  layout: CreateVdevLayout | null,
  minDisks: number
): VdevTip[] => {
  const tips: VdevTip[] = []
  if (!layout) return tips
  if (vdev.length < minDisks) {
    tips.push({
      message: `至少需要 ${minDisks} 块硬盘，当前 ${vdev.length} 块`,
      isError: true,
    })
  }
  if (vdev.length >= 2 && hasMixedDiskSizes(vdev)) {
    tips.push({
      message: '不建议在 vdev 中混合不同大小的磁盘',
      isError: false,
    })
  }
  return tips
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

  // Drag and drop state
  const [draggedDisk, setDraggedDisk] = useState<DetailsDisk | null>(null)
  const [dragOverVdevIndex, setDragOverVdevIndex] = useState<number | null>(null)
  const [isDraggingFromVdev, setIsDraggingFromVdev] = useState(false)

  // Drag handlers for available disks
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

  // Drop handlers for vdev areas
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

  // Handle drop on left pane to remove disk from vdev
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

  // Calculate available disks for this category
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
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matches =
          disk.name?.toLowerCase().includes(query) ||
          disk.model?.toLowerCase().includes(query) ||
          disk.serial?.toLowerCase().includes(query)
        if (!matches) return false
      }
      if (typeFilter && disk.type !== typeFilter) {
        return false
      }
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

  // VDEVs: array of vdevs
  const [vdevs, setVdevs] = useState<DetailsDisk[][]>(() => {
    return category.vdevs.length > 0 ? category.vdevs : []
  })

  // Add a new empty VDEV
  const addVdev = () => {
    setVdevs([...vdevs, []])
  }

  // Remove a VDEV
  const removeVdev = (index: number) => {
    const newVdevs = [...vdevs]
    newVdevs.splice(index, 1)
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
  const _minDisks = minDisksPerLayout[category.layout ?? CreateVdevLayout.Stripe] ?? 1

  const currentLayoutInfo = category.layout ? LAYOUT_INFO[category.layout] : null

  return (
    <div style={styles.container}>
      {/* 气泡框 1: 存储布局选择 */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <div style={styles.bubbleTitleRow}>
            <Layers size={16} color={colors.primary} />
            <span style={styles.bubbleTitle}>存储布局</span>
          </div>
        </div>
        <div style={styles.bubbleContent}>
          <select
            value={category.layout ?? ''}
            onChange={(e) => handleLayoutChange(e.target.value ? e.target.value as CreateVdevLayout : null)}
            style={styles.iOSSelect}
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
              <CheckCircle2 size={14} color={colors.primary} />
              <span>{currentLayoutInfo.badge}</span>
              <span style={styles.layoutInfoDivider}>|</span>
              <span>{currentLayoutInfo.description}</span>
            </div>
          )}
          {errors.layout && (
            <div style={styles.errorRow}>
              <AlertTriangle size={14} />
              {errors.layout}
            </div>
          )}
        </div>
      </div>

      {/* 气泡框 2: 磁盘分配 - 左右分栏 */}
      <div style={styles.bubbleCardNoPadding}>
        <div style={styles.splitPaneHeader}>
          {/* Left Pane Header */}
          <div style={styles.splitPaneTitle}>
            <HardDrive size={16} color={colors.primary} />
            <span>可用硬盘</span>
            <span style={styles.diskCountBadge}>{filteredDisks.length}</span>
          </div>
          {/* Right Pane Header */}
          <div style={styles.splitPaneTitle}>
            <Layers size={16} color={colors.primary} />
            <span>VDEVs</span>
            <span style={styles.diskCountBadge}>{vdevs.length}</span>
          </div>
        </div>

        {/* Left Pane - Available Disks */}
        <div style={styles.leftPane}>
          <div style={styles.paneHeader}>
            <div style={styles.paneTitle}>
              <HardDrive size={16} color={colors.primary} />
              <span>可用硬盘</span>
              <span style={styles.diskCountBadge}>{filteredDisks.length}</span>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filtersRow}>
            <div style={styles.searchContainer}>
              <Search size={14} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="搜索硬盘..."
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
                <option key={size} value={size}>
                  {formatSize(size)}
                </option>
              ))}
            </select>
          </div>

          {/* Disk List */}
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
                <HardDrive size={32} color={colors.border} />
                <span>没有可用的硬盘</span>
              </div>
            ) : (
              <div style={styles.diskGrid}>
                {filteredDisks.map((disk) => (
                  <div
                    key={disk.devname}
                    className="disk-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, disk)}
                    onDragEnd={handleDragEnd}
                    style={{
                      ...styles.diskCard,
                      opacity: draggedDisk?.devname === disk.devname ? 0.5 : 1,
                    }}
                  >
                    <DiskIcon disk={disk} width={48} height={54} />
                    <div style={styles.diskCardInfo}>
                      <span style={styles.diskCardName}>{disk.devname}</span>
                      <span style={styles.diskCardSize}>{formatSize(disk.size || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - VDEVs */}
        <div style={styles.rightPane}>
          <div style={styles.paneHeader}>
            <div style={styles.paneTitle}>
              <Layers size={16} color={colors.primary} />
              <span>VDEVs</span>
              <span style={styles.diskCountBadge}>{vdevs.length}</span>
            </div>
            <button
              onClick={addVdev}
              disabled={!category.layout}
              style={{
                ...styles.addVdevButton,
                ...(category.layout ? {} : styles.addVdevButtonDisabled),
              }}
            >
              <Plus size={14} />
              新建 VDEV
            </button>
          </div>

          <div style={styles.vdevsList}>
            {vdevs.length === 0 ? (
              <div style={styles.vdevEmptyState}>
                <div style={styles.vdevEmptyIcon}>
                  <Layers size={40} color={colors.border} />
                </div>
                {!category.layout ? (
                  <>
                    <span style={styles.vdevEmptyTitle}>请先选择布局</span>
                    <span style={styles.vdevEmptyHint}>在上方选择一个存储布局以开始配置</span>
                  </>
                ) : (
                  <>
                    <span style={styles.vdevEmptyTitle}>创建第一个 VDEV</span>
                    <span style={styles.vdevEmptyHint}>点击「新建 VDEV」按钮添加磁盘组</span>
                  </>
                )}
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
                      {currentLayoutInfo?.label ?? 'VDEV'} #{vdevIndex + 1}
                    </span>
                    <span style={styles.vdevDiskCount}>
                      {vdev.length} 块硬盘 {vdev.length < _minDisks && `（需要 ${_minDisks} 块）`}
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
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={styles.vdevDisks}>
                    {vdev.length === 0 ? (
                      <div style={dragOverVdevIndex === vdevIndex ? styles.vdevEmptyDragOver : styles.vdevEmpty}>
                        <HardDrive size={24} color={colors.textSecondary} />
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
                            <DiskIcon disk={disk} width={40} height={45} />
                            <div style={styles.vdevDiskInfo}>
                              <span style={styles.vdevDiskName}>{disk.devname}</span>
                              <span style={styles.vdevDiskSize}>{formatSize(disk.size || 0)}</span>
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
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {getVdevTips(vdev, category.layout, _minDisks).length > 0 && (
                    <div style={styles.vdevTips}>
                      {getVdevTips(vdev, category.layout, _minDisks).map((tip, i) => (
                        <div
                          key={i}
                          style={tip.isError ? styles.vdevTipError : styles.vdevTipWarning}
                        >
                          {tip.isError ? <AlertTriangle size={12} /> : <AlertTriangle size={12} />}
                          {tip.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Left Pane - Available Disks */}
        <div style={styles.leftPane}>
          {/* Filters */}
          <div style={styles.filtersRow}>
            <div style={styles.searchContainer}>
              <Search size={14} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="搜索硬盘..."
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
                <option key={size} value={size}>
                  {formatSize(size)}
                </option>
              ))}
            </select>
          </div>

          {/* Disk List */}
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
                <HardDrive size={32} color={colors.border} />
                <span>没有可用的硬盘</span>
              </div>
            ) : (
              <div style={styles.diskGrid}>
                {filteredDisks.map((disk) => (
                  <div
                    key={disk.devname}
                    className="disk-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, disk)}
                    onDragEnd={handleDragEnd}
                    style={{
                      ...styles.diskCard,
                      opacity: draggedDisk?.devname === disk.devname ? 0.5 : 1,
                    }}
                  >
                    <DiskIcon disk={disk} width={48} height={54} />
                    <div style={styles.diskCardInfo}>
                      <span style={styles.diskCardName}>{disk.devname}</span>
                      <span style={styles.diskCardSize}>{formatSize(disk.size || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - VDEVs */}
        <div style={styles.rightPane}>
          <div style={styles.vdevHeaderRow}>
            <button
              onClick={addVdev}
              disabled={!category.layout}
              style={{
                ...styles.addVdevButton,
                ...(category.layout ? {} : styles.addVdevButtonDisabled),
              }}
            >
              <Plus size={14} />
              新建 VDEV
            </button>
          </div>

          <div style={styles.vdevsList}>
            {vdevs.length === 0 ? (
              <div style={styles.vdevEmptyState}>
                <div style={styles.vdevEmptyIcon}>
                  <Layers size={40} color={colors.border} />
                </div>
                {!category.layout ? (
                  <>
                    <span style={styles.vdevEmptyTitle}>请先选择布局</span>
                    <span style={styles.vdevEmptyHint}>在上方选择一个存储布局以开始配置</span>
                  </>
                ) : (
                  <>
                    <span style={styles.vdevEmptyTitle}>创建第一个 VDEV</span>
                    <span style={styles.vdevEmptyHint}>点击「新建 VDEV」按钮添加磁盘组</span>
                  </>
                )}
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
                      {currentLayoutInfo?.label ?? 'VDEV'} #{vdevIndex + 1}
                    </span>
                    <span style={styles.vdevDiskCount}>
                      {vdev.length} 块硬盘 {vdev.length < _minDisks && `（需要 ${_minDisks} 块）`}
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
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={styles.vdevDisks}>
                    {vdev.length === 0 ? (
                      <div style={dragOverVdevIndex === vdevIndex ? styles.vdevEmptyDragOver : styles.vdevEmpty}>
                        <HardDrive size={24} color={colors.textSecondary} />
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
                            <DiskIcon disk={disk} width={40} height={45} />
                            <div style={styles.vdevDiskInfo}>
                              <span style={styles.vdevDiskName}>{disk.devname}</span>
                              <span style={styles.vdevDiskSize}>{formatSize(disk.size || 0)}</span>
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
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {getVdevTips(vdev, category.layout, _minDisks).length > 0 && (
                    <div style={styles.vdevTips}>
                      {getVdevTips(vdev, category.layout, _minDisks).map((tip, i) => (
                        <div
                          key={i}
                          style={tip.isError ? styles.vdevTipError : styles.vdevTipWarning}
                        >
                          {tip.isError ? <AlertTriangle size={12} /> : <AlertTriangle size={12} />}
                          {tip.message}
                        </div>
                      ))}
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
          border-color: ${colors.primary}60 !important;
          transform: translateY(-2px);
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
    boxSizing: 'border-box',
  },

  // 气泡框基础样式
  bubbleCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    flexShrink: 0,
  },
  bubbleCardNoPadding: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  bubbleHeader: {
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  bubbleTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  bubbleTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  },
  bubbleContent: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  // iOS 风格选择框
  iOSSelect: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    backgroundColor: colors.background,
    color: colors.text,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8e93' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
  },
  layoutInfoPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 10,
    fontSize: 13,
    color: colors.primary,
    border: `1px solid ${colors.primary}20`,
  },
  layoutInfoDivider: {
    color: colors.border,
    margin: '0 4px',
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    backgroundColor: `${colors.danger}10`,
    borderRadius: 10,
    fontSize: 12,
    color: colors.danger,
    border: `1px solid ${colors.danger}30`,
  },

  // Split pane styles
  splitPaneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  splitPaneTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  diskCountBadge: {
    padding: '2px 8px',
    backgroundColor: `${colors.primary}15`,
    color: colors.primary,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
  },

  // Selection Container
  selectionContainer: {
    flex: 1,
    display: 'flex',
    gap: 12,
    overflow: 'hidden',
    minHeight: 0,
    padding: 12,
    boxSizing: 'border-box',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    backgroundColor: colors.background,
    borderRadius: 12,
    boxSizing: 'border-box',
  },
  rightPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
    backgroundColor: colors.background,
    borderRadius: 12,
    boxSizing: 'border-box',
  },
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
    flexShrink: 0,
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textSecondary,
  },
  searchInput: {
    width: '100%',
    padding: '10px 10px 10px 32px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box',
  },
  filterSelect: {
    padding: '8px 10px',
    fontSize: 13,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    color: colors.text,
    cursor: 'pointer',
    outline: 'none',
  },
  diskList: {
    flex: 1,
    overflow: 'auto',
    padding: 8,
    transition: 'background-color 0.15s ease',
    boxSizing: 'border-box',
  },
  diskListDragOver: {
    backgroundColor: `${colors.danger}08`,
    outline: `2px dashed ${colors.danger}40`,
    outlineOffset: -8,
  },
  diskGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignContent: 'flex-start',
  },
  diskCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    cursor: 'grab',
    transition: 'all 0.15s ease',
    border: `1px solid ${colors.border}`,
  },
  diskCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  diskCardName: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
    fontFamily: 'monospace',
  },
  diskCardSize: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
    color: colors.textSecondary,
    fontSize: 13,
  },
  vdevHeaderRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 0',
    flexShrink: 0,
  },
  vdevsList: {
    flex: 1,
    overflowY: 'auto',
    padding: 4,
    boxSizing: 'border-box',
  },
  vdevEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
    textAlign: 'center',
  },
  vdevEmptyIcon: {
    marginBottom: 8,
    opacity: 0.5,
  },
  vdevEmptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  },
  vdevEmptyHint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  vdevCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    transition: 'all 0.15s ease',
    border: `1px solid ${colors.border}`,
  },
  vdevCardDragOver: {
    border: `2px dashed ${colors.primary}`,
    backgroundColor: `${colors.primary}08`,
    boxShadow: `0 0 0 3px ${colors.primary}15`,
  },
  vdevHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '10px 12px',
    backgroundColor: `${colors.border}20`,
    borderBottom: `1px solid ${colors.border}30`,
  },
  vdevTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  vdevCapacity: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 500,
    backgroundColor: `${colors.primary}10`,
    padding: '2px 8px',
    borderRadius: 6,
  },
  vdevDiskCount: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  removeVdevButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    color: colors.textSecondary,
    transition: 'all 0.15s ease',
  },
  vdevDisks: {
    padding: 10,
    minHeight: 60,
    boxSizing: 'border-box',
  },
  vdevDisksGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  vdevDiskCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    cursor: 'grab',
    transition: 'all 0.15s ease',
  },
  vdevDiskInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  vdevDiskName: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.text,
    fontFamily: 'monospace',
  },
  vdevDiskSize: {
    fontSize: 10,
    color: colors.textSecondary,
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
    gap: 6,
    padding: 16,
    color: colors.textSecondary,
    fontSize: 12,
    border: `2px dashed ${colors.border}`,
    borderRadius: 10,
    minHeight: 70,
  },
  vdevEmptyDragOver: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    color: colors.primary,
    fontSize: 13,
    fontWeight: 500,
    border: `2px dashed ${colors.primary}`,
    borderRadius: 10,
    backgroundColor: `${colors.primary}08`,
  },
  vdevTips: {
    padding: '10px 14px',
    borderTop: `1px solid ${colors.border}30`,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  vdevTipError: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: colors.danger,
  },
  vdevTipWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#f59e0b',
  },
  addVdevButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s ease',
    boxShadow: `0 2px 8px ${colors.primary}30`,
  },
  addVdevButtonDisabled: {
    backgroundColor: colors.border,
    cursor: 'not-allowed',
    opacity: 0.6,
    boxShadow: 'none',
  },
}
