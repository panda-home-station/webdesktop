/**
 * Datasets Detail Page
 * Master-detail view of pool datasets
 */

import { useState } from 'react'
import { Dataset, isVolume } from '@truenas/types/dataset-types'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'
import {
  Folder,
  FolderOpen,
  HardDrive,
  ChevronRight,
  ChevronDown,
  Lock,
} from 'lucide-react'

interface DatasetsPageProps {
  poolName: string
  datasets: Dataset[]
  onBack: () => void
}

export function DatasetsPage({ poolName, datasets, onBack }: DatasetsPageProps) {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Root datasets for this pool
  const rootDatasets = datasets.filter(d => d.pool === d.name)

  function toggleExpand(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <button style={styles.backButton} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div style={styles.titleBlock}>
          <span style={styles.breadcrumb}>{poolName}</span>
          <h1 style={styles.pageTitle}>数据集详情</h1>
        </div>
      </div>

      {/* Master-Detail */}
      <div style={styles.masterDetail}>
        {/* Left: Dataset Tree */}
        <div style={styles.master}>
          <div style={styles.masterInner}>
            {rootDatasets.length === 0 ? (
              <div style={styles.emptyTree}>未找到数据集</div>
            ) : (
              rootDatasets.map(dataset => (
                <DatasetTreeNode
                  key={dataset.id}
                  dataset={dataset}
                  level={0}
                  selected={selectedDataset}
                  expandedIds={expandedIds}
                  onSelect={setSelectedDataset}
                  onToggle={toggleExpand}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div style={styles.detail}>
          {selectedDataset ? (
            <DatasetDetailPanel dataset={selectedDataset} />
          ) : (
            <div style={styles.emptyDetail}>
              <Folder size={48} color={colors.border} />
              <p style={styles.emptyDetailText}>选择左侧数据集查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DatasetTreeNodeProps {
  dataset: Dataset
  level: number
  selected: Dataset | null
  expandedIds: Set<string>
  onSelect: (d: Dataset) => void
  onToggle: (id: string, e: React.MouseEvent) => void
}

function DatasetTreeNode({
  dataset,
  level,
  selected,
  expandedIds,
  onSelect,
  onToggle,
}: DatasetTreeNodeProps) {
  const hasChildren = (dataset.children?.length ?? 0) > 0
  const isExpanded = expandedIds.has(dataset.id)
  const isSelected = selected?.id === dataset.id
  const isVol = isVolume(dataset)

  const used = (dataset.used?.parsed as number) ?? 0
  const available = (dataset.available?.parsed as number) ?? 0
  const total = used + available
  const usagePercent = total > 0 ? (used / total) * 100 : 0
  const shortName = dataset.name.split('/').pop() ?? dataset.name

  return (
    <div>
      <div
        style={{
          ...styles.treeRow,
          paddingLeft: 12 + level * 20,
          backgroundColor: isSelected ? colors.primary + '14' : 'transparent',
          borderLeft: isSelected
            ? `3px solid ${colors.primary}`
            : '3px solid transparent',
        }}
        onClick={() => onSelect(dataset)}
      >
        {/* Expand button */}
        {hasChildren ? (
          <button
            style={styles.expandBtn}
            onClick={e => onToggle(dataset.id, e)}
          >
            {isExpanded
              ? <ChevronDown size={13} />
              : <ChevronRight size={13} />
            }
          </button>
        ) : (
          <span style={styles.expandSpacer} />
        )}

        {/* Folder icon */}
        {isVol ? (
          <HardDrive size={15} color={isSelected ? colors.primary : colors.warning} />
        ) : isExpanded && hasChildren ? (
          <FolderOpen size={15} color={isSelected ? colors.primary : colors.primary} />
        ) : (
          <Folder size={15} color={isSelected ? colors.primary : colors.textSecondary} />
        )}

        {/* Name */}
        <div style={styles.treeNameCol}>
          <span style={{
            ...styles.treeName,
            color: isSelected ? colors.primary : colors.text,
            fontWeight: level === 0 ? 600 : 500,
          }}>
            {shortName}
          </span>
          {isVol && <span style={styles.zvolBadge}>Zvol</span>}
          {dataset.encrypted && <Lock size={11} color={colors.textTertiary} />}
        </div>

        {/* Usage bar */}
        <div style={styles.treeUsage}>
          <div style={styles.usageBarBg}>
            <div style={{
              ...styles.usageBarFill,
              width: `${Math.min(usagePercent, 100)}%`,
              backgroundColor: usagePercent > 90
                ? colors.danger
                : usagePercent > 70
                ? colors.warning
                : colors.success,
            }} />
          </div>
          <span style={styles.usageText}>{formatBytes(used)}</span>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        dataset.children!.map(child => (
          <DatasetTreeNode
            key={child.id}
            dataset={child}
            level={level + 1}
            selected={selected}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))
      )}
    </div>
  )
}

function DatasetDetailPanel({ dataset }: { dataset: Dataset }) {
  const isVol = isVolume(dataset)
  const used = (dataset.used?.parsed as number) ?? 0
  const available = (dataset.available?.parsed as number) ?? 0
  const total = used + available
  const usagePercent = total > 0 ? (used / total) * 100 : 0
  const quota = dataset.quota?.value ?? 0
  const refquota = dataset.refquota?.value ?? 0

  return (
    <div style={styles.detailPanel}>
      {/* Detail Header */}
      <div style={styles.detailHeader}>
        <div style={styles.detailIconWrap}>
          {isVol
            ? <HardDrive size={28} color={colors.warning} />
            : <Folder size={28} color={colors.primary} />
          }
        </div>
        <div style={styles.detailHeaderInfo}>
          <h2 style={styles.detailTitle}>{dataset.name.split('/').pop()}</h2>
          <div style={styles.detailBadges}>
            <span style={{
              ...styles.typeBadge,
              backgroundColor: isVol ? colors.warning + '15' : colors.primary + '15',
              color: isVol ? colors.warning : colors.primary,
            }}>
              {isVol ? 'Zvol' : 'Filesystem'}
            </span>
            {dataset.encrypted && (
              <span style={styles.encryptedBadge}>
                <Lock size={11} />
                已加密
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <div style={styles.detailCard}>
        <div style={styles.detailCardTitle}>基本信息</div>
        <InfoRow label="完整路径" value={dataset.name} mono />
        <InfoRow label="类型" value={isVol ? 'Zvol (卷)' : 'Filesystem (文件系统)'} />
        {dataset.sync && <InfoRow label="同步" value={syncLabel(dataset.sync.value as string)} />}
        {dataset.compression && (
          <InfoRow label="压缩" value={dataset.compression.value as string} />
        )}
        {dataset.atime && (
          <InfoRow label="访问时间 (atime)" value={atimeLabel(dataset.atime.value as string)} />
        )}
        {dataset.deduplication && (
          <InfoRow label="重复消除" value={dedupLabel(dataset.deduplication.value as string)} />
        )}
      </div>

      {/* 空间使用 */}
      <div style={styles.detailCard}>
        <div style={styles.detailCardTitle}>空间使用</div>

        {/* Progress bar */}
        <div style={styles.usageBarWrap}>
          <div style={styles.usageBarBgLarge}>
            <div style={{
              ...styles.usageBarFillLarge,
              width: `${Math.min(usagePercent, 100)}%`,
              backgroundColor: usagePercent > 90
                ? colors.danger
                : usagePercent > 70
                ? colors.warning
                : colors.primary,
            }} />
          </div>
          <div style={styles.usageBarLabel}>
            <span style={styles.usageBarPct}>
              {usagePercent.toFixed(1)}% 已用
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.spaceStatsGrid}>
          <SpaceStat label="已用" value={formatBytes(used)} color={colors.primary} />
          <SpaceStat label="可用" value={formatBytes(available)} color={colors.success} />
          <SpaceStat label="总计" value={formatBytes(total)} color={colors.text} />
        </div>

        {/* Quotas */}
        {quota > 0 && <InfoRow label="配额 (Quota)" value={formatBytes(quota)} />}
        {refquota > 0 && <InfoRow label="引用配额 (Refquota)" value={formatBytes(refquota)} />}
        {dataset.usedbychildren && (
          <InfoRow
            label="子集使用"
            value={formatBytes((dataset.usedbychildren.parsed as number) ?? 0)}
          />
        )}
        {dataset.usedbysnapshots && (
          <InfoRow
            label="快照使用"
            value={formatBytes((dataset.usedbysnapshots.parsed as number) ?? 0)}
          />
        )}
      </div>

      {/* 加密信息 */}
      {dataset.encrypted && (
        <div style={styles.detailCard}>
          <div style={styles.detailCardTitle}>加密</div>
          <InfoRow label="加密状态" value="已加密" />
          {dataset.encryption_algorithm?.value && (
            <InfoRow label="加密算法" value={dataset.encryption_algorithm.value as string} />
          )}
          {dataset.encryption_root && dataset.encryption_root !== dataset.name && (
            <InfoRow label="加密根" value={dataset.encryption_root} mono />
          )}
          {dataset.keystatus?.value && (
            <InfoRow label="密钥状态" value={dataset.keystatus.value as string} />
          )}
        </div>
      )}
    </div>
  )
}

function SpaceStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={styles.spaceStat}>
      <span style={{ ...styles.spaceStatValue, color }}>{value}</span>
      <span style={styles.spaceStatLabel}>{label}</span>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={{ ...styles.infoValue, fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value}
      </span>
    </div>
  )
}

function syncLabel(v: string): string {
  const map: Record<string, string> = {
    ALWAYS: '始终',
    STANDARD: '标准',
    DISABLED: '已禁用',
  }
  return map[v] || v
}

function atimeLabel(v: string): string {
  const map: Record<string, string> = {
    ON: '开启',
    OFF: '关闭',
  }
  return map[v] || v
}

function dedupLabel(v: string): string {
  const map: Record<string, string> = {
    OFF: '关闭',
    ON: '开启',
    VERIFY: '验证',
    INHERIT: '继承',
  }
  return map[v] || v
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 0,
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 28,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: colors.primary,
    flexShrink: 0,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  breadcrumb: {
    fontSize: 12,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: 500,
  },
  pageTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: colors.text,
  },
  masterDetail: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
    minHeight: 500,
  },
  master: {
    width: 300,
    flexShrink: 0,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  masterInner: {
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 280px)',
  },
  emptyTree: {
    padding: '32px 16px',
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  treeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    userSelect: 'none' as const,
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: colors.textSecondary,
    flexShrink: 0,
    padding: 0,
  },
  expandSpacer: {
    width: 18,
    flexShrink: 0,
  },
  treeNameCol: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  treeName: {
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  zvolBadge: {
    fontSize: 9,
    fontWeight: 700,
    padding: '1px 4px',
    backgroundColor: colors.warning + '20',
    color: colors.warning,
    borderRadius: 3,
    flexShrink: 0,
    textTransform: 'uppercase' as const,
  },
  treeUsage: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
    width: 60,
  },
  usageBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  usageText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  detail: {
    flex: 1,
    minWidth: 0,
  },
  emptyDetail: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    gap: 12,
  },
  emptyDetailText: {
    fontSize: 14,
    color: colors.textTertiary,
    margin: 0,
  },
  detailPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  detailIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    backgroundColor: colors.primary + '12',
    borderRadius: 14,
    flexShrink: 0,
  },
  detailHeaderInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  detailTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: colors.text,
  },
  detailBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  typeBadge: {
    padding: '3px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  encryptedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    backgroundColor: colors.warning + '15',
    color: colors.warning,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  },
  detailCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  detailCardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 16,
  },
  usageBarWrap: {
    marginBottom: 16,
  },
  usageBarBgLarge: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  usageBarFillLarge: {
    height: '100%',
    borderRadius: 5,
    transition: 'width 0.3s ease',
  },
  usageBarLabel: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  usageBarPct: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  spaceStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 16,
  },
  spaceStat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    padding: '12px 8px',
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  spaceStatValue: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'monospace',
    fontVariantNumeric: 'tabular-nums',
  },
  spaceStatLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: 500,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    padding: '9px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
    textAlign: 'right' as const,
    wordBreak: 'break-all' as const,
  },
}
