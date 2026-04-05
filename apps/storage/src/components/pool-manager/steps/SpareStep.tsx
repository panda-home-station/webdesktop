/**
 * Spare Step Component
 * Configure hot spare disks
 */

import React from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';
import { VDevType } from '@truenas/types/vdev-enum-types';

export default function SpareStep() {
  const {
    vdevGroups,
  } = usePoolManagerStore();

  const spareGroup = vdevGroups.find((g) => g.type === VDevType.Spare);
  const spareDisks = spareGroup?.spareDisks || [];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Hot Spares</h2>
      <p style={styles.subtitle}>
        Hot spares are automatically used when a disk in a redundant VDEV fails.
        This helps maintain pool redundancy during disk replacement.
      </p>

      <div style={styles.infoBox}>
        <p style={styles.infoText}>
          <strong>Important:</strong> Hot spares are automatically integrated into the pool
          when needed. Once used, the spare disk becomes part of the pool and a new
          spare should be added.
        </p>
      </div>

      {/* Spare Disks */}
      <div style={styles.content}>
        {spareDisks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No hot spares configured</p>
            <p style={styles.emptySubtext}>
              Hot spares will be configured in the Data step by marking disks as spares.
            </p>
          </div>
        ) : (
          <>
            <div style={styles.diskList}>
              {spareDisks.map((disk, index) => (
                <SpareDiskItem key={disk} disk={disk} index={index} />
              ))}
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total Spares:</span>
                <span style={styles.summaryValue}>{spareDisks.length}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Status:</span>
                <span style={{ ...styles.summaryValue, color: '#4caf50' }}>
                  Ready
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface SpareDiskItemProps {
  disk: string;
  index: number;
}

function SpareDiskItem({ disk, index }: SpareDiskItemProps) {
  return (
    <div style={styles.diskItem}>
      <div style={styles.diskNumber}>{index + 1}</div>
      <div style={styles.diskName}>{disk}</div>
      <div style={styles.diskStatus}>
        <span style={styles.statusBadge}>Standby</span>
      </div>
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
    backgroundColor: '#e3f2fd',
    border: '1px solid #bbdefb',
    borderRadius: '6px',
    marginBottom: '24px',
  } as React.CSSProperties,
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#0d47a1',
  } as React.CSSProperties,
  content: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
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
  diskList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '24px',
  } as React.CSSProperties,
  diskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
  } as React.CSSProperties,
  diskNumber: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    color: '#666',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  diskName: {
    flex: 1,
    fontSize: '15px',
    fontWeight: 500,
    color: '#1a1a1a',
  } as React.CSSProperties,
  diskStatus: {
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  statusBadge: {
    padding: '4px 12px',
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
  } as React.CSSProperties,
  summary: {
    padding: '16px 0 0',
    borderTop: '1px solid #e0e0e0',
  } as React.CSSProperties,
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
  } as React.CSSProperties,
  summaryLabel: {
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  summaryValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
};
