/**
 * Pool List Component
 * Display a list of storage pools
 */

import React from 'react'
import { Pool } from '@truenas/types/pool'
import { PoolCard } from './PoolCard'
import { colors } from '../../styles/theme'

interface PoolListProps {
  pools: Pool[]
  onPoolClick: (pool: Pool) => void
}

export function PoolList({ pools, onPoolClick }: PoolListProps) {
  if (pools.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🏊</div>
        <h4 style={styles.emptyTitle}>No Storage Pools</h4>
        <p style={styles.emptyText}>
          Create a pool to start using your storage
        </p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {pools.map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            onClick={() => onPoolClick(pool)}
          />
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: 24,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  } as React.CSSProperties,
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: colors.textSecondary,
  } as React.CSSProperties,
}
