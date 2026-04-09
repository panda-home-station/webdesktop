/**
 * Dataset Tree Component
 * Display datasets in a tree structure
 */

import { useState } from 'react'
import { Dataset } from '@truenas/types/dataset-types'
import { formatBytes } from '@truenas/utils/storage.utils'
import { isVolume } from '@truenas/types/dataset-types'
import { colors } from '../../styles/theme'

interface DatasetTreeProps {
  datasets: Dataset[]
  onDatasetClick?: (dataset: Dataset) => void
  level?: number
}

export function DatasetTree({ datasets, onDatasetClick, level = 0 }: DatasetTreeProps) {
  if (datasets.length === 0) {
    if (level === 0) {
      return (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No datasets found</p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={styles.tree}>
      {datasets.map((dataset) => (
        <DatasetNode
          key={dataset.id}
          dataset={dataset}
          onDatasetClick={onDatasetClick}
          level={level}
        />
      ))}
    </div>
  )
}

interface DatasetNodeProps {
  dataset: Dataset
  onDatasetClick?: (dataset: Dataset) => void
  level: number
}

function DatasetNode({ dataset, onDatasetClick, level }: DatasetNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = dataset.children && dataset.children.length > 0
  const isVol = isVolume(dataset)

  return (
    <div style={styles.node}>
      <div
        style={{
          ...styles.nodeRow,
          paddingLeft: 16 + level * 24,
        }}
        onClick={() => onDatasetClick?.(dataset)}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            style={styles.expandButton}
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={styles.expandSpacer} />
        )}

        {/* Icon */}
        <span style={styles.icon}>
          {isVol ? '💾' : '📁'}
        </span>

        {/* Name */}
        <span style={styles.name}>
          {dataset.name.split('/').pop()}
        </span>

        {/* Type Badge */}
        {isVol && (
          <span style={styles.volumeBadge}>Zvol</span>
        )}

        {/* Spacer */}
        <span style={styles.spacer} />

        {/* Used Space */}
        <span style={styles.usedSpace}>
          {formatBytes(dataset.used.parsed as number || 0)}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <DatasetTree
          datasets={dataset.children!}
          onDatasetClick={onDatasetClick}
          level={level + 1}
        />
      )}
    </div>
  )
}

// Dataset card view (alternative to tree)
interface DatasetCardViewProps {
  datasets: Dataset[]
  onDatasetClick?: (dataset: Dataset) => void
}

export function DatasetCardView({ datasets, onDatasetClick }: DatasetCardViewProps) {
  // Flatten the tree for card view
  const flattenDatasets = (datasets: Dataset[], result: Dataset[] = []): Dataset[] => {
    for (const dataset of datasets) {
      result.push(dataset)
      if (dataset.children) {
        flattenDatasets(dataset.children, result)
      }
    }
    return result
  }

  const flatDatasets = flattenDatasets(datasets)

  if (flatDatasets.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No datasets found</p>
      </div>
    )
  }

  return (
    <div style={styles.cardGrid}>
      {flatDatasets.map((dataset) => (
        <div
          key={dataset.id}
          style={styles.card}
          onClick={() => onDatasetClick?.(dataset)}
        >
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>
              {isVolume(dataset) ? '💾' : '📁'}
            </span>
            <span style={styles.cardName}>
              {dataset.name.split('/').pop()}
            </span>
            {isVolume(dataset) && (
              <span style={styles.volumeBadge}>Zvol</span>
            )}
          </div>
          <div style={styles.cardInfo}>
            <span style={styles.cardPath}>{dataset.name}</span>
            <span style={styles.cardUsed}>
              {formatBytes(dataset.used.parsed as number || 0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

const styles = {
  tree: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    overflow: 'hidden',
  },
  node: {
    borderBottom: `1px solid ${colors.border}`,
  },
  nodeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  expandButton: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 10,
    color: colors.textSecondary,
  },
  expandSpacer: {
    width: 20,
  },
  icon: {
    fontSize: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
  },
  volumeBadge: {
    padding: '2px 6px',
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  spacer: {
    flex: 1,
  },
  usedSpace: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
  },
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: 12,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 16,
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
    flex: 1,
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  cardPath: {
    fontSize: 12,
    color: colors.textTertiary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardUsed: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
}
