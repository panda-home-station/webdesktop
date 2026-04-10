/**
 * Layout Selector Component
 * Select vdev layout type (Stripe, Mirror, Raidz, dRAID, etc.)
 */

import React from 'react'
import { CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { colors } from '@apps/system-settings/styles/theme'

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
  return (
    <select
      value={value !== null ? String(value) : ''}
      onChange={(e) => onChange(e.target.value ? e.target.value as CreateVdevLayout : null)}
      disabled={disabled}
      style={styles.select}
    >
      <option value="">选择布局...</option>
      {allowedLayouts.map((layout) => (
        <option key={layout} value={String(layout)}>
          {LAYOUT_LABELS[layout]}
        </option>
      ))}
    </select>
  )
}

const styles: Record<string, React.CSSProperties> = {
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    color: colors.text,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238e8e93' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  },
}
