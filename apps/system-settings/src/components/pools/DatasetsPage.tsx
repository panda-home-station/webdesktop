/**
 * Datasets Detail Page
 * Master-detail view of pool datasets
 * Styled after VDEVsPage with bubble layout and glassCard sections
 */

import { useState } from 'react'
import { Dataset, isVolume, isFilesystem, isDatasetEncrypted } from '@truenas/types/dataset-types'
import { DatasetCaseSensitivity } from '@truenas/types/dataset-enum-types'
import { DeduplicationSetting } from '@truenas/types/dedup-enum-types'
import { OnOff } from '@truenas/types/on-off-enum-types'
import { ZfsPropertySource } from '@truenas/types/zfs-property-types'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../../styles/theme'
import {
  Folder,
  FolderOpen,
  HardDrive,
  ChevronRight,
  ChevronDown,
  Lock,
  Copy,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

interface DatasetsPageProps {
  poolName: string
  datasets: Dataset[]
  onBack: () => void
  onEditDataset?: (dataset: Dataset) => void
  onDeleteDataset?: (dataset: Dataset) => void
  onPromoteDataset?: (dataset: Dataset) => void
}

export function DatasetsPage({
  poolName,
  datasets,
  onBack,
  onEditDataset,
  onDeleteDataset,
  onPromoteDataset,
}: DatasetsPageProps) {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)

  // Root datasets for this pool
  const rootDatasets = datasets.filter(d => d.pool === d.name)

  // Compute all expandable IDs once
  const allExpandedIds = new Set<string>()
  function collectIds(d: Dataset) {
    allExpandedIds.add(d.id)
    d.children?.forEach(collectIds)
  }
  rootDatasets.forEach(collectIds)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(allExpandedIds)

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
          <h1 style={styles.title}>{poolName}</h1>
        </div>
      </div>

      {/* Master-Detail Bubble Layout */}
      <div style={styles.bubbleLayout}>
        {/* Left Bubble: Dataset Tree */}
        <div style={styles.leftBubble}>
          {/* Tree Header */}
          <div style={styles.treeHeader}>
            <div style={styles.treeHeaderLeft}>
              <Folder size={16} color={colors.primary} />
              <span style={styles.treeHeaderTitle}>数据集列表</span>
              <span style={styles.treeHeaderBadge}>{rootDatasets.length} 个</span>
            </div>
          </div>

          {/* Tree Content */}
          <div style={styles.treeContent}>
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

        {/* Right Bubble: Detail Panel - only show when dataset is selected */}
        {selectedDataset && (
          <div style={styles.rightBubble}>
            <DatasetDetailPanel
              dataset={selectedDataset}
              onEdit={onEditDataset}
              onDelete={onDeleteDataset}
              onPromote={onPromoteDataset}
            />
          </div>
        )}
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
  const isEncrypted = isDatasetEncrypted(dataset)

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
          backgroundColor: isSelected ? colors.primary + '0a' : 'transparent',
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
          {isEncrypted && <Lock size={11} color={colors.warning} />}
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

function DatasetDetailPanel({
  dataset,
  onEdit,
  onDelete,
  onPromote,
}: {
  dataset: Dataset
  onEdit?: (d: Dataset) => void
  onDelete?: (d: Dataset) => void
  onPromote?: (d: Dataset) => void
}) {
  const isVol = isVolume(dataset)
  const isFilesys = isFilesystem(dataset)
  const isEncrypted = isDatasetEncrypted(dataset)
  const isRootDataset = dataset.name === dataset.pool
  const canPromote = !!dataset.origin?.value

  const used = (dataset.used?.parsed as number) ?? 0
  const available = (dataset.available?.parsed as number) ?? 0
  const total = used + available
  const usagePercent = total > 0 ? (used / total) * 100 : 0

  const usedByChildren = (dataset.usedbychildren?.parsed as number) ?? 0
  const usedBySnapshots = (dataset.usedbysnapshots?.parsed as number) ?? 0
  const usedByDataset = (dataset.usedbydataset?.parsed as number) ?? 0

  const quota = (dataset.quota?.parsed as number) ?? 0
  const refquota = (dataset.refquota?.parsed as number) ?? 0
  const reservation = (dataset.reservation?.parsed as number) ?? 0
  const refreservation = (dataset.refreservation?.parsed as number) ?? 0

  // Comments from user_properties
  const comments = dataset.user_properties?.['org.freenas:comment']?.value as string | undefined
  const hasComments = comments && comments.length > 0

  // Compression ratio
  const compressratio = dataset.compressratio?.value as string | undefined
  const compressionValue = dataset.compression?.value as string | undefined

  // Sync handling
  const syncValue = dataset.sync?.value as string | undefined
  const syncSource = dataset.sync?.source

  // Atime
  const atimeValue = dataset.atime?.value as OnOff | undefined

  // Deduplication
  const dedupValue = dataset.deduplication?.value as DeduplicationSetting | undefined

  // Case sensitivity
  const caseValue = dataset.casesensitivity?.value as DatasetCaseSensitivity | undefined

  // Origin (for clones)
  const originValue = dataset.origin?.value as string | undefined

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div style={styles.outerCard}>
      {/* Detail Header - Apple-style card */}
      <div style={styles.headerSection}>
        <div style={styles.detailIconWrap}>
          {isVol
            ? <HardDrive size={28} color={colors.warning} />
            : <Folder size={28} color={colors.primary} />
          }
        </div>
        <div style={styles.headerText}>
          <div style={styles.detailTitle}>{dataset.name.split('/').pop()}</div>
          <div style={styles.detailMeta}>
            <span style={{
              ...styles.typeBadge,
              backgroundColor: isVol ? colors.warning + '15' : colors.primary + '15',
              color: isVol ? colors.warning : colors.primary,
            }}>
              {isVol ? 'Zvol' : 'Filesystem'}
            </span>
            {isEncrypted && (
              <span style={styles.encryptedBadge}>
                <Lock size={11} />
                已加密
              </span>
            )}
            {!isRootDataset && (
              <span style={styles.pathBadge}>
                {dataset.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isRootDataset && (
        <div style={styles.actionBar}>
          {canPromote && onPromote && (
            <button
              style={styles.actionBtn}
              onClick={() => onPromote(dataset)}
            >
              <RefreshCw size={14} />
              提升
            </button>
          )}
          {onEdit && (
            <button
              style={styles.actionBtnPrimary}
              onClick={() => onEdit(dataset)}
            >
              编辑
            </button>
          )}
          {onDelete && (
            <button
              style={styles.actionBtnDanger}
              onClick={() => onDelete(dataset)}
            >
              <Trash2 size={14} />
              删除
            </button>
          )}
        </div>
      )}

      {/* Space Usage Section */}
      <div style={{ ...styles.sectionWrap, borderTop: `1px solid ${colors.border}` }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>空间使用</span>
        </div>
        <div style={styles.glassCard}>
          {/* Main usage bar */}
          <div style={styles.usageBarSection}>
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
            <div style={styles.usageBarPctLabel}>
              {usagePercent.toFixed(1)}% 已用 ({formatBytes(used)} / {formatBytes(total)})
            </div>
          </div>

          {/* Stats grid */}
          <div style={styles.spaceStatsGrid}>
            <SpaceStat label="已用" value={formatBytes(used)} color={colors.primary} />
            <SpaceStat label="可用" value={formatBytes(available)} color={colors.success} />
            <SpaceStat label="总计" value={formatBytes(total)} color={colors.text} />
          </div>

          {/* Breakdown */}
          <div style={styles.breakdownSection}>
            <InfoRow label="数据集本身" value={formatBytes(usedByDataset)} />
            <InfoRow label="子数据集" value={formatBytes(usedByChildren)} />
            <InfoRow label="快照" value={formatBytes(usedBySnapshots)} />
          </div>
        </div>
      </div>

      {/* Quotas Section */}
      {(quota > 0 || refquota > 0 || reservation > 0 || refreservation > 0) && (
        <div style={{ ...styles.sectionWrap, borderTop: `1px solid ${colors.border}` }}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>配额与预留</span>
          </div>
          <div style={styles.glassCard}>
            {quota > 0 && <InfoRow label="配额 (Quota)" value={formatBytes(quota)} />}
            {refquota > 0 && <InfoRow label="引用配额 (Refquota)" value={formatBytes(refquota)} />}
            {reservation > 0 && <InfoRow label="预留 (Reservation)" value={formatBytes(reservation)} />}
            {refreservation > 0 && <InfoRow label="引用预留 (Refreservation)" value={formatBytes(refreservation)} />}
          </div>
        </div>
      )}

      {/* ZFS Properties Section */}
      <div style={{ ...styles.sectionWrap, borderTop: `1px solid ${colors.border}` }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>ZFS 属性</span>
        </div>
        <div style={styles.glassCard}>
          {/* Sync */}
          {syncValue && (
            <InfoRow
              label="同步 (Sync)"
              value={syncSource === ZfsPropertySource.Inherited
                ? `继承 (${syncLabel(syncValue)})`
                : syncLabel(syncValue)
              }
            />
          )}

          {/* Compression */}
          {compressionValue && (
            <InfoRow
              label="压缩"
              value={compressratio
                ? `${compressionValue} (${compressratio})`
                : compressionValue
              }
            />
          )}

          {/* Atime - only for filesystems */}
          {isFilesys && atimeValue !== undefined && (
            <InfoRow label="访问时间 (Atime)" value={atimeLabel(atimeValue)} />
          )}

          {/* Deduplication */}
          {dedupValue && (
            <InfoRow label="重复消除 (Deduplication)" value={dedupLabel(dedupValue)} />
          )}

          {/* Case Sensitivity - only for filesystems */}
          {isFilesys && caseValue && (
            <InfoRow
              label="大小写敏感"
              value={caseValue === DatasetCaseSensitivity.Sensitive ? '是' : '否'}
            />
          )}

          {/* Checksum */}
          {dataset.checksum?.value && (
            <InfoRow label="校验" value={dataset.checksum.value as string} />
          )}

          {/* Readonly */}
          {dataset.readonly?.value !== undefined && (
            <InfoRow
              label="只读"
              value={dataset.readonly.value === OnOff.On ? '是' : '否'}
            />
          )}

          {/* Exec */}
          {dataset.exec?.value !== undefined && (
            <InfoRow
              label="执行权限"
              value={dataset.exec.value === OnOff.On ? '允许' : '禁止'}
            />
          )}

          {/* Recordsize */}
          {dataset.recordsize?.value && (
            <InfoRow label="记录大小" value={dataset.recordsize.value as string} />
          )}

          {/* Snapdir - only for filesystems */}
          {isFilesys && dataset.snapdir?.value && (
            <InfoRow
              label="快照目录"
              value={dataset.snapdir.value === 'VISIBLE' ? '可见' : '隐藏'}
            />
          )}
        </div>
      </div>

      {/* Path Section */}
      <div style={{ ...styles.sectionWrap, borderTop: `1px solid ${colors.border}` }}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>路径信息</span>
        </div>
        <div style={styles.glassCard}>
          <div style={styles.pathRow}>
            <span style={styles.pathLabel}>完整路径</span>
            <div style={styles.pathValueWrap}>
              <span style={styles.pathValue}>{dataset.name}</span>
              <button
                style={styles.copyBtn}
                onClick={() => handleCopy(dataset.name)}
                title="复制"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
          {dataset.mountpoint && (
            <div style={styles.pathRow}>
              <span style={styles.pathLabel}>挂载点</span>
              <div style={styles.pathValueWrap}>
                <span style={styles.pathValue}>{dataset.mountpoint}</span>
                <button
                  style={styles.copyBtn}
                  onClick={() => handleCopy(dataset.mountpoint)}
                  title="复制"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {hasComments && (
        <div style={{ ...styles.sectionWrap, borderTop: `1px solid ${colors.border}` }}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>备注</span>
          </div>
          <div style={styles.glassCard}>
            <div style={styles.commentsWrap}>
              {comments}
            </div>
          </div>
        </div>
      )}

      {/* Origin Section (for clones) */}
      {originValue && (
        <div style={{ ...styles.sectionWrap, borderTop: `1px solid ${colors.border}` }}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>来源</span>
          </div>
          <div style={styles.glassCard}>
            <div style={styles.pathRow}>
              <span style={styles.pathLabel}>源数据集</span>
              <div style={styles.pathValueWrap}>
                <span style={styles.pathValue}>{originValue}</span>
                <button
                  style={styles.copyBtn}
                  onClick={() => handleCopy(originValue)}
                  title="复制"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Section */}
      {isEncrypted && (
        <div style={{ ...styles.sectionWrap, borderTop: `1px solid ${colors.border}` }}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>加密信息</span>
            <ShieldCheck size={16} color={colors.success} />
          </div>
          <div style={styles.glassCard}>
            <InfoRow label="加密状态" value="已加密" />
            {dataset.encryption_algorithm?.value && (
              <InfoRow label="加密算法" value={dataset.encryption_algorithm.value as string} />
            )}
            {dataset.encryption_root && dataset.encryption_root !== dataset.name && (
              <InfoRow label="加密根" value={dataset.encryption_root} mono />
            )}
            {dataset.key_format?.value && (
              <InfoRow label="密钥格式" value={dataset.key_format.value as string} />
            )}
            {dataset.key_loaded !== undefined && (
              <InfoRow label="密钥已加载" value={dataset.key_loaded ? '是' : '否'} />
            )}
          </div>
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
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: colors.text,
    flex: 1,
  },
  // Bubble Layout
  bubbleLayout: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  leftBubble: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  rightBubble: {
    minHeight: 400,
  },

  // Tree Header
  treeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  treeHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  treeHeaderTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  treeHeaderBadge: {
    padding: '3px 8px',
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
  },

  // Tree Content
  treeContent: {
    maxHeight: 'calc(50vh - 100px)',
    overflowY: 'auto' as const,
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
    borderBottom: `1px solid ${colors.border}`,
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

  // Apple-style outer card
  outerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  },

  // Header section
  headerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 24px',
    backgroundColor: colors.cardBg,
  },
  detailIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: colors.primary + '14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.3px',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  detailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap' as const,
  },
  typeBadge: {
    padding: '3px 9px',
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
  },
  encryptedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 9px',
    backgroundColor: colors.warning + '15',
    color: colors.warning,
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
  },
  pathBadge: {
    padding: '3px 9px',
    backgroundColor: colors.background,
    color: colors.textSecondary,
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 500,
    fontFamily: 'monospace',
  },

  // Action bar
  actionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  actionBtnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    backgroundColor: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  actionBtnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.danger}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: colors.danger,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Section wrapper (VDEVs style)
  sectionWrap: {
    padding: '0 24px 20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.6px',
  },

  // Glass card (all corners rounded)
  glassCard: {
    backgroundColor: colors.background,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 14,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },

  // Space usage
  usageBarSection: {
    padding: '16px 16px 12px',
  },
  usageBarBgLarge: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  usageBarFillLarge: {
    height: '100%',
    borderRadius: 5,
    transition: 'width 0.3s ease',
  },
  usageBarPctLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right' as const,
  },

  // Stats grid
  spaceStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    padding: '0 16px 16px',
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

  // Breakdown section
  breakdownSection: {
    borderTop: `1px solid ${colors.border}`,
    padding: '0 16px',
  },

  // Info row
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '10px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: 500,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
    textAlign: 'right' as const,
    wordBreak: 'break-all' as const,
  },

  // Path section
  pathRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    padding: '10px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  pathLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: 500,
    flexShrink: 0,
  },
  pathValueWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  pathValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  copyBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    color: colors.textSecondary,
    flexShrink: 0,
    padding: 0,
  },

  // Comments
  commentsWrap: {
    padding: '12px 16px',
    fontSize: 13,
    color: colors.text,
    lineHeight: 1.5,
  },
}
