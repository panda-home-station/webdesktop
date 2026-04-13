/**
 * Pool Details Component
 * Display detailed information about a single pool
 */

import React, { useState } from 'react'
import { Pool } from '@truenas/types/pool'
import { Dataset } from '@truenas/types/dataset-types'
import { VDevTree } from './VDevTree'
import { DatasetTree } from '../datasets/DatasetTree'
import { formatBytes, getPoolHealthColor, getPoolUsedPercentage } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'

interface PoolDetailsProps {
  pool: Pool
  datasets: Dataset[]
  onBack: () => void
  onDiskClick?: (diskName: string) => void
  onDatasetClick?: (dataset: Dataset) => void
}

export function PoolDetails({
  pool,
  datasets,
  onBack,
  onDiskClick,
  onDatasetClick,
}: PoolDetailsProps) {
  const [activeSection, setActiveSection] = useState<'topology' | 'datasets'>('topology')

  const usedPercent = getPoolUsedPercentage(pool)
  const healthColor = getPoolHealthColor(pool.status)

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <h2 style={styles.title}>{pool.name}</h2>
        <span style={{ ...styles.badge, backgroundColor: healthColor }}>
          {pool.healthy ? 'Healthy' : pool.status_detail || pool.status}
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

      {/* Section Tabs */}
      <div style={styles.tabs}>
        <TabButton
          active={activeSection === 'topology'}
          onClick={() => setActiveSection('topology')}
        >
          Topology
        </TabButton>
        <TabButton
          active={activeSection === 'datasets'}
          onClick={() => setActiveSection('datasets')}
        >
          Datasets
        </TabButton>
      </div>

      {/* Section Content */}
      <div style={styles.sectionContent}>
        {activeSection === 'topology' && (
          <VDevTree
            topology={pool.topology}
            onDiskClick={onDiskClick}
          />
        )}
        {activeSection === 'datasets' && (
          <DatasetTree
            datasets={datasets.filter(d => d.pool === pool.name)}
            onDatasetClick={onDatasetClick}
          />
        )}
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

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      style={{
        ...styles.tabButton,
        ...(active ? styles.tabButtonActive : {}),
      }}
      onClick={onClick}
    >
      {children}
    </button>
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
    padding: '6px 14px',
    color: 'white',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
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
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    borderBottom: `1px solid ${colors.border}`,
    paddingBottom: 0,
  },
  tabButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `2px solid transparent`,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: colors.textSecondary,
    transition: 'all 0.2s ease',
  },
  tabButtonActive: {
    color: colors.primary,
    borderBottom: `2px solid ${colors.primary}`,
  },
  sectionContent: {
    marginBottom: 24,
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
