/**
 * Datasets Card Component
 * Displays datasets in a clean tree structure with cards
 */

import { useState } from 'react'
import { Dataset, isVolume } from '@truenas/types/dataset-types'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from 'lucide-react'

interface DatasetsCardProps {
  datasets: Dataset[]
  onDatasetClick?: (dataset: Dataset) => void
  onAddDataset?: () => void
}

export function DatasetsCard({
  datasets,
  onDatasetClick,
  onAddDataset,
}: DatasetsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Filter only root datasets for this pool (datasets where name === pool)
  const poolDatasets = datasets.filter(d => d.pool === d.name)

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <div style={styles.headerIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <span style={styles.title}>数据集</span>
          <span style={styles.badge}>{poolDatasets.length} 个</span>
        </div>
        <button
          style={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? '折叠' : '展开'}
        >
          <ChevronDown
            size={18}
            style={{
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div style={styles.content}>
          {poolDatasets.length === 0 ? (
            <div style={styles.emptyState}>
              <p>未找到数据集</p>
            {onAddDataset && (
              <button style={styles.addButton} onClick={onAddDataset}>
                + 创建数据集
              </button>
            )}
          </div>
        ) : (
          <div style={styles.datasetTree}>
            {poolDatasets.map((dataset) => (
              <DatasetTreeItem
                key={dataset.id}
                dataset={dataset}
                level={0}
                onDatasetClick={onDatasetClick}
              />
            ))}
          </div>
        )}
        </div>
      )}
    </div>
  )
}

interface DatasetTreeItemProps {
  dataset: Dataset
  level: number
  onDatasetClick?: (dataset: Dataset) => void
}

function DatasetTreeItem({ dataset, level, onDatasetClick }: DatasetTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1)
  const hasChildren = dataset.children && dataset.children.length > 0
  const isVol = isVolume(dataset)

  const used = dataset.used.parsed as number || 0
  const available = dataset.available?.parsed as number || 0
  const total = used + available
  const usagePercent = total > 0 ? (used / total) * 100 : 0

  return (
    <div style={styles.treeItem}>
      <div
        style={{
          ...styles.itemRow,
          paddingLeft: level === 0 ? 0 : 12 + level * 20,
        }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            style={styles.expandBtn}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ) : (
          <span style={styles.expandSpacer} />
        )}

        {/* Folder Icon */}
        <div style={styles.iconWrapper}>
          {isExpanded && hasChildren ? (
            <FolderOpen size={18} color={colors.primary} />
          ) : (
            <Folder size={18} color={isVol ? colors.warning : colors.primary} />
          )}
        </div>

        {/* Name & Type */}
        <div style={styles.nameSection}>
          <span style={styles.datasetName} title={dataset.name}>
            {dataset.name.split('/').pop()}
          </span>
          {isVol && (
            <span style={styles.zvolBadge}>Zvol</span>
          )}
        </div>

        {/* Usage */}
        <div style={styles.usageSection}>
          <div style={styles.usageBarWrapper}>
            <div style={styles.usageBarBg}>
              <div
                style={{
                  ...styles.usageBarFill,
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor:
                    usagePercent > 90
                      ? colors.danger
                      : usagePercent > 70
                      ? colors.warning
                      : colors.success,
                }}
              />
            </div>
          </div>
          <div style={styles.usageTextWrapper}>
            <span style={styles.usageUsed}>{formatBytes(used)}</span>
            <span style={styles.usageSeparator}>/</span>
            <span style={styles.usageTotal}>{formatBytes(total)}</span>
          </div>
        </div>

      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div style={styles.childrenContainer}>
          {dataset.children!.map((child) => (
            <DatasetTreeItem
              key={child.id}
              dataset={child}
              level={level + 1}
              onDatasetClick={onDatasetClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  },
  badge: {
    padding: '4px 10px',
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  },
  expandButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    border: 'medium',
    borderRadius: 6,
    cursor: 'pointer',
    transition: '0.2s',
  },
  content: {
    padding: '8px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 16px',
    color: colors.textSecondary,
    fontSize: 14,
  },
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: '8px 16px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  datasetTree: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  treeItem: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    transition: 'background-color 0.15s ease',
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  expandSpacer: {
    width: 24,
    flexShrink: 0,
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.background,
    borderRadius: 8,
    flexShrink: 0,
  },
  nameSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  datasetName: {
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  zvolBadge: {
    padding: '2px 6px',
    backgroundColor: colors.warning + '20',
    color: colors.warning,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  },
  usageSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
    width: 200,
    justifyContent: 'flex-end',
  },
  usageBarWrapper: {
    width: 60,
  },
  usageBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  usageTextWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
    width: 120,
    justifyContent: 'flex-end',
  },
  usageUsed: {
    color: colors.text,
    fontWeight: 500,
    textAlign: 'right',
  },
  usageSeparator: {
    color: colors.textSecondary,
  },
  usageTotal: {
    color: colors.textSecondary,
    textAlign: 'right',
  },
  childrenContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
}