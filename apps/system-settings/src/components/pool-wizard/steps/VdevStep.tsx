/**
 * Vdev Step Component
 * Reusable component for optional vdev types (Log, Spare, Cache, Metadata, Dedup)
 */

import React from 'react'
import { AlertCircle, Zap, Trash2 } from 'lucide-react'
import { VDevType, vdevTypeLabels } from '@truenas/types/vdev-enum-types'
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
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.description}>{description}</p>

      {/* Clear Button */}
      {category.layout && (
        <button onClick={handleClear} style={styles.clearButton}>
          <Trash2 size={14} />
          清除 {title} 配置
        </button>
      )}

      {/* Warnings */}
      {warnings.layout && (
        <div style={styles.warning}>
          <AlertCircle size={16} />
          {warnings.layout}
        </div>
      )}

      {/* Layout Selection */}
      <div style={styles.field}>
        <label style={styles.label}>布局</label>
        <LayoutSelector
          value={category.layout}
          onChange={handleLayoutChange}
          allowedLayouts={allowedLayouts}
        />
      </div>

      {/* Configuration */}
      {category.layout && (
        <>
          {/* Disk Size Selection */}
          <div style={styles.field}>
            <label style={styles.label}>选择硬盘</label>
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

          {/* Vdev Configuration */}
          <div style={styles.field}>
            <label style={styles.label}>Vdev 配置</label>
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

          {/* Auto Selection Button */}
          <div style={styles.actions}>
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
          </div>

          {/* Selected Disks */}
          {category.vdevs.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>
                已选择 ({category.vdevs.flat().length} 块硬盘)
              </label>
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

          {/* Manual Selection */}
          <div style={styles.field}>
            <label style={styles.label}>或手动选择硬盘</label>
            <div style={styles.diskListWrapper}>
              <DiskList
                disks={availableDisks}
                selectedDisks={category.vdevs.flat()}
                onToggle={handleManualToggle}
              />
            </div>
          </div>
        </>
      )}

      {/* Errors */}
      {errors.vdevs && (
        <div style={styles.error}>
          <AlertCircle size={14} />
          {errors.vdevs}
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
    padding: 24,
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  },
  description: {
    margin: '0 0 16px 0',
    fontSize: 14,
    color: colors.textSecondary,
  },
  clearButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    backgroundColor: '#ffebee',
    color: colors.danger,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    marginBottom: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  warning: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginBottom: 24,
    color: '#e65100',
    fontSize: 14,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontSize: 13,
    color: colors.danger,
  },
  actions: {
    marginBottom: 24,
  },
  autoButton: {
    padding: '10px 20px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  autoButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  vdevPreview: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  vdevCard: {
    padding: '10px 14px',
    backgroundColor: colors.background,
    borderRadius: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vdevTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  vdevDisks: {
    fontSize: 12,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '70%',
  },
  diskListWrapper: {
    maxHeight: 250,
    overflowY: 'auto' as const,
  },
}
