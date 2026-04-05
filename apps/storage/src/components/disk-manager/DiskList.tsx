/**
 * Disk List Component
 * Display list of disks with filters and actions
 */

import React, { useState } from 'react';
import { useDiskStore } from '@truenas/stores/disk';
import { StorageDashboardDisk } from '@truenas/types/disk';
import { formatBytes, getDiskTypeLabel } from '@truenas/utils/storage.utils';
import DiskFilters from './DiskFilters';
import DiskTable from './DiskTable';

export default function DiskList() {
  const {
    disks,
    isLoading,
    loadDisks,
  } = useDiskStore();

  const [filters, setFilters] = useState({
    type: 'ALL',
    pool: 'ALL',
    showAvailable: false,
  });

  const [filteredDisks, setFilteredDisks] = useState<StorageDashboardDisk[]>([]);

  React.useEffect(() => {
    loadDisks();
  }, [loadDisks]);

  React.useEffect(() => {
    let result = [...disks];

    // Filter by type
    if (filters.type !== 'ALL') {
      result = result.filter((d) => d.type === filters.type);
    }

    // Filter by pool
    if (filters.pool !== 'ALL') {
      result = result.filter((d) => d.pool === filters.pool);
    }

    // Filter by available
    if (filters.showAvailable) {
      result = result.filter((d) => !d.pool || d.pool === '');
    }

    setFilteredDisks(result);
  }, [disks, filters]);

  const uniquePools = Array.from(new Set(disks.map((d) => d.pool).filter(Boolean)));
  const diskTypes = Array.from(new Set(disks.map((d) => d.type)));

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Disk Management</h2>
        <p style={styles.subtitle}>
          View and manage all physical disks in the system
        </p>
      </div>

      {/* Filters */}
      <DiskFilters
        filters={filters}
        pools={uniquePools}
        types={diskTypes}
        onFiltersChange={setFilters}
      />

      {/* Disk Table */}
      <DiskTable
        disks={filteredDisks}
        isLoading={isLoading}
      />

      {/* Summary */}
      <div style={styles.summary}>
        <SummaryItem
          label="Total Disks"
          value={disks.length}
        />
        <SummaryItem
          label="Filtered Results"
          value={filteredDisks.length}
        />
        <SummaryItem
          label="In Pools"
          value={disks.filter((d) => d.pool && d.pool !== '').length}
        />
        <SummaryItem
          label="Available"
          value={disks.filter((d) => !d.pool || d.pool === '').length}
        />
      </div>
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: number;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div style={styles.summaryItem}>
      <span style={styles.summaryLabel}>{label}</span>
      <span style={styles.summaryValue}>{value.toLocaleString()}</span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    overflow: 'auto' as const,
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  header: {
    padding: '24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    padding: '24px',
    backgroundColor: 'white',
    marginTop: '16px',
  } as React.CSSProperties,
  summaryItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  summaryValue: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
};
