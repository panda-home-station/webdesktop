/**
 * Unused Resources Component
 * Display unused disks available for pool creation
 */

import React, { useState } from 'react';
import { StorageDashboardDisk } from '@truenas/types/disk';
import { formatBytes, getDiskTypeLabel } from '@truenas/utils/storage.utils';

interface UnusedResourcesProps {
  disks: StorageDashboardDisk[];
}

export default function UnusedResources({ disks }: UnusedResourcesProps) {
  const [showAll, setShowAll] = useState(false);
  const unusedDisks = disks.filter((d) => !d.pool || d.pool === '');
  const displayDisks = showAll ? unusedDisks : unusedDisks.slice(0, 5);

  if (unusedDisks.length === 0) {
    return null;
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          Unused Resources
          <span style={styles.badge}>{unusedDisks.length}</span>
        </h3>
      </div>

      <div style={styles.diskList}>
        {displayDisks.map((disk) => (
          <DiskItem key={disk.name} disk={disk} />
        ))}
      </div>

      {unusedDisks.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={styles.showMoreButton}
        >
          {showAll ? 'Show Less' : `Show ${unusedDisks.length - 5} More`}
        </button>
      )}
    </div>
  );
}

interface DiskItemProps {
  disk: StorageDashboardDisk;
}

function DiskItem({ disk }: DiskItemProps) {
  return (
    <div style={styles.diskItem}>
      <div style={styles.diskInfo}>
        <div style={styles.diskName}>{disk.name}</div>
        <div style={styles.diskDetails}>
          <span style={styles.diskDetail}>{getDiskTypeLabel(disk.type)}</span>
          <span style={styles.diskDetail}>{formatBytes(disk.size)}</span>
        </div>
        {disk.model && (
          <div style={styles.diskModel}>{disk.model}</div>
        )}
      </div>

      {/* Alerts */}
      {disk.alerts.length > 0 && (
        <div style={styles.alertsBadge}>
          {disk.alerts.length}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
  header: {
    marginBottom: '16px',
  } as React.CSSProperties,
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  badge: {
    padding: '4px 10px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500,
  } as React.CSSProperties,
  diskList: {
    display: 'grid',
    gap: '12px',
  } as React.CSSProperties,
  diskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  diskInfo: {
    flex: 1,
  } as React.CSSProperties,
  diskName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: '4px',
  } as React.CSSProperties,
  diskDetails: {
    display: 'flex',
    gap: '8px',
    marginBottom: '4px',
  } as React.CSSProperties,
  diskDetail: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  diskModel: {
    fontSize: '12px',
    color: '#999',
  } as React.CSSProperties,
  alertsBadge: {
    minWidth: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  } as React.CSSProperties,
  showMoreButton: {
    width: '100%',
    padding: '10px',
    marginTop: '12px',
    backgroundColor: 'transparent',
    color: '#1976d2',
    border: '1px solid #1976d2',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#e3f2fd',
    },
  } as React.CSSProperties,
};
