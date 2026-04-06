/**
 * Disk Health Card Component
 * Display disk health summary
 */

import React from 'react';
import { StorageDashboardDisk } from '@truenas/types/disk';
import { formatBytes, getDiskTypeLabel, getDiskBusLabel } from '@truenas/utils/storage.utils';

interface DiskHealthCardProps {
  disks: StorageDashboardDisk[];
}

export default function DiskHealthCard({ disks }: DiskHealthCardProps) {
  const totalDisks = disks.length;
  const healthyDisks = disks.filter((d) => {
    // Assuming disks in pools are healthy
    return d.pool !== '' && d.pool !== null;
  }).length;
  const availableDisks = disks.filter((d) => {
    return !d.pool || d.pool === '';
  }).length;
  const hddCount = disks.filter((d) => d.type === 'HDD').length;
  const ssdCount = disks.filter((d) => d.type === 'SSD').length;
  const nvmeCount = disks.filter((d) => d.type === 'NVMe').length;
  const otherCount = disks.filter((d) =>
    d.type !== 'HDD' && d.type !== 'SSD' && d.type !== 'NVMe'
  ).length;

  const withAlerts = disks.filter((d) => d.alerts && d.alerts.length > 0).length;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Disk Health</h3>

      <div style={styles.grid}>
        {/* Total Disks */}
        <StatItem
          label="Total Disks"
          value={totalDisks}
        />

        {/* In Pools */}
        <StatItem
          label="In Pools"
          value={healthyDisks}
          color="#4caf50"
        />

        {/* Available */}
        <StatItem
          label="Available"
          value={availableDisks}
          color={availableDisks > 0 ? '#ff9800' : '#9e9e9e'}
        />

        {/* With Alerts */}
        {withAlerts > 0 && (
          <StatItem
            label="With Alerts"
            value={withAlerts}
            color="#f44336"
          />
        )}
      </div>

      {/* Disk Types */}
      <div style={styles.typesSection}>
        <div style={styles.typesTitle}>Disk Types</div>
        <div style={styles.typesGrid}>
          {hddCount > 0 && (
            <TypeBadge type="HDD" count={hddCount} />
          )}
          {ssdCount > 0 && (
            <TypeBadge type="SSD" count={ssdCount} />
          )}
          {nvmeCount > 0 && (
            <TypeBadge type="NVMe" count={nvmeCount} />
          )}
          {otherCount > 0 && (
            <TypeBadge type="Other" count={otherCount} />
          )}
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
  color?: string;
}

function StatItem({ label, value, color = '#1a1a1a' }: StatItemProps) {
  return (
    <div style={styles.statItem}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

interface TypeBadgeProps {
  type: string;
  count: number;
}

function TypeBadge({ type, count }: TypeBadgeProps) {
  return (
    <span style={styles.typeBadge}>
      {type}: {count}
    </span>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  title: {
    margin: '0 0 16px',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  } as React.CSSProperties,
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  statValue: {
    fontSize: '24px',
    fontWeight: 600,
  } as React.CSSProperties,
  typesSection: {
    padding: '16px 0 0',
    borderTop: '1px solid #f0f0f0',
  } as React.CSSProperties,
  typesTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#666',
    marginBottom: '12px',
  } as React.CSSProperties,
  typesGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  } as React.CSSProperties,
  typeBadge: {
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 500,
  } as React.CSSProperties,
};
