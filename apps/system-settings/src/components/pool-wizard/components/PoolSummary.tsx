/**
 * Pool Summary Component
 * Display pool configuration summary
 */

import React from 'react'
import { VDevType, vdevTypeLabels } from '@truenas/types/vdev-enum-types'
import { PoolManagerTopology } from '../store/poolWizardStore'
import { getNonEmptyCategories, formatBytes, calculateVdevUsableCapacity } from '../utils/topology-utils'
import { colors } from '@apps/system-settings/styles/theme'

interface PoolSummaryProps {
  name: string
  topology: PoolManagerTopology
  encryption: boolean
  encryptionType: string
}

export function PoolSummary({
  name,
  topology,
  encryption,
  encryptionType,
}: PoolSummaryProps) {
  const categories = getNonEmptyCategories(topology)

  const formatLayout = (layout: string | null): string => {
    if (!layout) return '-'
    return layout.replace('DRAID', 'dRAID')
  }

  const getCategoryStats = (category: PoolManagerTopology[VDevType]) => {
    const totalDisks = category.vdevs.reduce((sum, vdev) => sum + vdev.length, 0)
    const totalSize = category.vdevs.reduce(
      (sum, vdev) => sum + calculateVdevUsableCapacity(vdev, category.layout ?? null),
      0
    )
    return { totalDisks, totalSize }
  }

  return (
    <div style={styles.container}>
      {/* Pool Info */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>池信息</h4>
        <div style={styles.infoGrid}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>名称</span>
            <span style={styles.infoValue}>{name || '-'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>加密</span>
            <span style={styles.infoValue}>
              {encryption
                ? encryptionType === 'software'
                  ? '软件加密'
                  : encryptionType === 'sed'
                    ? 'SED'
                    : '已启用'
                : '无'}
            </span>
          </div>
        </div>
      </div>

      {/* Vdev Categories */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>存储拓扑</h4>
        {categories.length === 0 ? (
          <div style={styles.empty}>尚未配置任何vdev</div>
        ) : (
          <div style={styles.categoryList}>
            {categories.map(({ type, category }) => {
              const stats = getCategoryStats(category)
              return (
                <div key={type} style={styles.category}>
                  <div style={styles.categoryHeader}>
                    <span style={styles.categoryName}>
                      {vdevTypeLabels[type] || type}
                    </span>
                    <span style={styles.categoryLayout}>
                      {formatLayout(category.layout ?? null)}
                    </span>
                  </div>
                  <div style={styles.categoryStats}>
                    <span>
                      {category.vdevs.length} vdev{category.vdevs.length > 1 ? 's' : ''} ·{' '}
                      {stats.totalDisks} 块硬盘 · {formatBytes(stats.totalSize)}
                    </span>
                  </div>
                  {/* Vdev breakdown */}
                  <div style={styles.vdevList}>
                    {category.vdevs.map((vdev, index) => {
                      const vdevSize = calculateVdevUsableCapacity(vdev, category.layout ?? null)
                      return (
                        <div key={index} style={styles.vdevItem}>
                          <span style={styles.vdevLabel}>
                            Vdev {index + 1}: {vdev.map((d) => d.name).join(', ')}
                          </span>
                          <span style={styles.vdevSize}>{formatBytes(vdevSize)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Total */}
      {categories.length > 0 && (
        <div style={styles.totalSection}>
          <span style={styles.totalLabel}>总硬盘数:</span>
          <span style={styles.totalValue}>
            {categories.reduce(
              (sum, { category }) =>
                sum + category.vdevs.reduce((s, vdev) => s + vdev.length, 0),
              0
            )}{' '}
            块
          </span>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  section: {
    padding: 16,
    borderBottom: `1px solid ${colors.border}`,
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
  },
  empty: {
    padding: 24,
    textAlign: 'center' as const,
    color: colors.textSecondary,
    fontSize: 14,
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  category: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  categoryLayout: {
    fontSize: 13,
    fontWeight: 500,
    color: colors.primary,
    backgroundColor: `${colors.primary}15`,
    padding: '2px 8px',
    borderRadius: 4,
  },
  categoryStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  vdevList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  vdevItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: colors.cardBg,
    borderRadius: 4,
    fontSize: 12,
  },
  vdevLabel: {
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  vdevSize: {
    color: colors.textSecondary,
    marginLeft: 8,
    flexShrink: 0,
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: `${colors.primary}10`,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.primary,
  },
}
