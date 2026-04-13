/**
 * Pool Dashboard Component
 * Modern storage pool overview with gauge charts and info cards
 */

import React from 'react'
import { Pool } from '@truenas/types/pool'
import { Dataset } from '@truenas/types/dataset-types'
import { VDevType } from '@truenas/types/vdev-enum-types'
import { GaugeChart } from '../ui/GaugeChart'
import { StorageHealthCard } from './StorageHealthCard'
import { formatBytes, getPoolHealthColor, getPoolUsedPercentage } from '@truenas/utils/storage.utils'
import { ScrubTask } from '@truenas/types/pool-scrub-types'
import { colors } from '../../styles/theme'
import {
  Database,
  Shield,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react'

interface PoolDashboardProps {
  pool: Pool
  datasets: Dataset[]
  onBack: () => void
  onDiskClick?: (diskName: string) => void
  onDatasetClick?: (dataset: Dataset) => void
}

export function PoolDashboard({
  pool,
  onBack,
}: PoolDashboardProps) {
  const usedPercent = getPoolUsedPercentage(pool)
  const healthColor = getPoolHealthColor(pool.status)
  const isHealthy = pool.healthy
  const isLowCapacity = usedPercent >= 80

  function handleConfigureScrub(poolId: number, existingScrub: ScrubTask | null) {
    // TODO: Open scrub configuration dialog/slide-in
    alert(`配置校验任务 (poolId: ${poolId})\n当前设置: ${existingScrub ? '已配置' : '未设置'}`)
  }

  function handleEditAutotrim(pool: Pool) {
    // TODO: Open autotrim dialog
    const currentValue = pool.autotrim?.value === 'on' ? '开' : '关'
    alert(`编辑自动 TRIM\n池: ${pool.name}\n当前值: ${currentValue}`)
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div style={styles.headerTitle}>
          <h1 style={styles.poolName}>{pool.name}</h1>
          <div style={{ ...styles.healthBadge, backgroundColor: healthColor }}>
            {isHealthy ? (
              <CheckCircle size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}
            <span>{isHealthy ? '正常' : pool.status_detail || pool.status}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* Usage Card */}
        <div style={styles.usageCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>存储使用情况</h3>
          </div>
          <div style={styles.usageContent}>
            <GaugeChart
              value={usedPercent}
              size={180}
              strokeWidth={14}
              colorFill={colors.primary}
              label="已用"
              showWarning={isLowCapacity}
            />
            <div style={styles.usageStats}>
              <div style={styles.usageStatRow}>
                <div style={{ ...styles.usageStatLabelRow, minWidth: 70 }}>
                  <div style={{ ...styles.usageStatDot, backgroundColor: colors.border }} />
                  <span style={styles.usageStatLabel}>可用容量</span>
                </div>
                <span style={styles.usageStatValue}>{formatBytes(pool.size)}</span>
              </div>
              <div style={styles.usageStatRow}>
                <div style={{ ...styles.usageStatLabelRow, minWidth: 70 }}>
                  <div style={{ ...styles.usageStatDot, backgroundColor: isLowCapacity ? colors.danger : colors.primary }} />
                  <span style={styles.usageStatLabel}>已用</span>
                </div>
                <span style={{ ...styles.usageStatValue, color: isLowCapacity ? colors.danger : colors.text }}>
                  {formatBytes(pool.size - (pool.free || 0))}
                </span>
              </div>
              <div style={styles.usageStatRow}>
                <div style={{ ...styles.usageStatLabelRow, minWidth: 70 }}>
                  <div style={{ ...styles.usageStatDot, backgroundColor: colors.success }} />
                  <span style={styles.usageStatLabel}>可用</span>
                </div>
                <span style={styles.usageStatValue}>{formatBytes(pool.free || 0)}</span>
              </div>
            </div>
          </div>
          {isLowCapacity && (
            <div style={styles.warningBanner}>
              <AlertTriangle size={16} />
              <span>容量不足警告：存储池已使用超过 80%</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={styles.statsColumn}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Database size={20} color={colors.primary} />
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>已分配</span>
              <span style={styles.statValue}>{formatBytes(pool.allocated || 0)}</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Shield size={20} color={pool.encrypt ? colors.success : colors.textTertiary} />
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>加密</span>
              <span style={{ ...styles.statValue, color: pool.encrypt ? colors.success : colors.textSecondary }}>
                {pool.encrypt ? '已启用' : '已禁用'}
              </span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Activity size={20} color={colors.primary} />
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statLabel}>自动整理</span>
              <span style={styles.statValue}>{pool.autotrim?.value === 'on' ? '已启用' : '已禁用'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Health Card */}
      <div style={styles.healthCardSection}>
        <StorageHealthCard
          pool={pool}
          onConfigureScrub={handleConfigureScrub}
          onEditAutotrim={handleEditAutotrim}
        />
      </div>

      {/* Topology Section */}
      <div style={styles.topologySection}>
        <h3 style={styles.sectionTitle}>存储池拓扑</h3>
        <div style={styles.topologyGrid}>
          {Object.entries(pool.topology)
            .filter(([key]) => key !== 'spare')
            .map(([type, vdevs]) => {
              if (!vdevs || vdevs.length === 0) return null
              return (
                <div key={type} style={styles.topologyCard}>
                  <div style={styles.topologyHeader}>
                    <span style={styles.topologyType}>{getVdevTypeLabel(type as VDevType)}</span>
                    <span style={styles.topologyCount}>{vdevs.length} {vdevs.length === 1 ? '个vdev' : '个vdev'}</span>
                  </div>
                  <div style={styles.topologyDisks}>
                    {vdevs.slice(0, 6).map((vdev: any, idx: number) => (
                      <div key={idx} style={styles.diskItem}>
                        <HardDrive size={14} color={colors.textTertiary} />
                        <span style={styles.diskName}>{vdev.type || type}</span>
                      </div>
                    ))}
                    {vdevs.length > 6 && (
                      <div style={styles.moreDisks}>+{vdevs.length - 6} 更多</div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Details Section */}
      <div style={styles.detailsSection}>
        <h3 style={styles.sectionTitle}>存储池详情</h3>
        <div style={styles.detailsGrid}>
          <DetailItem label="GUID" value={pool.guid} mono />
          <DetailItem label="状态" value={pool.status} />
          <DetailItem label="重复删除" value={pool.dedup_table_quota || '关闭'} />
          {pool.fragmentation !== undefined && (
            <DetailItem label="碎片化" value={`${pool.fragmentation}%`} />
          )}
        </div>
      </div>
    </div>
  )
}

interface DetailItemProps {
  label: string
  value: string
  mono?: boolean
}

function DetailItem({ label, value, mono }: DetailItemProps) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{ ...styles.detailValue, fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 28,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: colors.primary,
    transition: 'all 0.2s ease',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flex: 1,
  },
  poolName: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: colors.text,
    flexShrink: 0,
  },
  healthBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    color: 'white',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  healthCardSection: {
    marginBottom: 24,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: 20,
    marginBottom: 28,
  },
  usageCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  usageContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 40,
  },
  usageStats: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  usageStatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  usageStatLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    width: 70,
    flexShrink: 0,
  },
  usageStatDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
  },
  usageStatLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    flexShrink: 0,
  },
  usageStatValue: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
  },
  warningBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: '12px 16px',
    backgroundColor: '#fff5f5',
    border: `1px solid ${colors.danger}20`,
    borderRadius: 10,
    color: colors.danger,
    fontSize: 13,
    fontWeight: 500,
  },
  statsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  statIcon: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  },
  topologySection: {
    marginBottom: 28,
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  topologyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  topologyCard: {
    padding: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  topologyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topologyType: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  topologyCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  topologyDisks: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  diskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  diskName: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  moreDisks: {
    padding: '4px 8px',
    fontSize: 11,
    color: colors.primary,
    fontWeight: 500,
  },
  detailsSection: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: 16,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
    wordBreak: 'break-all' as const,
  },
}