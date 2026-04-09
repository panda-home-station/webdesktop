/**
 * Layout Selector Component
 * Select vdev layout type (Stripe, Mirror, Raidz, dRAID, etc.)
 */

import React from 'react'
import { CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { colors } from '@apps/system-settings/styles/theme'

interface LayoutOption {
  label: string
  value: CreateVdevLayout
  description?: string
}

const LAYOUT_LABELS: Record<CreateVdevLayout, string> = {
  [CreateVdevLayout.Stripe]: 'Stripe',
  [CreateVdevLayout.Mirror]: 'Mirror',
  [CreateVdevLayout.Raidz1]: 'Raidz1',
  [CreateVdevLayout.Raidz2]: 'Raidz2',
  [CreateVdevLayout.Raidz3]: 'Raidz3',
  [CreateVdevLayout.Draid1]: 'dRAID1',
  [CreateVdevLayout.Draid2]: 'dRAID2',
  [CreateVdevLayout.Draid3]: 'dRAID3',
}

const LAYOUT_DESCRIPTIONS: Record<CreateVdevLayout, string> = {
  [CreateVdevLayout.Stripe]: '无冗余',
  [CreateVdevLayout.Mirror]: '镜像冗余',
  [CreateVdevLayout.Raidz1]: '单奇偶校验',
  [CreateVdevLayout.Raidz2]: '双奇偶校验',
  [CreateVdevLayout.Raidz3]: '三奇偶校验',
  [CreateVdevLayout.Draid1]: '分布式单校验',
  [CreateVdevLayout.Draid2]: '分布式双校验',
  [CreateVdevLayout.Draid3]: '分布式三校验',
}

interface LayoutSelectorProps {
  value: CreateVdevLayout | null
  onChange: (layout: CreateVdevLayout | null) => void
  allowedLayouts: CreateVdevLayout[]
  disabled?: boolean
}

export function LayoutSelector({
  value,
  onChange,
  allowedLayouts,
  disabled = false,
}: LayoutSelectorProps) {
  const options: LayoutOption[] = allowedLayouts.map((layout) => ({
    label: LAYOUT_LABELS[layout],
    value: layout,
    description: LAYOUT_DESCRIPTIONS[layout],
  }))

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            style={{
              ...styles.layoutButton,
              ...(value === option.value ? styles.layoutButtonSelected : {}),
              ...(disabled ? styles.layoutButtonDisabled : {}),
            }}
          >
            <span style={styles.layoutLabel}>{option.label}</span>
            {option.description && (
              <span style={styles.layoutDescription}>{option.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 12,
  },
  layoutButton: {
    padding: '16px 12px',
    backgroundColor: colors.cardBg,
    border: `2px solid ${colors.border}`,
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  layoutButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  layoutButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  layoutLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  layoutDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
}
