/**
 * Dataset Tree Component
 * Display dataset hierarchy as a tree
 */

import React, { useState } from 'react';
import { Dataset } from '@truenas/types/dataset-types';
import {
  getDatasetName,
  hasChildren,
  isVolume,
  getDatasetUsedPercentage,
  getDatasetIcon,
  getDatasetIconColor,
} from '@truenas/utils/dataset.utils';

interface DatasetTreeProps {
  datasets: Dataset[];
  onSelect: (dataset: Dataset) => void;
  onCreate: (parentId: string) => void;
  onDelete: (datasetId: string) => void;
}

export default function DatasetTree({ datasets, onSelect, onCreate, onDelete }: DatasetTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (items: Dataset[]): void => {
      items.forEach((item) => {
        allIds.add(item.id);
        if (item.children) {
          collectIds(item.children);
        }
      });
    };
    collectIds(datasets);
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <button onClick={expandAll} style={styles.toolbarButton}>
          Expand All
        </button>
        <button onClick={collapseAll} style={styles.toolbarButton}>
          Collapse All
        </button>
      </div>

      {/* Tree */}
      <div style={styles.tree}>
        {datasets.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No datasets found</p>
          </div>
        ) : (
          datasets.map((dataset) => (
            <DatasetTreeNode
              key={dataset.id}
              dataset={dataset}
              level={0}
              isExpanded={expandedIds.has(dataset.id)}
              onToggle={toggleExpand}
              onSelect={onSelect}
              onCreate={onCreate}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface DatasetTreeNodeProps {
  dataset: Dataset;
  level: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onSelect: (dataset: Dataset) => void;
  onCreate: (parentId: string) => void;
  onDelete: (datasetId: string) => void;
}

function DatasetTreeNode({
  dataset,
  level,
  isExpanded,
  onToggle,
  onSelect,
  onCreate,
  onDelete,
}: DatasetTreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const hasChild = hasChildren(dataset);
  const usedPercentage = getDatasetUsedPercentage(dataset);

  return (
    <div style={styles.tree}>
      <div
        style={{
          ...styles.node,
          marginLeft: `${level * 20}px`,
          backgroundColor: isHovered ? '#f5f5f5' : 'transparent',
        }}
        onClick={() => onSelect(dataset)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand Toggle */}
        {hasChild && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(dataset.id);
            }}
            style={styles.expandButton}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}

        {/* Dataset Icon */}
        <div style={{
          ...styles.icon,
          color: getDatasetIconColor(dataset),
        }}>
          {getDatasetIcon(dataset)}
        </div>

        {/* Dataset Name */}
        <span style={styles.name}>{getDatasetName(dataset)}</span>

        {/* Type Badge */}
        <span style={styles.typeBadge}>
          {isVolume(dataset) ? 'Volume' : 'Filesystem'}
        </span>

        {/* Usage Bar */}
        <div style={styles.usageBar}>
          <div
            style={{
              ...styles.usageFill,
              width: `${usedPercentage}%`,
            }}
          />
        </div>

        {/* Actions Menu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={styles.menuButton}
        >
          ⋮
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div style={styles.menu}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreate(dataset.id);
                setShowMenu(false);
              }}
              style={styles.menuItem}
            >
              Create Child Dataset
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(dataset.id);
                setShowMenu(false);
              }}
              style={styles.menuItem}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChild && dataset.children && (
        dataset.children.map((child) => (
          <DatasetTreeNode
            key={child.id}
            dataset={child}
            level={level + 1}
            isExpanded={false}
            onToggle={onToggle}
            onSelect={onSelect}
            onCreate={onCreate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  } as React.CSSProperties,
  toolbar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  toolbarButton: {
    padding: '6px 12px',
    backgroundColor: 'white',
    color: '#1976d2',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  } as React.CSSProperties,
  tree: {
    flex: 1,
    overflow: 'auto' as const,
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
  node: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  } as React.CSSProperties,
  expandButton: {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '10px',
    color: '#666',
    cursor: 'pointer',
    ':hover': {
      color: '#1976d2',
    },
  } as React.CSSProperties,
  icon: {
    fontSize: '18px',
  } as React.CSSProperties,
  name: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
  } as React.CSSProperties,
  typeBadge: {
    padding: '2px 8px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  } as React.CSSProperties,
  usageBar: {
    width: '100px',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden' as const,
  } as React.CSSProperties,
  usageFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  menuButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
    ':hover': {
      color: '#1976d2',
    },
  } as React.CSSProperties,
  menu: {
    position: 'absolute' as const,
    right: 0,
    top: '100%',
    zIndex: 1000,
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    minWidth: '200px',
  } as React.CSSProperties,
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left' as const,
    fontSize: '14px',
    color: '#1a1a1a',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  } as React.CSSProperties,
};
