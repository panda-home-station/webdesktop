/**
 * Storage Dashboard Component
 * Main container for storage management
 */

import React, { useEffect } from 'react';
import { useStorageDashboardStore } from '@truenas/stores/storage-dashboard';
import StorageHeader from './StorageHeader';
import SummaryStats from './SummaryStats';
import PoolList from './PoolList';
import DiskHealthCard from './DiskHealthCard';
import UnusedResources from './UnusedResources';

export default function StorageDashboard() {
  const {
    isLoading,
    isRefreshing,
    pools,
    disks,
    scrubs,
    error,
    loadDashboard,
    refreshDashboard,
  } = useStorageDashboardStore();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <StorageHeader
        onRefresh={refreshDashboard}
        isRefreshing={isRefreshing}
      />

      {/* Error Display */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div style={styles.loading}>
          Loading...
        </div>
      ) : (
        <div style={styles.content}>
          {/* Summary Stats */}
          <SummaryStats
            poolCount={pools.length}
            diskCount={disks.length}
            scrubCount={scrubs.length}
          />

          {/* Pools List */}
          <PoolList pools={pools} />

          {/* Disk Health */}
          <DiskHealthCard disks={disks} />

          {/* Unused Resources */}
          <UnusedResources disks={disks} />
        </div>
      )}
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
  error: {
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '8px',
    border: '1px solid #ffcdd2',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    height: '400px',
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    padding: '24px',
    maxWidth: '1400px',
  } as React.CSSProperties,
};
