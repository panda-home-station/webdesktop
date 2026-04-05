/**
 * Disk Table Component
 * Display disks in a table format
 */

import React from 'react';
import { StorageDashboardDisk } from '@truenas/types/disk';
import { formatBytes, getDiskTypeLabel } from '@truenas/utils/storage.utils';

interface DiskTableProps {
  disks: StorageDashboardDisk[];
  isLoading: boolean;
}

export default function DiskTable({ disks, isLoading }: DiskTableProps) {
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading disks...</div>
      </div>
    );
  }

  if (disks.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No disks found</p>
        <p style={styles.emptySubtext}>Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Table Header */}
      <div style={styles.header}>
        <div style={styles.columnHeader}>Name</div>
        <div style={styles.columnHeader}>Type</div>
        <div style={styles.columnHeader}>Model</div>
        <div style={styles.columnHeader}>Serial</div>
        <div style={styles.columnHeader}>Size</div>
        <div style={styles.columnHeader}>Pool</div>
        <div style={styles.columnHeader}>Status</div>
      </div>

      {/* Table Rows */}
      {disks.map((disk, index) => (
        <DiskRow key={disk.name} disk={disk} index={index} />
      ))}
    </div>
  );
}

interface DiskRowProps {
  disk: StorageDashboardDisk;
  index: number;
}

function DiskRow({ disk, index }: DiskRowProps) {
  const inPool = disk.pool && disk.pool !== '';
  const hasAlerts = disk.alerts.length > 0;

  return (
    <div
      style={{
        ...styles.row,
        backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
      }}
    >
      {/* Name */}
      <div style={styles.cell}>
        <div style={styles.diskName}>{disk.name}</div>
        {disk.description && (
          <div style={styles.diskDescription}>{disk.description}</div>
        )}
      </div>

      {/* Type */}
      <div style={styles.cell}>
        <span style={styles.typeBadge}>{getDiskTypeLabel(disk.type)}</span>
      </div>

      {/* Model */}
      <div style={styles.cell}>{disk.model}</div>

      {/* Serial */}
      <div style={styles.cell}>{disk.serial}</div>

      {/* Size */}
      <div style={styles.cell}>{formatBytes(disk.size)}</div>

      {/* Pool */}
      <div style={styles.cell}>
        {inPool ? (
          <span style={styles.poolBadge}>{disk.pool}</span>
        ) : (
          <span style={styles.availableBadge}>Available</span>
        )}
      </div>

      {/* Status */}
      <div style={styles.cell}>
        <div style={styles.cell}>
          {/* Alerts */}
          {hasAlerts && (
            <div style={styles.alertsBadge}>{disk.alerts.length}</div>
          )}

          {/* SED Status */}
          {disk.sed && (
            <span style={styles.sedBadge}>SED</span>
          )}

          {/* Status */}
          {inPool ? (
            <span style={styles.statusInPool}>In Pool</span>
          ) : (
            <span style={styles.statusAvailable}>Available</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  header: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr 1fr 1fr 1fr 1fr 120px',
    gap: '16px',
    padding: '12px 24px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    fontWeight: 600,
    fontSize: '13px',
    color: '#333',
  } as React.CSSProperties,
  columnHeader: {
    textAlign: 'left' as const,
  } as React.CSSProperties,
  row: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr 1fr 1fr 1fr 1fr 120px',
    gap: '16px',
    padding: '12px 24px',
    borderBottom: '1px solid #f0f0f0',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  } as React.CSSProperties,
  cell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  } as React.CSSProperties,
  diskName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
  } as React.CSSProperties,
  diskDescription: {
    fontSize: '12px',
    color: '#666',
  } as React.CSSProperties,
  typeBadge: {
    padding: '4px 8px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  poolBadge: {
    padding: '4px 8px',
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  availableBadge: {
    padding: '4px 8px',
    backgroundColor: '#fff3e0',
    color: '#ff9800',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  alertsBadge: {
    display: 'inline-block',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    lineHeight: '20px',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    marginRight: '8px',
  } as React.CSSProperties,
  sedBadge: {
    padding: '4px 8px',
    backgroundColor: '#9c27b0',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    marginRight: '8px',
  } as React.CSSProperties,
  statusInPool: {
    padding: '4px 8px',
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  statusAvailable: {
    padding: '4px 8px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
  } as React.CSSProperties,
  loading: {
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
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
};
