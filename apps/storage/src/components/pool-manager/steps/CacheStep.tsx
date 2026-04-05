/**
 * Cache Step Component
 * Configure L2ARC cache VDEVs
 */

import React from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';
import { VDevType, CreateVdevLayout } from '@truenas/types/vdev-enum-types';

export default function CacheStep() {
  const {
    vdevGroups,
    addVdev,
  } = usePoolManagerStore();

  const cacheGroup = vdevGroups.find((g) => g.type === VDevType.Cache);
  const vdevs = cacheGroup?.vdevs || [];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>L2ARC Cache</h2>
      <p style={styles.subtitle}>
        Add L2ARC (Level 2 ARC) cache devices to improve read performance.
        This is optional and typically uses fast SSDs or NVMe drives.
      </p>

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          <strong>Performance Note:</strong> L2ARC cache stores frequently accessed data
          from ARC (in-memory cache) to disk. This can significantly improve read
          performance for workloads with good data locality.
        </p>
      </div>

      {/* Add Cache VDEV */}
      {vdevs.length === 0 ? (
        <div style={styles.addButton}>
          <button
            onClick={() => addVdev(VDevType.Cache, CreateVdevLayout.Stripe)}
            style={styles.primaryButton}
          >
            Add Cache Device
          </button>
        </div>
      ) : (
        <div style={styles.vdevList}>
          {vdevs.map((vdev, index) => (
            <CacheVdevItem key={vdev.id} vdev={vdev} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CacheVdevItemProps {
  vdev: {
    id: string;
    type: CreateVdevLayout;
    disks: string[];
  };
  index: number;
}

function CacheVdevItem({ vdev, index }: CacheVdevItemProps) {
  return (
    <div style={styles.vdevItem}>
      <div style={styles.vdevHeader}>
        <span style={styles.vdevTitle}>Cache Device {index + 1}</span>
        <span style={styles.vdevInfo}>{vdev.disks.length} disk{vdev.disks.length !== 1 ? 's' : ''}</span>
      </div>
      {vdev.disks.length > 0 && (
        <div style={styles.vdevDisks}>
          {vdev.disks.map((disk) => (
            <span key={disk} style={styles.diskBadge}>
              {disk}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
  } as React.CSSProperties,
  title: {
    margin: '0 0 8px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '0 0 24px',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  infoBox: {
    padding: '16px',
    backgroundColor: '#e8f5e9',
    border: '1px solid #c8e6c9',
    borderRadius: '6px',
    marginBottom: '24px',
  } as React.CSSProperties,
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#2e7d32',
  } as React.CSSProperties,
  addButton: {
    textAlign: 'center' as const,
    padding: '40px',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
  } as React.CSSProperties,
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  vdevList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  } as React.CSSProperties,
  vdevItem: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
  } as React.CSSProperties,
  vdevHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,
  vdevTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  vdevInfo: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  vdevDisks: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  } as React.CSSProperties,
  diskBadge: {
    padding: '6px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 500,
  } as React.CSSProperties,
};
