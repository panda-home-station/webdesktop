/**
 * VDEV Group Node Component
 * Display a root VDEV group (Data, Cache, Log, etc.)
 */

import React, { useState } from 'react';
import { VDevItem, VDev } from '@truenas/types/storage-types';
import { isTopologyDisk } from '@truenas/utils/topology.utils';
import TopologyItemNode from './TopologyItemNode';

interface VdevGroupNodeProps {
  node: VDevItem & { isRoot?: boolean };
}

export default function VdevGroupNode({ node }: VdevGroupNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getGroupType = (): string => {
    switch (node.type) {
      case 'data':
        return 'Data';
      case 'log':
        return 'Log';
      case 'cache':
        return 'L2ARC Cache';
      case 'special':
        return 'Special Metadata';
      case 'spare':
        return 'Hot Spares';
      default:
        return String(node.type).toUpperCase();
    }
  };

  const getGroupColor = (): string => {
    switch (node.type) {
      case 'data':
        return '#1976d2';
      case 'log':
        return '#9c27b0';
      case 'cache':
        return '#2196f3';
      case 'special':
        return '#ff9800';
      case 'spare':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  const getStats = (): { total: number; allocated: number } => {
    return {
      total: node.stats.size,
      allocated: node.stats.allocated,
    };
  };

  const stats = getStats();
  const children = isTopologyDisk(node) ? [] : (node as VDev).children;
  const hasChildren = children.length > 0;

  return (
    <div style={styles.container}>
      {/* Group Header */}
      <div style={styles.header}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            ...styles.toggleButton,
            color: getGroupColor(),
          }}
        >
          <span style={styles.groupType}>{getGroupType()}</span>
          <span style={styles.groupCount}>
            {children.length} item{children.length !== 1 ? 's' : ''}
          </span>
          <span style={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>

        {/* Group Stats */}
        <div style={styles.stats}>
          <StatItem label="Total" value={stats.total} />
          <StatItem label="Allocated" value={stats.allocated} />
        </div>
      </div>

      {/* Group Children */}
      {isExpanded && hasChildren && (
        <div style={styles.children}>
          {children.map((child) => (
            <TopologyItemNode key={child.guid} node={child} level={1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div style={styles.statItem}>
      <span style={styles.statLabel}>{label}:</span>
      <span style={styles.statValue}>{formatBytes(value)}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(1)} ${units[index]}`;
}

const styles = {
  container: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden' as const,
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f9f9f9',
  } as React.CSSProperties,
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14' as const,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  groupType: {
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  groupCount: {
    color: '#666',
    fontWeight: 400,
  } as React.CSSProperties,
  expandIcon: {
    fontSize: '12px',
    marginLeft: '4px',
  } as React.CSSProperties,
  stats: {
    display: 'flex',
    gap: '16px',
  } as React.CSSProperties,
  statItem: {
    display: 'flex',
    gap: '4px',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '12px',
    color: '#666',
  } as React.CSSProperties,
  statValue: {
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  children: {
    padding: '8px 16px',
  } as React.CSSProperties,
};
