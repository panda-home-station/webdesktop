/**
 * Vdev Configurator Component
 * Configure width and number of vdevs
 */

import React from 'react'
import { CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { minDisksPerLayout, isDraidLayout } from '../store/poolWizardStore'
import { calculateWidthOptions, calculateVdevsOptions } from '../utils/disk-selection'
import { colors } from '@apps/system-settings/styles/theme'

interface VdevConfiguratorProps {
  layout: CreateVdevLayout | null
  width: number | null
  vdevsNumber: number | null
  draidDataDisks: number | null
  draidSpareDisks: number | null
  availableDiskCount: number
  isSingleVdev: boolean
  onWidthChange: (width: number | null) => void
  onVdevsNumberChange: (number: number | null) => void
  onDraidDataDisksChange: (disks: number | null) => void
  onDraidSpareDisksChange: (disks: number | null) => void
}

export function VdevConfigurator({
  layout,
  width,
  vdevsNumber,
  draidDataDisks,
  draidSpareDisks,
  availableDiskCount,
  isSingleVdev,
  onWidthChange,
  onVdevsNumberChange,
  onDraidDataDisksChange,
  onDraidSpareDisksChange,
}: VdevConfiguratorProps) {
  if (!layout) {
    return null
  }

  const usingDraid = isDraidLayout(layout)
  const minDisks = minDisksPerLayout[layout]

  // Calculate options
  const widthOptions = usingDraid
    ? []
    : calculateWidthOptions(layout, availableDiskCount)

  const vdevOptions = calculateVdevsOptions(
    width ?? minDisks,
    availableDiskCount,
    isSingleVdev
  )

  // dRAID options
  const parityMap: Record<string, number> = {
    [CreateVdevLayoutEnum.Draid1]: 1,
    [CreateVdevLayoutEnum.Draid2]: 2,
    [CreateVdevLayoutEnum.Draid3]: 3,
  }
  const parityDisks = parityMap[layout] ?? 1

  const draidDataOptions = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32].filter(
    (d) => d >= minDisks && d + parityDisks <= availableDiskCount
  )

  return (
    <div style={styles.container}>
      {usingDraid ? (
        // dRAID Configuration
        <div style={styles.draidSection}>
          <div style={styles.field}>
            <label style={styles.label}>每组数据盘数</label>
            <select
              value={draidDataDisks ?? 8}
              onChange={(e) => onDraidDataDisksChange(Number(e.target.value))}
              style={styles.select}
            >
              {draidDataOptions.map((d) => (
                <option key={d} value={d}>
                  {d} 数据盘
                </option>
              ))}
            </select>
            <span style={styles.hint}>
              每组 {draidDataDisks ?? 8} 数据盘 + {parityDisks} 校验盘
            </span>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>热备盘数</label>
            <select
              value={draidSpareDisks ?? 0}
              onChange={(e) => onDraidSpareDisksChange(Number(e.target.value))}
              style={styles.select}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  {s} 热备盘
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Vdev 数量</label>
            <select
              value={vdevsNumber ?? 1}
              onChange={(e) => onVdevsNumberChange(Number(e.target.value))}
              style={styles.select}
              disabled={isSingleVdev}
            >
              {vdevOptions.map((n) => (
                <option key={n} value={n}>
                  {n} Vdev{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.summary}>
            <span style={styles.summaryLabel}>总硬盘数:</span>
            <span style={styles.summaryValue}>
              {(draidDataDisks ?? 8) + parityDisks + (draidSpareDisks ?? 0)} ×{' '}
              {vdevsNumber ?? 1} ={' '}
              {((draidDataDisks ?? 8) + parityDisks + (draidSpareDisks ?? 0)) *
                (vdevsNumber ?? 1)}{' '}
              块
            </span>
          </div>
        </div>
      ) : (
        // Normal Configuration
        <div style={styles.normalSection}>
          <div style={styles.field}>
            <label style={styles.label}>每个 Vdev 的硬盘数 (Width)</label>
            <select
              value={width ?? ''}
              onChange={(e) => onWidthChange(Number(e.target.value))}
              style={styles.select}
            >
              <option value="">选择宽度...</option>
              {widthOptions.map((w) => (
                <option key={w} value={w}>
                  {w} 块硬盘
                  {layout === CreateVdevLayoutEnum.Mirror && w > 2 && ' (建议偶数)'}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Vdev 数量</label>
            <select
              value={vdevsNumber ?? ''}
              onChange={(e) => onVdevsNumberChange(Number(e.target.value))}
              style={styles.select}
              disabled={isSingleVdev}
            >
              <option value="">选择数量...</option>
              {vdevOptions.map((n) => (
                <option key={n} value={n}>
                  {n} Vdev{n > 1 ? 's' : ''} ({n * (width ?? minDisks)} 块硬盘)
                </option>
              ))}
            </select>
          </div>

          <div style={styles.summary}>
            <span style={styles.summaryLabel}>总硬盘数:</span>
            <span style={styles.summaryValue}>
              {width ?? '-'} × {vdevsNumber ?? '-'} ={' '}
              {(width ?? 0) * (vdevsNumber ?? 0)} 块
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 16,
  },
  draidSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  normalSection: {
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
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    color: colors.text,
    cursor: 'pointer',
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    backgroundColor: colors.background,
    borderRadius: 8,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
}
