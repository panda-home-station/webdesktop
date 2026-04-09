/**
 * Pool Card Component
 * Display a single pool summary card
 */

import React from 'react'
import { Pool } from '@truenas/types/pool'
import { VDevType } from '@truenas/types/vdev-enum-types'
import { formatBytes, getPoolHealthColor, getPoolUsedPercentage } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'

interface PoolCardProps {
  pool: Pool
  onClick: () => void
}

export function PoolCard({ pool, onClick }: PoolCardProps) {
  const usedPercent = getPoolUsedPercentage(pool)
  const healthColor = getPoolHealthColor(pool.status)

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.header}>
        <h3 style={styles.name}>{pool.name}</h3>
        <span style={{ ...styles.badge, backgroundColor: healthColor }}>
          {pool.healthy ? 'Healthy' : pool.status_detail || pool.status}
        </span>
      </div>

      {/* Capacity Bar */}
      <div style={styles.capacitySection}>
        <div style={styles.capacityBar}>
          <div
            style={{
              ...styles.capacityFill,
              width: `${usedPercent}%`,
              backgroundColor: getUsageColor(usedPercent)
            }}
          />
        </div>
        <span style={styles.capacityText}>
          {formatBytes(pool.allocated || 0)} / {formatBytes(pool.size)}
        </span>
      </div>

      {/* vDev topology preview */}
      <div style={styles.topologyPreview}>
        <span style={styles.topologyLabel}>Topology:</span>
        <div style={styles.topologyTags}>
          {Object.entries(pool.topology)
            .filter(([key]) => key !== 'spare')
            .map(([type, vdevs]) => {
              if (!vdevs || vdevs.length === 0) return null
              return (
                <span key={type} style={styles.topologyTag}>
                  {getVdevTypeLabel(type as VDevType)} ({vdevs.length})
                </span>
              )
            })}
        </div>
      </div>

      {/* Quick stats */}
      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Free</span>
          <span style={styles.statValue}>{formatBytes(pool.free || 0)}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Encryption</span>
          <span style={styles.statValue}>{pool.encrypt ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  )
}

function getUsageColor(percentage: number): string {
  if (percentage < 70) return colors.success
  if (percentage < 90) return colors.warning
  return colors.danger
}

function getVdevTypeLabel(type: VDevType): string {
  const labels: Record<VDevType, string> = {
    [VDevType.Data]: 'Data',
    [VDevType.Log]: 'SLOG',
    [VDevType.Special]: 'Metadata',
    [VDevType.Spare]: 'Spare',
    [VDevType.Dedup]: 'Dedup',
    [VDevType.Cache]: 'L2ARC',
  }
  return labels[type] || type
}

const styles = {
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as React.CSSProperties,
  name: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  badge: {
    padding: '4px 10px',
    color: 'white',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  } as React.CSSProperties,
  capacitySection: {
    marginBottom: 12,
  } as React.CSSProperties,
  capacityBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  } as React.CSSProperties,
  capacityFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  capacityText: {
    fontSize: 13,
    color: colors.textSecondary,
  } as React.CSSProperties,
  topologyPreview: {
    marginBottom: 12,
  } as React.CSSProperties,
  topologyLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    display: 'block',
    marginBottom: 6,
  } as React.CSSProperties,
  topologyTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  } as React.CSSProperties,
  topologyTag: {
    padding: '3px 8px',
    backgroundColor: colors.background,
    borderRadius: 4,
    fontSize: 12,
    color: colors.textSecondary,
  } as React.CSSProperties,
  stats: {
    display: 'flex',
    gap: 24,
    paddingTop: 12,
    borderTop: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  } as React.CSSProperties,
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  statValue: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
  } as React.CSSProperties,
}
