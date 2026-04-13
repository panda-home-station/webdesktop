/**
 * Pool Card Component
 * Display a single pool summary card with modern gauge chart
 */

import React from 'react'
import { Pool } from '@truenas/types/pool'
import { VDevType } from '@truenas/types/vdev-enum-types'
import { formatBytes, getPoolHealthColor, getPoolUsedPercentage } from '@truenas/utils/storage.utils'
import { GaugeChart } from '../ui/GaugeChart'
import { colors } from '../../styles/theme'
import { Shield, Lock, CheckCircle, AlertTriangle } from 'lucide-react'

interface PoolCardProps {
  pool: Pool
  onClick: () => void
}

export function PoolCard({ pool, onClick }: PoolCardProps) {
  const usedPercent = getPoolUsedPercentage(pool)
  const healthColor = getPoolHealthColor(pool.status)
  const isLowCapacity = usedPercent >= 80

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.header}>
        <h3 style={styles.name}>{pool.name}</h3>
        <div style={{ ...styles.healthBadge, backgroundColor: healthColor }}>
          {pool.healthy ? (
            <CheckCircle size={12} />
          ) : (
            <AlertTriangle size={12} />
          )}
          <span>{pool.healthy ? '正常' : pool.status_detail || pool.status}</span>
        </div>
      </div>

      {/* Capacity Section */}
      <div style={styles.capacitySection}>
        <GaugeChart
          value={usedPercent}
          size={100}
          strokeWidth={10}
          colorFill={isLowCapacity ? colors.danger : colors.primary}
          showWarning={isLowCapacity}
        />
        <div style={styles.capacityStats}>
          {/* Used */}
          <div style={styles.capacityStatRow}>
            <div style={{ ...styles.capacityLabelRow, minWidth: 56 }}>
              <div style={{ ...styles.capacityDot, backgroundColor: isLowCapacity ? colors.danger : colors.primary }} />
              <span style={styles.capacityLabel}>已用</span>
            </div>
            <span style={{ ...styles.capacityValue, color: isLowCapacity ? colors.danger : colors.text }}>
              {formatBytes(pool.size - (pool.free || 0))}
            </span>
          </div>
          {/* Total */}
          <div style={styles.capacityStatRow}>
            <div style={{ ...styles.capacityLabelRow, minWidth: 56 }}>
              <div style={{ ...styles.capacityDot, backgroundColor: colors.border }} />
              <span style={styles.capacityLabel}>总容量</span>
            </div>
            <span style={styles.capacityValue}>{formatBytes(pool.size)}</span>
          </div>
        </div>
      </div>

      {/* vDev topology preview */}
      <div style={styles.topologyPreview}>
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
          <Lock size={14} color={colors.textTertiary} />
          <span style={styles.statLabel}>加密</span>
          <span style={{ ...styles.statValue, color: pool.encrypt ? colors.success : colors.textTertiary }}>
            {pool.encrypt ? '已启用' : '已禁用'}
          </span>
        </div>
        <div style={styles.statItem}>
          <Shield size={14} color={colors.textTertiary} />
          <span style={styles.statLabel}>自动整理</span>
          <span style={styles.statValue}>{pool.autotrim?.value === 'on' ? '已启用' : '已禁用'}</span>
        </div>
      </div>
    </div>
  )
}

function getVdevTypeLabel(type: VDevType): string {
  const labels: Record<VDevType, string> = {
    [VDevType.Data]: '数据',
    [VDevType.Log]: '日志',
    [VDevType.Special]: '元数据',
    [VDevType.Spare]: '热备',
    [VDevType.Dedup]: '重删',
    [VDevType.Cache]: '缓存',
  }
  return labels[type] || type
}

const styles = {
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  } as React.CSSProperties,
  name: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
  } as React.CSSProperties,
  healthBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    color: 'white',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
  } as React.CSSProperties,
  capacitySection: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  } as React.CSSProperties,
  capacityStats: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  } as React.CSSProperties,
  capacityStatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,
  capacityLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    width: 56,
  } as React.CSSProperties,
  capacityDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
  } as React.CSSProperties,
  capacityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 0,
  } as React.CSSProperties,
  capacityValue: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
  } as React.CSSProperties,
  topologyPreview: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  topologyTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  } as React.CSSProperties,
  topologyTag: {
    padding: '4px 10px',
    backgroundColor: colors.background,
    borderRadius: 6,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 500,
  } as React.CSSProperties,
  stats: {
    display: 'flex',
    gap: 16,
  } as React.CSSProperties,
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  } as React.CSSProperties,
  statValue: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
}
