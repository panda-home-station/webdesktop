/**
 * Vdev Step Component
 * Reusable component for optional vdev types (Log, Spare, Cache, Metadata, Dedup)
 */

import React from 'react'
import { AlertCircle, Zap, Trash2 } from 'lucide-react'
import { VDevType } from '@truenas/types/vdev-enum-types'
import { DetailsDisk } from '@truenas/types/disk-types'
import { usePoolWizardStore, LAYOUT_OPTIONS } from '../store/poolWizardStore'
import { LayoutSelector } from '../components/LayoutSelector'
import { DiskSizeSelector } from '../components/DiskSizeSelector'
import { VdevConfigurator } from '../components/VdevConfigurator'
import { DiskList } from '../components/DiskList'
import { colors } from '@apps/system-settings/styles/theme'

interface VdevStepProps {
  type: VDevType.Log | VDevType.Spare | VDevType.Cache | VDevType.Special | VDevType.Dedup
  title: string
  description: string
  errors: Record<string, string>
  warnings: Record<string, string>
}

export function VdevStep({ type, title, description, errors, warnings }: VdevStepProps) {
  const {
    topology,
    unusedDisks,
    setLayout,
    setDiskSize,
    setDiskType,
    setTreatDiskSizeAsMinimum,
    setWidth,
    setVdevsNumber,
    setDraidDataDisks,
    setDraidSpareDisks,
    runAutoSelection,
    setManualDisks,
  } = usePoolWizardStore()

  const category = topology[type]
  const allowedLayouts = LAYOUT_OPTIONS[type]
  const isSingleVdev = type === VDevType.Spare || type === VDevType.Cache

  // Calculate available disks (excluding other categories)
  const usedDisks = new Set<string>()
  Object.entries(topology).forEach(([t, cat]) => {
    if (t !== type) {
      cat.vdevs.forEach((vdev) => {
        vdev.forEach((disk) => usedDisks.add(disk.devname))
      })
    }
  })
  const availableDisks = unusedDisks.filter((d) => !usedDisks.has(d.devname))

  const handleLayoutChange = (layout: typeof category.layout) => {
    setLayout(type, layout)
  }

  const handleClear = () => {
    setLayout(type, null)
  }

  const handleAutoSelect = () => {
    runAutoSelection(type)
  }

  const handleManualToggle = (disk: DetailsDisk) => {
    const currentDisks = category.vdevs.flat()
    const isSelected = currentDisks.some((d) => d.devname === disk.devname)

    if (isSelected) {
      const newVdevs = category.vdevs
        .map((vdev) => vdev.filter((d) => d.devname !== disk.devname))
        .filter((vdev) => vdev.length > 0)
      setManualDisks(type, newVdevs)
    } else {
      const newVdevs = [...category.vdevs]
      if (newVdevs.length === 0) {
        newVdevs.push([disk])
      } else if (!isSingleVdev) {
        newVdevs[0] = [...newVdevs[0], disk]
      } else {
        // For single vdev types, add to existing vdev
        newVdevs[0] = [...newVdevs[0], disk]
      }
      setManualDisks(type, newVdevs)
    }
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
          <span style={styles.bubbleTitle}>存储布局</span>
        </div>
        <div style={styles.bubbleContent}>
          <LayoutSelector
            value={category.layout}
            onChange={handleLayoutChange}
            allowedLayouts={allowedLayouts}
          />
        </div>
      </div>

      {/* Configuration */}
      {category.layout && (
        <>
          {/* 气泡框 3: 硬盘选择 */}
          <div style={styles.bubbleCard}>
            <div style={styles.bubbleHeader}>
              <span style={styles.bubbleTitle}>选择硬盘</span>
            </div>
            <div style={styles.bubbleContent}>
              <DiskSizeSelector
                availableDisks={availableDisks}
                selectedSize={category.diskSize}
                selectedType={category.diskType}
                treatAsMinimum={category.treatDiskSizeAsMinimum}
                onSizeChange={(size) => setDiskSize(type, size)}
                onTypeChange={(t) => setDiskType(type, t)}
                onTreatAsMinimumChange={(treat) =>
                  setTreatDiskSizeAsMinimum(type, treat)
                }
              />
            </div>
          </div>

          {/* 气泡框 4: Vdev 配置 */}
          <div style={styles.bubbleCard}>
            <div style={styles.bubbleHeader}>
              <span style={styles.bubbleTitle}>Vdev 配置</span>
            </div>
            <div style={styles.bubbleContent}>
              <VdevConfigurator
                layout={category.layout}
                width={category.width}
                vdevsNumber={category.vdevsNumber}
                draidDataDisks={category.draidDataDisks}
                draidSpareDisks={category.draidSpareDisks}
                availableDiskCount={availableDisks.length}
                isSingleVdev={isSingleVdev}
                onWidthChange={(width) => setWidth(type, width)}
                onVdevsNumberChange={(number) => setVdevsNumber(type, number)}
                onDraidDataDisksChange={(disks) =>
                  setDraidDataDisks(type, disks)
                }
                onDraidSpareDisksChange={(disks) =>
                  setDraidSpareDisks(type, disks)
                }
              />
            </div>
          </div>

          {/* 气泡框 5: 自动/手动分配 */}
          <div style={styles.bubbleCard}>
            <div style={styles.bubbleHeader}>
              <span style={styles.bubbleTitle}>硬盘分配</span>
              {category.layout && (
                <button onClick={handleClear} style={styles.clearButtonSmall}>
                  <Trash2 size={12} />
                  清除
                </button>
              )}
            </div>
            <div style={styles.bubbleContent}>
              {/* 自动选择按钮 */}
              <button
                onClick={handleAutoSelect}
                disabled={
                  !category.layout ||
                  !category.diskSize ||
                  !category.diskType ||
                  availableDisks.length === 0
                }
                style={{
                  ...styles.autoButton,
                  ...(!category.layout ||
                  !category.diskSize ||
                  !category.diskType ||
                  availableDisks.length === 0
                    ? styles.autoButtonDisabled
                    : {}),
                }}
              >
                <Zap size={16} />
                自动分配硬盘
              </button>

              {/* 已选择硬盘预览 */}
              {category.vdevs.length > 0 && (
                <div style={styles.selectedInfo}>
                  <span style={styles.selectedLabel}>
                    已选择 {category.vdevs.flat().length} 块硬盘
                  </span>
                  <div style={styles.vdevPreview}>
                    {category.vdevs.map((vdev, index) => (
                      <div key={index} style={styles.vdevCard}>
                        <span style={styles.vdevTitle}>Vdev {index + 1}</span>
                        <span style={styles.vdevDisks}>
                          {vdev.map((d) => d.name).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 手动选择 */}
              <div style={styles.manualSelection}>
                <span style={styles.manualLabel}>或手动选择:</span>
                <div style={styles.diskListWrapper}>
                  <DiskList
                    disks={availableDisks}
                    selectedDisks={category.vdevs.flat()}
                    onToggle={handleManualToggle}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 错误信息 */}
      {errors.vdevs && (
        <div style={styles.errorBubble}>
          <AlertCircle size={16} />
          <span>{errors.vdevs}</span>
        </div>
      )}
    </div>
  )
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
    gap: 16,
  },

  // 气泡框基础样式
  bubbleCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  bubbleHeader: {
    padding: '14px 16px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 16,
  },

  // 标题和描述
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

  // 自动分配按钮
  autoButton: {
    padding: '12px 20px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  autoButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  // 已选择信息
  selectedInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
  },
  vdevPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  vdevCard: {
    padding: '12px 16px',
    backgroundColor: colors.background,
    borderRadius: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: `1px solid ${colors.border}`,
  },
  vdevTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  vdevDisks: {
    fontSize: 13,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '60%',
  },

  // 手动选择
  manualSelection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
  },
  diskListWrapper: {
    maxHeight: 200,
    overflowY: 'auto',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
  },
}
