/**
 * Data Step Component
 * Data vdev configuration (required)
 */

import React from 'react'
import { AlertCircle, Zap } from 'lucide-react'
import { VDevType } from '@truenas/types/vdev-enum-types'
import { DetailsDisk } from '@truenas/types/disk-types'
import { usePoolWizardStore, LAYOUT_OPTIONS } from '../store/poolWizardStore'
import { LayoutSelector } from '../components/LayoutSelector'
import { DiskSizeSelector } from '../components/DiskSizeSelector'
import { VdevConfigurator } from '../components/VdevConfigurator'
import { DiskList } from '../components/DiskList'
import { colors } from '@apps/system-settings/styles/theme'

interface DataStepProps {
  errors: Record<string, string>
  warnings: Record<string, string>
}

export function DataStep({ errors, warnings }: DataStepProps) {
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

  const category = topology[VDevType.Data]
  const allowedLayouts = LAYOUT_OPTIONS[VDevType.Data]

  // Calculate available disks for this category
  const usedDisks = new Set<string>()
  Object.entries(topology).forEach(([type, cat]) => {
    if (type !== VDevType.Data) {
      cat.vdevs.forEach((vdev) => {
        vdev.forEach((disk) => usedDisks.add(disk.devname))
      })
    }
  })
  const availableDisks = unusedDisks.filter((d) => !usedDisks.has(d.devname))

  const handleLayoutChange = (layout: typeof category.layout) => {
    setLayout(VDevType.Data, layout)
  }

  const handleAutoSelect = () => {
    runAutoSelection(VDevType.Data)
  }

  const handleManualToggle = (disk: DetailsDisk) => {
    // Simple manual selection: toggle disk in/out of first vdev
    const currentDisks = category.vdevs.flat()
    const isSelected = currentDisks.some((d) => d.devname === disk.devname)

    if (isSelected) {
      // Remove disk
      const newVdevs = category.vdevs
        .map((vdev) => vdev.filter((d) => d.devname !== disk.devname))
        .filter((vdev) => vdev.length > 0)
      setManualDisks(VDevType.Data, newVdevs)
    } else {
      // Add disk to first vdev or create new vdev
      const newVdevs = [...category.vdevs]
      if (newVdevs.length === 0) {
        newVdevs.push([disk])
      } else {
        newVdevs[0] = [...newVdevs[0], disk]
      }
      setManualDisks(VDevType.Data, newVdevs)
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>数据 Vdev</h3>
      <p style={styles.description}>配置池的主要数据存储</p>

      {/* Warnings */}
      {warnings.layout && (
        <div style={styles.warning}>
          <AlertCircle size={16} />
          {warnings.layout}
        </div>
      )}

      {/* Layout Selection */}
      <div style={styles.field}>
        <label style={styles.label}>布局 *</label>
        <LayoutSelector
          value={category.layout}
          onChange={handleLayoutChange}
          allowedLayouts={allowedLayouts}
        />
        {errors.layout && (
          <div style={styles.error}>
            <AlertCircle size={14} />
            {errors.layout}
          </div>
        )}
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
              onSizeChange={(size) => setDiskSize(VDevType.Data, size)}
              onTypeChange={(type) => setDiskType(VDevType.Data, type)}
              onTreatAsMinimumChange={(treat) =>
                setTreatDiskSizeAsMinimum(VDevType.Data, treat)
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
              isSingleVdev={false}
              onWidthChange={(width) => setWidth(VDevType.Data, width)}
              onVdevsNumberChange={(number) => setVdevsNumber(VDevType.Data, number)}
              onDraidDataDisksChange={(disks) =>
                setDraidDataDisks(VDevType.Data, disks)
              }
              onDraidSpareDisksChange={(disks) =>
                setDraidSpareDisks(VDevType.Data, disks)
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
    margin: '0 0 24px 0',
    fontSize: 14,
    color: colors.textSecondary,
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
