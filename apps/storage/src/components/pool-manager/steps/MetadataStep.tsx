/**
 * Metadata Step Component
 * Configure special metadata VDEVs
 */

import React from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';
import { VDevType, CreateVdevLayout } from '@truenas/types/vdev-enum-types';

export default function MetadataStep() {
  const {
    vdevGroups,
    addVdev,
  } = usePoolManagerStore();

  const specialGroup = vdevGroups.find((g) => g.type === VDevType.Special);
  const vdevs = specialGroup?.vdevs || [];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Special Metadata</h2>
      <p style={styles.subtitle}>
        Add a special metadata VDEV to store small block metadata separately.
        This can improve performance for workloads with many small files.
      </p>

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          <strong>Recommendation:</strong> Use a fast SSD (at least 100GB) for special
          metadata if your dataset contains many small files {'<128KB'}.
        </p>
      </div>

      {/* Add Special VDEV */}
      {vdevs.length === 0 ? (
        <div style={styles.addButton}>
          <button
            onClick={() => addVdev(VDevType.Special, CreateVdevLayout.Stripe)}
            style={styles.primaryButton}
          >
            Add Metadata Device
          </button>
        </div>
      ) : (
        <div style={styles.vdevList}>
          {vdevs.map((vdev, index) => (
            <MetadataVdevItem key={vdev.id} vdev={vdev} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

interface MetadataVdevItemProps {
  vdev: {
    id: string;
    type: CreateVdevLayout;
    disks: string[];
  };
  index: number;
}

function MetadataVdevItem({ vdev, index }: MetadataVdevItemProps) {
  return (
    <div style={styles.vdevItem}>
      <div style={styles.vdevHeader}>
        <span style={styles.vdevTitle}>Special Metadata {index + 1}</span>
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
    backgroundColor: '#fff3e0',
    border: '1px solid #ffe0b2',
    borderRadius: '6px',
    marginBottom: '24px',
  } as React.CSSProperties,
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#856共有',
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
