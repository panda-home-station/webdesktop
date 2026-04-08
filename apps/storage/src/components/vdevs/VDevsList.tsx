/**
 * VDEVs List Component
 * Display VDEV tree structure
 */

import React from 'react';
import { VDevItem } from '@truenas/types/storage-types';
import VdevGroupNode from './VdevGroupNode';
import TopologyItemNode from './TopologyItemNode';

interface VDevsListProps {
  nodes: VDevItem[];
}

export default function VDevsList({ nodes }: VDevsListProps) {
  if (nodes.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No VDEVs found</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {nodes.map((node) => {
        if (node.isRoot) {
          return <VdevGroupNode key={node.guid} node={node} />;
        }
        return <TopologyItemNode key={node.guid} node={node} level={0} />;
      })}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    padding: '24px',
  } as React.CSSProperties,
  emptyState: {
    display: 'flex',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: '48px',
  } as React.CSSProperties,
  emptyText: {
    margin: 0,
    fontSize: '16px',
    color: '#666',
  } as React.CSSProperties,
};
