/**
 * Pool List Component
 * Display list of storage pools
 */

import React, { useState } from 'react';
import { Pool } from '@truenas/types/pool';
import {
  formatBytes,
  getUsageColor,
  getPoolStatusLabel,
  getPoolHealthColor,
  getPoolUsedPercentage,
} from '@truenas/utils/storage.utils';

interface PoolListProps {
  pools: Pool[];
}

export default function PoolList({ pools }: PoolListProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Storage Pools</h2>
        <span style={styles.count}>{pools.length} pools</span>
      </div>

      {pools.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No storage pools found</p>
          <p style={styles.emptySubtext}>Create a pool to start using your storage</p>
        </div>
      ) : (
        <div style={styles.poolGrid}>
          {pools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}
    </div>
  );
}

interface PoolCardProps {
  pool: Pool;
}

function PoolCard({ pool }: PoolCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const usedPercentage = getPoolUsedPercentage(pool);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.titleSection}>
          <h3 style={styles.poolName}>{pool.name}</h3>
          <StatusBadge
            status={getPoolStatusLabel(pool.status)}
            color={getPoolHealthColor(pool.status)}
          />
        </div>

        <div style={styles.capacitySection}>
          <span style={styles.capacityLabel}>Capacity</span>
          <span style={styles.capacityValue}>{pool.size_str || formatBytes(pool.size)}</span>
        </div>
      </div>

      {/* Usage Bar */}
      <div style={styles.usageSection}>
        <div style={styles.usageBar}>
          <div
            style={{
              ...styles.usageFill,
              width: `${usedPercentage}%`,
              backgroundColor: getUsageColor(usedPercentage),
            }}
          />
        </div>
        <span style={styles.usageText}>{usedPercentage.toFixed(1)}% used</span>
      </div>

      {/* Status Details */}
      {pool.status_detail && (
        <div style={styles.statusDetail}>
          <span style={styles.statusDetailText}>{pool.status_detail}</span>
        </div>
      )}

      {/* Expandable Details */}
      {isExpanded && (
        <div style={styles.details}>
          <DetailRow label="ID" value={pool.id} />
          <DetailRow label="GUID" value={pool.guid} />
          <DetailRow label="Path" value={pool.path} />
          <DetailRow label="Encryption" value={pool.encrypt ? 'Yes' : 'No'} />
          <DetailRow label="Auto Trim" value={pool.autotrim?.value || pool.autotrim} />
          <DetailRow label="Deduplication" value={pool.dedup_table_quota || pool.dedup_table || 'Off'} />
          {pool.dedup_table_size > 0 && (
            <DetailRow label="Dedup Size" value={formatBytes(pool.dedup_table_size)} />
          )}
        </div>
      )}

      {/* Expand Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={styles.expandButton}
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </button>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  color: string;
}

function StatusBadge({ status, color }: StatusBadgeProps) {
  return (
    <span style={{ ...styles.badge, backgroundColor: color }}>
      {status}
    </span>
  );
}

interface DetailRowProps {
  label: string;
  value: string | number;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}:</span>
      <span style={styles.detailValue}>{String(value)}</span>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  count: {
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  } as React.CSSProperties,
  emptyText: {
    margin: 0,
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
  emptySubtext: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#999',
  } as React.CSSProperties,
  poolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,
  card: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  } as React.CSSProperties,
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  poolName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  badge: {
    padding: '4px 12px',
    color: 'white',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
  } as React.CSSProperties,
  capacitySection: {
    textAlign: 'right' as const,
  } as React.CSSProperties,
  capacityLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  } as React.CSSProperties,
  capacityValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  usageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  } as React.CSSProperties,
  usageBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden' as const,
  } as React.CSSProperties,
  usageFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  usageText: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
  } as React.CSSProperties,
  statusDetail: {
    padding: '8px 0',
    borderTop: '1px solid #f0f0f0',
  } as React.CSSProperties,
  statusDetailText: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  details: {
    padding: '12px 0',
    borderTop: '1px solid #f0f0f0',
  } as React.CSSProperties,
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
  } as React.CSSProperties,
  detailLabel: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  detailValue: {
    fontSize: '13px',
    color: '#1a1a1a',
    fontWeight: 500,
  } as React.CSSProperties,
  expandButton: {
    width: '100%',
    padding: '8px',
    marginTop: '12px',
    backgroundColor: 'transparent',
    color: '#1976d2',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  } as React.CSSProperties,
};
