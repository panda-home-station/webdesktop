/**
 * Storage Overview Component
 * Main storage tab showing pool overview and datasets
 */

import { useState } from 'react'
import { Pool } from '@truenas/types/pool'
import { Dataset } from '@truenas/types/dataset-types'
import { PoolList, PoolDetails } from './pools'
import { DatasetTree } from './datasets'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../styles/theme'

interface StorageOverviewProps {
  pools: Pool[]
  datasets: Dataset[]
  onPoolClick?: (pool: Pool) => void
}

export function StorageOverview({ pools, datasets, onPoolClick }: StorageOverviewProps) {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)

  // If a pool is selected, show its details
  if (selectedPool) {
    const poolDatasets = datasets.filter(d => d.pool === selectedPool.name)
    return (
      <PoolDetails
        pool={selectedPool}
        datasets={poolDatasets}
        onBack={() => setSelectedPool(null)}
        onDiskClick={() => {
          // Could navigate to disk details
        }}
        onDatasetClick={() => {
          // Could navigate to dataset details
        }}
      />
    )
  }

  // Calculate total capacity
  const totalSize = pools.reduce((sum, pool) => sum + pool.size, 0)
  const totalUsed = pools.reduce((sum, pool) => {
    const used = (pool.allocated || 0) - (pool.free || 0)
    return sum + used
  }, 0)
  const totalUsedPercent = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0

  return (
    <div>
      {/* Capacity Overview */}
      <div style={styles.capacityCard}>
        <div style={styles.capacityHeader}>
          <h3 style={styles.capacityTitle}>Storage Capacity</h3>
          <span style={styles.capacityCount}>{pools.length} Pool{pools.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={styles.capacityBar}>
          <div
            style={{
              ...styles.capacityFill,
              width: `${totalUsedPercent}%`,
              backgroundColor: totalUsedPercent > 90 ? colors.danger : totalUsedPercent > 70 ? colors.warning : colors.success,
            }}
          />
        </div>
        <div style={styles.capacityStats}>
          <div>
            <span style={styles.capacityLabel}>Used</span>
            <span style={styles.capacityValue}>{formatBytes(totalUsed)}</span>
          </div>
          <div>
            <span style={styles.capacityLabel}>Total</span>
            <span style={styles.capacityValue}>{formatBytes(totalSize)}</span>
          </div>
          <div>
            <span style={styles.capacityLabel}>Available</span>
            <span style={styles.capacityValue}>{formatBytes(totalSize - totalUsed)}</span>
          </div>
        </div>
      </div>

      {/* Pool List */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Storage Pools</h3>
        <PoolList
          pools={pools}
          onPoolClick={(pool) => {
            if (onPoolClick) {
              onPoolClick(pool)
            } else {
              setSelectedPool(pool)
            }
          }}
        />
      </div>

      {/* Dataset Tree */}
      {datasets.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Datasets</h3>
          {/* Only show top-level datasets (those that belong to a pool) */}
          <DatasetTree
            datasets={datasets.filter(d => !d.name.includes('/'))}
            onDatasetClick={() => {
              // Could navigate to dataset details
            }}
          />
        </div>
      )}
    </div>
  )
}

const styles = {
  capacityCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  capacityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  capacityTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  capacityCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  capacityBar: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.3s ease',
  },
  capacityStats: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  capacityLabel: {
    display: 'block',
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: 14,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
}
