/**
 * VDEVs View Component
 * Display VDEV topology for a pool
 */

import React, { useEffect } from 'react';
import { useVdevsStore } from '@truenas/stores/vdevs';
import { VDevType } from '@truenas/types/vdev-enum-types';
import VDevsList from './VDevsList';

interface VDevsViewProps {
  poolId: number;
}

export default function VDevsView({ poolId }: VDevsViewProps) {
  const {
    isLoading,
    nodes,
    pool,
    selectedVdevType,
    loadNodes,
    selectVdevType,
  } = useVdevsStore();

  useEffect(() => {
    loadNodes(poolId);
  }, [poolId, loadNodes]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>VDEV Topology</h2>
        {pool && (
          <p style={styles.subtitle}>
            {pool.name} - {pool.guid}
          </p>
        )}
      </div>

      {/* VDEV Type Tabs */}
      <div style={styles.tabs}>
        <VdevTypeTab
          type={VDevType.Data}
          selected={selectedVdevType === VDevType.Data}
          onClick={() => selectVdevType(VDevType.Data)}
        />
        <VdevTypeTab
          type={VDevType.Log}
          selected={selectedVdevType === VDevType.Log}
          onClick={() => selectVdevType(VDevType.Log)}
        />
        <VdevTypeTab
          type={VDevType.Special}
          selected={selectedVdevType === VDevType.Special}
          onClick={() => selectVdevType(VDevType.Special)}
        />
        <VdevTypeTab
          type={VDevType.Cache}
          selected={selectedVdevType === VDevType.Cache}
          onClick={() => selectVdevType(VDevType.Cache)}
        />
        <VdevTypeTab
          type={VDevType.Spare}
          selected={selectedVdevType === VDevType.Spare}
          onClick={() => selectVdevType(VDevType.Spare)}
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div style={styles.loading}>
          Loading VDEV topology...
        </div>
      ) : (
        /* VDEV List */
        <VDevsList nodes={nodes} />
      )}
    </div>
  );
}

interface VdevTypeTabProps {
  type: VDevType;
  selected: boolean;
  onClick: () => void;
}

function VdevTypeTab({ type, selected, onClick }: VdevTypeTabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.tab,
        ...(selected ? styles.tabSelected : {}),
      }}
    >
      {getVdevTypeLabel(type)}
    </button>
  );
}

function getVdevTypeLabel(type: VDevType): string {
  switch (type) {
    case VDevType.Data:
      return 'Data';
    case VDevType.Log:
      return 'Log';
    case VDevType.Special:
      return 'Metadata';
    case VDevType.Cache:
      return 'Cache';
    case VDevType.Spare:
      return 'Spare';
    default:
      return type;
  }
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
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    gap: '2px',
    padding: '0 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    color: '#666',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  tabSelected: {
    color: '#1976d2',
    borderBottomColor: '#1976d2',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: '48px',
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
};
