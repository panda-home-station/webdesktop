/**
 * Topology Item Node Component
 * Display a single VDEV or disk in the topology tree
 */

import React, { useState } from 'react';
import { VDevItem, TopologyDisk } from '@truenas/types/storage-types';
import { isTopologyDisk, topologyToDisks } from '@truenas/utils/topology.utils';
import { getTopologyStatusLabel, getTopologyStatusColor } from '@truenas/types/vdev-status-enum';
import { TopologyItemType } from '@truenas/types/vdev-enum-types';

interface TopologyItemNodeProps {
  node: VDevItem;
  level: number;
}

export default function TopologyItemNode({ node, level }: TopologyItemNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isDisk = isTopologyDisk(node);
  const hasChildren = !isDisk && (node.children || []).length > 0;
  const children = isDisk ? [] : node.children;

  return (
    <div
      style={{
        ...styles.container,
        marginLeft: `${level * 24}px`,
      }}
    >
      {/* Node Header */}
      <div style={styles.nodeHeader}>
        {/* Expand Toggle */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={styles.expandButton}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}

        {/* Icon */}
        <div style={{ ...styles.icon, color: getNodeColor(node) }}>
          {getNodeIcon(node)}
        </div>

        {/* Name */}
        <div style={styles.name}>{node.name}</div>

        {/* Type Badge */}
        <span style={{ ...styles.typeBadge, backgroundColor: getTypeBadgeColor(node.type) }}>
          {node.type}
        </span>

        {/* Status Badge */}
        <span style={{ ...styles.statusBadge, backgroundColor: getTopologyStatusColor(node.status) }}>
          {getTopologyStatusLabel(node.status)}
        </span>
      </div>

      {/* Size Info */}
      <div style={styles.sizeInfo}>
        <SizeInfo
          label="Size"
          value={node.stats.size}
        />
        <SizeInfo
          label="Allocated"
          value={node.stats.allocated}
        />
      </div>

      {/* Errors */}
      {(node.stats.read_errors > 0 ||
        node.stats.write_errors > 0 ||
        node.stats.checksum_errors > 0) && (
        <div style={styles.errorSummary}>
          <ErrorBadge
            label="Read Errors"
            count={node.stats.read_errors}
          />
          <ErrorBadge
            label="Write Errors"
            count={node.stats.write_errors}
          />
          <ErrorBadge
            label="Checksum Errors"
            count={node.stats.checksum_errors}
          />
        </div>
      )}

      {/* Children */}
      {isExpanded && hasChildren && (
        <div style={styles.children}>
          {children.map((child) => (
            <TopologyItemNode key={child.guid} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SizeInfoProps {
  label: string;
  value: number;
}

function SizeInfo({ label, value }: SizeInfoProps) {
  return (
    <div style={styles.sizeInfo}>
      <span style={styles.sizeLabel}>{label}:</span>
      <span style={styles.sizeValue}>{formatBytes(value)}</span>
    </div>
  );
}

interface ErrorBadgeProps {
  label: string;
  count: number;
}

function ErrorBadge({ label, count }: ErrorBadgeProps) {
  return (
    <span style={{ ...styles.errorBadge, display: count > 0 ? 'inline-block' : 'none' }}>
      {label}: {count}
    </span>
  );
}

function getNodeIcon(node: VDevItem): string {
  if (isTopologyDisk(node)) {
    return '💾';
  }

  switch (node.type) {
    case TopologyItemType.Mirror:
      return '🪞';
    case TopologyItemType.Raidz1:
    case TopologyItemType.Raidz2:
    case TopologyItemType.Raidz3:
      return '🛡';
    case TopologyItemType.Stripe:
      return '➕';
    case TopologyItemType.L2Cache:
      return '⚡';
    case TopologyItemType.Log:
      return '📝';
    case TopologyItemType.Spare:
      return '🔄';
    default:
      return '📦';
  }
}

function getNodeColor(node: VDevItem): string {
  if (node.status === 'ONLINE') return '#4caf50';
  if (node.status === 'DEGRADED') return '#ff9800';
  return '#f44336';
}

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case 'DISK':
      return '#2196f3';
    case 'MIRROR':
      return '#9c27b0';
    case 'RAIDZ':
    case 'RAIDZ1':
    case 'RAIDZ2':
    case 'RAIDZ3':
      return '#ff5722';
    case 'L2CACHE':
      return '#673ab7';
    case 'LOG':
      return '#e91e63';
    case 'SPARE':
      return '#9e9e9e';
    default:
      return '#666';
  }
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
    padding: '8px 0',
  } as React.CSSProperties,
  nodeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '6px',
    marginBottom: '4px',
  } as React.CSSProperties,
  expandButton: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  } as React.CSSProperties,
  icon: {
    fontSize: '16px',
  } as React.CSSProperties,
  name: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
  } as React.CSSProperties,
  typeBadge: {
    padding: '4px 8px',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  } as React.CSSProperties,
  statusBadge: {
    padding: '4px 8px',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
  } as React.CSSProperties,
  sizeInfo: {
    display: 'flex',
    gap: '16px',
    padding: '4px 0 8px',
    marginLeft: '32px',
    fontSize: '12px',
    color: '#666',
  } as React.CSSProperties,
  sizeLabel: {
    fontWeight: 500,
  } as React.CSSProperties,
  sizeValue: {
    color: '#1a1a1a',
    fontWeight: 600,
  } as React.CSSProperties,
  errorSummary: {
    display: 'flex',
    gap: '8px',
    padding: '4px 0 8px',
    marginLeft: '32px',
  } as React.CSSProperties,
  errorBadge: {
    padding: '4px 8px',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
  } as React.CSSProperties,
  children: {
    marginTop: '4px',
  } as React.CSSProperties,
};
