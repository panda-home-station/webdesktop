/**
 * Pool Details Component
 * Display detailed information about a single pool
 */

import { Pool } from '@truenas/types/pool'
import { Dataset } from '@truenas/types/dataset-types'
import { VDevsCard } from './VDevsCard'
import { DatasetsCard } from './DatasetsCard'
import { formatBytes, getPoolHealthColor, getPoolUsedPercentage } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface PoolDetailsProps {
  pool: Pool
  datasets: Dataset[]
  onBack: () => void
  onDiskClick?: (diskName: string) => void
  onDatasetClick?: (dataset: Dataset) => void
  onAddDataset?: () => void
}

export function PoolDetails({
  pool,
  datasets,
  onBack,
  onDiskClick,
  onDatasetClick,
  onAddDataset,
}: PoolDetailsProps) {
  const usedPercent = getPoolUsedPercentage(pool)
  const healthColor = getPoolHealthColor(pool.status)

  function getHealthIcon() {
    if (pool.status === 'ONLINE' && pool.healthy) {
      return <CheckCircle size={16} color="white" />
    }
    if (pool.status === 'DEGRADED') {
      return <AlertTriangle size={16} color="white" />
    }
    return <XCircle size={16} color="white" />
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <h2 style={styles.title}>{pool.name}</h2>
        <span style={{ ...styles.badge, backgroundColor: healthColor }}>
          {getHealthIcon()}
          <span style={styles.badgeText}>
            {pool.healthy ? 'Healthy' : pool.status_detail || pool.status}
          </span>
        </span>
      </div>

      {/* Stats Overview */}
      <div style={styles.statsGrid}>
        <StatCard
          label="Capacity"
          value={`${formatBytes(pool.allocated || 0)} / ${formatBytes(pool.size)}`}
          subValue={`${usedPercent.toFixed(1)}% used`}
        />
        <StatCard
          label="Free"
          value={formatBytes(pool.free || 0)}
        />
        <StatCard
          label="Allocated"
          value={formatBytes(pool.allocated || 0)}
        />
        <StatCard
          label="Encryption"
          value={pool.encrypt ? 'Enabled' : 'Disabled'}
        />
      </div>

      {/* Capacity Bar */}
      <div style={styles.capacitySection}>
        <div style={styles.capacityBar}>
          <div
            style={{
              ...styles.capacityFill,
              width: `${usedPercent}%`,
              backgroundColor: usedPercent > 90 ? colors.danger : usedPercent > 70 ? colors.warning : colors.success,
            }}
          />
        </div>
        <div style={styles.capacityLegend}>
          <span>Used: {formatBytes(pool.allocated || 0)}</span>
          <span>Free: {formatBytes(pool.free || 0)}</span>
        </div>
      </div>

      {/* Two Bubble Cards Layout */}
      <div style={styles.cardsContainer}>
        <div style={styles.cardColumn}>
          <VDevsCard
            topology={pool.topology}
            onDiskClick={onDiskClick}
            onViewDetails={() => window.open(`${window.location.origin}/storage/${pool.id}/vdevs`, '_blank')}
          />
        </div>
        <div style={styles.cardColumn}>
          <DatasetsCard
            datasets={datasets}
            onDatasetClick={onDatasetClick}
            onAddDataset={onAddDataset}
            onViewDetails={() => window.open(`${window.location.origin}/datasets/${pool.name}`, '_blank')}
          />
        </div>
      </div>

      {/* Additional Info */}
      <div style={styles.additionalInfo}>
        <InfoRow label="GUID" value={pool.guid} />
        <InfoRow label="Status" value={pool.status} />
        <InfoRow label="Auto Trim" value={pool.autotrim?.value || 'off'} />
        <InfoRow label="Deduplication" value={pool.dedup_table_quota || 'Off'} />
        {pool.fragmentation !== undefined && (
          <InfoRow label="Fragmentation" value={`${pool.fragmentation}%`} />
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  subValue?: string
}

function StatCard({ label, value, subValue }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
      {subValue && <span style={styles.statSubValue}>{subValue}</span>}
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  )
}

const styles = {
  container: {
    padding: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: colors.primary,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: colors.text,
    flex: 1,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    color: 'white',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
  },
  badgeText: {
    fontSize: 13,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 600,
    color: colors.text,
  },
  statSubValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  capacitySection: {
    marginBottom: 24,
  },
  capacityBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.3s ease',
  },
  capacityLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 24,
  },
  cardColumn: {
    minWidth: 0,
  },
  additionalInfo: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 16,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
  },
}