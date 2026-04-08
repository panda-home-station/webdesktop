/**
 * Data Step Component
 * Configure data VDEVs for pool
 */

import React from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';
import { VDevType, CreateVdevLayout } from '@truenas/types/vdev-enum-types';

export default function DataStep() {
  const {
    vdevGroups,
    errors,
    addVdev,
  } = usePoolManagerStore();

  const dataGroup = vdevGroups.find((g) => g.type === VDevType.Data);
  const vdevs = dataGroup?.vdevs || [];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Data VDEVs</h2>
      <p style={styles.subtitle}>
        Add data VDEVs to store your files. At least one data VDEV is required.
      </p>

      {/* VDEV Layout Buttons */}
      <div style={styles.layoutButtons}>
        <VdevLayoutButton
          layout={CreateVdevLayout.Stripe}
          onClick={() => addVdev(VDevType.Data, CreateVdevLayout.Stripe)}
        />
        <VdevLayoutButton
          layout={CreateVdevLayout.Mirror}
          onClick={() => addVdev(VDevType.Data, CreateVdevLayout.Mirror)}
        />
        <VdevLayoutButton
          layout={CreateVdevLayout.Raidz1}
          onClick={() => addVdev(VDevType.Data, CreateVdevLayout.Raidz1)}
        />
        <VdevLayoutButton
          layout={CreateVdevLayout.Raidz2}
          onClick={() => addVdev(VDevType.Data, CreateVdevLayout.Raidz2)}
        />
        <VdevLayoutButton
          layout={CreateVdevLayout.Raidz3}
          onClick={() => addVdev(VDevType.Data, CreateVdevLayout.Raidz3)}
        />
      </div>

      {/* Existing VDEVs */}
      {vdevs.length > 0 && (
        <div style={styles.vdevList}>
          {vdevs.map((vdev, index) => (
            <VdevItem
              key={vdev.id}
              vdev={vdev}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {errors.vdevs && (
        <div style={styles.error}>{errors.vdevs}</div>
      )}

      {/* {availableDisks.length > 0 && (
        <AvailableDisks disks={availableDisks} />
      )} */}
    </div>
  );
}

interface VdevLayoutButtonProps {
  layout: CreateVdevLayout;
  onClick: () => void;
}

function VdevLayoutButton({ layout, onClick }: VdevLayoutButtonProps) {
  return (
    <button onClick={onClick} style={styles.layoutButton}>
      {getLayoutLabel(layout)}
    </button>
  );
}

function getLayoutLabel(layout: CreateVdevLayout): string {
  switch (layout) {
    case CreateVdevLayout.Stripe:
      return 'Stripe';
    case CreateVdevLayout.Mirror:
      return 'Mirror';
    case CreateVdevLayout.Raidz1:
      return 'RAIDZ1';
    case CreateVdevLayout.Raidz2:
      return 'RAIDZ2';
    case CreateVdevLayout.Raidz3:
      return 'RAIDZ3';
    default:
      return String(layout);
  }
}

interface VdevItemProps {
  vdev: {
    id: string;
    type: CreateVdevLayout;
    disks: string[];
  };
  index: number;
}

function VdevItem({ vdev, index }: VdevItemProps) {
  return (
    <div style={styles.vdevItem}>
      <span>VDEV {index + 1}: {vdev.disks.length} disks ({getLayoutLabel(vdev.type)})</span>
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
  layoutButtons: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  layoutButton: {
    padding: '12px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  vdevList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,
  vdevItem: {
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '14px',
  } as React.CSSProperties,
  error: {
    color: '#d32f2f',
    fontSize: '14px',
    marginTop: '8px',
  } as React.CSSProperties,
};
