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

export function DataStep({ errors, warnings: _warnings }: DataStepProps) {
  const {
    topology,
    unusedDisks,
    allowNonUniqueSerialDisks,
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

  // Calculate available disks for this category, filtering based on allowNonUniqueSerialDisks
  const usedDisks = new Set<string>()
  Object.entries(topology).forEach(([type, cat]) => {
    if (type !== VDevType.Data) {
      cat.vdevs.forEach((vdev) => {
        vdev.forEach((disk) => usedDisks.add(disk.devname))
      })
    }
  })

  // Filter disks: exclude used disks and disks with non-unique serials if not allowed
  const availableDisks = unusedDisks.filter((d) => {
    // Exclude already used disks
    if (usedDisks.has(d.devname)) {
      return false
    }
    // Exclude disks with duplicate serials if not allowed
    if (!allowNonUniqueSerialDisks && d.duplicate_serial && d.duplicate_serial.length > 0) {
      return false
    }
    return true
  })

  const handleLayoutChange = (layout: typeof category.layout) => {
    setLayout(VDevType.Data, layout)
  }

  const handleAutoSelect = () => {
    runAutoSelection(VDevType.Data)
  }

  const handleManualToggle = (disk: DetailsDisk) => {
    const currentDisks = category.vdevs.flat()
    const isSelected = currentDisks.some((d) => d.devname === disk.devname)

    if (isSelected) {
      const newVdevs = category.vdevs
        .map((vdev) => vdev.filter((d) => d.devname !== disk.devname))
        .filter((vdev) => vdev.length > 0)
      setManualDisks(VDevType.Data, newVdevs)
    } else {
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

      {/* Automated Disk Selection */}
      {category.layout && (
        <>
          {/* Disk Size Selection */}
          <div style={styles.field}>
            <label style={styles.label}>硬盘大小</label>
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
              自动选择硬盘
            </button>
          </div>

          {/* Selected Disks Preview */}
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

          {/* Advanced Options */}
          <div style={styles.advancedSection}>
            <div style={styles.advancedHeader}>
              <span style={styles.advancedTitle}>高级选项</span>
            </div>
            <p style={styles.advancedDescription}>
              手动硬盘选择允许你创建 Vdev 并单独向这些 Vdev 添加硬盘。
            </p>
            <button
              onClick={() => {
                // Enter manual mode - this would typically open a dialog
                // For now, we'll show the disk list
              }}
              disabled={!category.layout}
              style={{
                ...styles.manualButton,
                ...(!category.layout ? styles.autoButtonDisabled : {}),
              }}
            >
              手动选择硬盘
            </button>
          </div>

          {/* Manual Selection */}
          <div style={styles.field}>
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
  advancedSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  advancedHeader: {
    marginBottom: 8,
  },
  advancedTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  advancedDescription: {
    margin: '0 0 12px 0',
    fontSize: 13,
    color: colors.textSecondary,
  },
  manualButton: {
    padding: '8px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: colors.text,
  },
}
