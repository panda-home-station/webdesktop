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
      {/* Layout Selection - Compact Dropdown Style */}
      <div style={styles.layoutSection}>
        <div style={styles.layoutRow}>
          <div style={styles.layoutLabel}>
            <Layers size={16} color={colors.primary} />
            <span>存储布局</span>
          </div>
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
        </div>
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

      {/* Disk Selection UI - Split Panel */}
      <div style={styles.selectionContainer}>
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
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    overflow: 'auto',
    height: '100%',
    boxSizing: 'border-box',
    background: `
      radial-gradient(ellipse at top left, ${colors.primary}08 0%, transparent 50%),
      radial-gradient(ellipse at bottom right, ${colors.primary}05 0%, transparent 50%),
      ${colors.background}
    `,
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    gap: 12,
    minHeight: 0,
    overflow: 'hidden',
  },
  leftColumn: {
    flex: '0 0 320px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    overflow: 'hidden',
  },
  // Layout Section - Compact Dropdown
  layoutSection: {
    flexShrink: 0,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 10,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}40`,
  },
  layoutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  layoutLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 500,
    color: colors.text,
    flexShrink: 0,
  },
  layoutSelect: {
    flex: 1,
    padding: '6px 28px 6px 10px',
    fontSize: 12,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.background,
    color: colors.text,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238e8e93' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  },
  layoutInfoPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 6,
    fontSize: 11,
    color: colors.primary,
    border: `1px solid ${colors.primary}20`,
    flexShrink: 0,
    marginTop: 6,
  },
  layoutInfoDivider: {
    color: colors.border,
    margin: '0 2px',
  },
  // Selection Container
  selectionContainer: {
    flex: 1,
    display: 'flex',
    gap: 12,
    overflow: 'hidden',
    minHeight: 0,
    boxSizing: 'border-box',
  },
  leftPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    minWidth: 0,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}40`,
    boxSizing: 'border-box',
  },
  rightPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    minWidth: 0,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}40`,
    boxSizing: 'border-box',
  },
  paneHeader: {
    padding: '8px 10px',
    borderBottom: `1px solid ${colors.border}40`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  paneTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  diskCountBadge: {
    padding: '2px 6px',
    backgroundColor: `${colors.primary}15`,
    color: colors.primary,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 600,
  },
  filtersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderBottom: `1px solid ${colors.border}40`,
    flexShrink: 0,
  },
  searchContainer: {
    position: 'relative' as const,
    flex: 1,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textSecondary,
  },
  searchInput: {
    width: '100%',
    padding: '5px 8px 5px 26px',
    fontSize: 11,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.background,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  filterSelect: {
    flex: '0 0 auto',
    width: 60,
    padding: '4px 4px',
    fontSize: 10,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    backgroundColor: colors.background,
    color: colors.text,
    cursor: 'pointer',
    outline: 'none',
  },
  diskList: {
    flex: 1,
    overflow: 'hidden',
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
    flexWrap: 'wrap' as const,
    gap: 8,
    alignContent: 'flex-start',
  },
  diskCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    cursor: 'grab',
    transition: 'all 0.15s ease',
    border: `1px solid ${colors.border}40`,
  },
  diskCardInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 1,
  },
  diskCardName: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.text,
    fontFamily: 'monospace',
  },
  diskCardSize: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 20,
    color: colors.textSecondary,
    fontSize: 11,
  },
  vdevsList: {
    flex: 1,
    overflow: 'hidden',
    padding: 6,
    boxSizing: 'border-box',
  },
  vdevEmptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    textAlign: 'center' as const,
  },
  vdevEmptyIcon: {
    marginBottom: 8,
    opacity: 0.5,
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
  vdevCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
    transition: 'all 0.15s ease',
    border: `1px solid ${colors.border}40`,
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
    padding: '6px 8px',
    backgroundColor: `${colors.border}30`,
    borderBottom: `1px solid ${colors.border}30`,
  },
  vdevTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.text,
  },
  vdevCapacity: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 500,
    backgroundColor: `${colors.primary}10`,
    padding: '1px 4px',
    borderRadius: 4,
  },
  vdevDiskCount: {
    fontSize: 10,
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
    padding: 6,
    minHeight: 40,
    boxSizing: 'border-box',
  },
  vdevDisksGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  vdevDiskCard: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 2,
    padding: 6,
    backgroundColor: colors.cardBg,
    borderRadius: 6,
    border: `1px solid ${colors.border}40`,
    cursor: 'grab',
    transition: 'all 0.15s ease',
  },
  vdevDiskInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 1,
  },
  vdevDiskName: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.text,
    fontFamily: 'monospace',
  },
  vdevDiskSize: {
    fontSize: 8,
    color: colors.textSecondary,
  },
  vdevRemoveDiskBtn: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: 3,
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
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
    color: colors.textSecondary,
    fontSize: 10,
    border: `2px dashed ${colors.border}`,
    borderRadius: 6,
    minHeight: 50,
  },
  vdevEmptyDragOver: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
    color: colors.primary,
    fontSize: 11,
    fontWeight: 500,
    border: `2px dashed ${colors.primary}`,
    borderRadius: 6,
    backgroundColor: `${colors.primary}08`,
  },
  vdevTips: {
    padding: '8px 12px',
    borderTop: `1px solid ${colors.border}30`,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  vdevTipError: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: colors.danger,
  },
  vdevTipWarning: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    color: '#f59e0b',
  },
  addVdevButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
    transition: 'all 0.15s ease',
    boxShadow: `0 2px 8px ${colors.primary}30`,
  },
  addVdevButtonDisabled: {
    backgroundColor: colors.border,
    cursor: 'not-allowed',
    opacity: 0.6,
    boxShadow: 'none',
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 59, 48, 0.063)',
    borderRadius: 8,
    fontSize: 12,
    color: '#ff3b30',
    border: '1px solid rgba(255, 59, 48, 0.125)',
    flexShrink: 0,
    marginTop: 8,
  },
}
