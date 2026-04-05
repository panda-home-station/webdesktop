/**
 * Summary Stats Component
 * Display summary statistics for storage
 */

import React from 'react';
import { useStorageDashboardStore } from '@truenas/stores/storage-dashboard';
import { formatBytes, getTotalPoolCapacity, getTotalPoolUsed } from '@truenas/utils/storage.utils';
import { Pool } from '@truenas/types/pool';

interface SummaryStatsProps {
  poolCount?: number;
  diskCount?: number;
  scrubCount?: number;
}

export default function Summary({ poolCount, diskCount, scrubCount }: SummaryStatsProps) {
  // Use store values if not provided
  const store = useStorageDashboardStore();
  const actualPoolCount = poolCount ?? store.pools.length;
  const actualDiskCount = diskCount ?? store.disks.length;
  const actualScrubCount = scrubCount ?? store.scrubs.length;

  const totalCapacity = getTotalPoolCapacity(store.pools);
  const totalUsed = getTotalPoolUsed(store.pools);
  const totalAvailable = totalCapacity - totalUsed;
  const usedPercentage = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

  return (
    <div style={styles.grid}>
      {/* Pool Count */}
      <StatCard
        title="Pools"
        value={actualPoolCount}
        icon="storage"
        color="#1976d2"
      />

      {/* Disk Count */}
      <StatCard
        title="Disks"
        value={actualDiskCount}
        icon="hard_drive"
        color="#2196f3"
      />

      {/* Scrub Tasks */}
      <StatCard
        title="Scrub Tasks"
        value={actualScrubCount}
        icon="schedule"
        color={actualScrubCount > 0 ? '#ff9800' : '#9e9e9e'}
      />

      {/* Total Capacity */}
      <div style={styles.capacityCard}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>Total Capacity</span>
        </div>
        <div style={styles.capacityValue}>
          <div style={styles.capacityText}>{formatBytes(totalCapacity)}</div>
          <div style={styles.capacityDetail}>
            {formatBytes(totalUsed)} used ({usedPercentage.toFixed(1)}%)
          </div>
        </div>
        {/* Progress Bar */}
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${usedPercentage}%`,
              backgroundColor: getUsageColor(usedPercentage),
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon?: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>{title}</span>
        {icon && (
          <span style={{ ...styles.cardIcon, color }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ ...styles.cardValue, color }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function getUsageColor(percentage: number): string {
  if (percentage >= 90) return '#f44336';
  if (percentage >= 70) return '#ff9800';
  if (percentage >= 50) return '#ffeb3b';
  return '#4caf50';
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 500,
  } as React.CSSProperties,
  cardIcon: {
    fontSize: '20px',
  } as React.CSSProperties,
  cardValue: {
    fontSize: '32px',
    fontWeight: 600,
  } as React.CSSProperties,
  capacityCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    gridColumn: 'span 2' as const,
  } as React.CSSProperties,
  capacityValue: {
    marginBottom: '12px',
  } as React.CSSProperties,
  capacityText: {
    fontSize: '32px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  capacityDetail: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  } as React.CSSProperties,
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden' as const,
  } as React.CSSProperties,
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
};
