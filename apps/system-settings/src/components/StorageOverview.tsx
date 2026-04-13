/**
 * Storage Overview Component
 * Main storage tab showing pool overview
 */

import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Pool } from '@truenas/types/pool'
import { Dataset } from '@truenas/types/dataset-types'
import { poolService } from '@truenas/services/pool'
import { PoolList, PoolDashboard } from './pools'
import { VDevsPage, DatasetsPage } from './pools'
import { CreatePoolPage } from './pool-wizard'
import { colors } from '../styles/theme'

interface StorageOverviewProps {
  view: string
  onViewChange: (view: string) => void
  pools: Pool[]
  datasets: Dataset[]
  onPoolClick?: (pool: Pool) => void
  onPoolsRefresh?: (pools: Pool[]) => void
}

export function StorageOverview({ view, onViewChange, pools, datasets, onPoolClick, onPoolsRefresh }: StorageOverviewProps) {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)

  // Handle pool creation success
  const handleCreateSuccess = useCallback(async () => {
    onViewChange('overview')
    // Refresh pools to show the newly created pool
    try {
      const updatedPools = await poolService.query([], { extra: { is_upgraded: true } })
      onPoolsRefresh?.(updatedPools as Pool[])
    } catch (err) {
      console.error('Failed to refresh pools:', err)
    }
  }, [onViewChange, onPoolsRefresh])

  // Handle back from create pool
  const handleBackFromCreate = () => {
    onViewChange('overview')
  }

  // Show create pool page
  if (view === 'create-pool') {
    return (
      <CreatePoolPage
        onBack={handleBackFromCreate}
        onSuccess={handleCreateSuccess}
      />
    )
  }

  // If a pool is selected, show its details
  if (view === 'pool-details' && selectedPool) {
    const poolDatasets = datasets.filter(d => d.pool === selectedPool.name)
    return (
      <PoolDashboard
        pool={selectedPool}
        datasets={poolDatasets}
        onBack={() => {
          onViewChange('overview')
          setSelectedPool(null)
        }}
        onViewVDevs={() => onViewChange('vdevs-details')}
        onViewDatasets={() => onViewChange('datasets-details')}
      />
    )
  }

  // VDEVs detail page
  if (view === 'vdevs-details' && selectedPool) {
    return (
      <VDevsPage
        pool={selectedPool}
        onBack={() => onViewChange('pool-details')}
      />
    )
  }

  // Datasets detail page
  if (view === 'datasets-details' && selectedPool) {
    const poolDatasets = datasets.filter(d => d.pool === selectedPool.name)
    return (
      <DatasetsPage
        poolName={selectedPool.name}
        datasets={poolDatasets}
        onBack={() => onViewChange('pool-details')}
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
            onClick={() => onViewChange('create-pool')}
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
              onViewChange('pool-details')
            }
          }}
        />
      </div>

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
