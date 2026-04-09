/**
 * Storage Overview Component
 * Main storage tab showing pool overview and datasets
 */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Pool } from '@truenas/types/pool'
import { Dataset } from '@truenas/types/dataset-types'
import { PoolList, PoolDetails } from './pools'
import { PoolWizard } from './pool-wizard'
import { DatasetTree } from './datasets'
import { colors } from '../styles/theme'

interface StorageOverviewProps {
  pools: Pool[]
  datasets: Dataset[]
  onPoolClick?: (pool: Pool) => void
}

export function StorageOverview({ pools, datasets, onPoolClick }: StorageOverviewProps) {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

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

  return (
    <div>
      {/* Pool List */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Storage Pools</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} /> 创建池
          </button>
        </div>
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

      {/* Create Pool Wizard Modal */}
      <PoolWizard
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false)
          // Parent will refresh pools
        }}
      />
    </div>
  )
}

const styles = {
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
}
