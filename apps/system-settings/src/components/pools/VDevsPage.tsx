/**
 * VDEVs Detail Page
 * Master-detail view of pool topology
 */

import { useState, useEffect } from 'react'
import { Pool } from '@truenas/types/pool'
import { VDevItem, isTopologyDisk } from '@truenas/types/storage-types'
import { TopologyItemType } from '@truenas/types/vdev-enum-types'
import { TopologyItemStatus, getTopologyStatusColor, getTopologyStatusLabel } from '@truenas/types/vdev-status-enum'
import { formatBytes } from '@truenas/utils/storage.utils'
import { diskService } from '@truenas/services/disk'
import { Disk } from '@truenas/types/disk-types'
import { colors } from '../../styles/theme'
import {
  HardDrive,
  Database,
  Layers,
  Archive,
  Box,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

interface VDevsPageProps {
  pool: Pool
  onBack: () => void
}

interface VDevGroup {
  key: string
  label: string
  icon: React.ReactNode
  vdevs: VDevItem[]
}

export function VDevsPage({ pool, onBack }: VDevsPageProps) {
  const [selectedItem, setSelectedItem] = useState<VDevItem | null>(null)
  const [expandedVdevs, setExpandedVdevs] = useState<Set<string>>(new Set(
    // Auto-expand all vdevs with children
    collectExpandableGuids(pool.topology)
  ))
  const [disks, setDisks] = useState<Record<string, Disk>>({})

  // Load all disks on mount
  useEffect(() => {
    async function loadDisks() {
      const allDisks = await diskService.query()
      const diskDict: Record<string, Disk> = {}
      allDisks.forEach(disk => {
        diskDict[disk.name] = disk
      })
      setDisks(diskDict)
    }
    loadDisks()
  }, [])

  // Get the full Disk info for a selected TopologyDisk
  const selectedDisk = selectedItem && isTopologyDisk(selectedItem)
    ? disks[selectedItem.disk]
    : null

  const groups: VDevGroup[] = [
    { key: 'data', label: '数据', icon: <Database size={14} />, vdevs: pool.topology.data || [] },
    { key: 'special', label: '元数据', icon: <Layers size={14} />, vdevs: pool.topology.special || [] },
    { key: 'dedup', label: '重删', icon: <Archive size={14} />, vdevs: pool.topology.dedup || [] },
    { key: 'log', label: '日志', icon: <HardDrive size={14} />, vdevs: pool.topology.log || [] },
    { key: 'cache', label: '缓存', icon: <Box size={14} />, vdevs: pool.topology.cache || [] },
    { key: 'spare', label: '热备', icon: <HardDrive size={14} />, vdevs: pool.topology.spare || [] },
  ].filter(g => g.vdevs.length > 0)

  function toggleVdev(guid: string, e: React.MouseEvent) {
    e.stopPropagation()
    setExpandedVdevs(prev => {
      const next = new Set(prev)
      if (next.has(guid)) next.delete(guid)
      else next.add(guid)
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
          <h1 style={styles.title}>{pool.name}</h1>
        </div>
      </div>

      {/* Top-Bottom Bubble Layout */}
      <div style={styles.bubbleLayout}>
        {/* Top Bubble: VDEV Tree Table */}
        <div style={styles.topBubble}>
          {/* Search Bar */}
          <div style={styles.searchBar}>
            <div style={styles.searchInputWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                style={styles.searchInput}
                placeholder="搜索"
                onChange={() => {}}
              />
            </div>
          </div>

          {/* Table Header */}
          <div style={styles.tableHeader}>
            <div style={styles.colName}>VDEV名称</div>
            <div style={styles.colStatus}>状态</div>
            <div style={styles.colCapacity}>容量</div>
            <div style={styles.colErrors}>ZFS 错误</div>
          </div>

          {/* Table Body */}
          <div style={styles.tableBody}>
            {groups.map(group => (
              <div key={group.key}>
                {/* Group Header Row */}
                <div style={styles.groupRow}>
                  <div style={styles.colName}>
                    <span style={styles.groupIcon}>{group.icon}</span>
                    <span style={styles.groupLabel}>{group.label}</span>
                    <button
                      style={styles.groupToggle}
                      onClick={() => {
                        // Toggle all vdevs in this group
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>

                {/* VDev Rows */}
                {group.vdevs.map(vdev => {
                  const isDisk = isTopologyDisk(vdev)
                  const hasChildren = !isDisk && (vdev.children?.length ?? 0) > 0
                  const isExpanded = expandedVdevs.has(vdev.guid)
                  const isSelected = selectedItem?.guid === vdev.guid
                  const statusColor = getTopologyStatusColor(vdev.status)
                  const statusLabel = getTopologyStatusLabel(vdev.status)
                  const hasErrors = hasVdevErrors(vdev)

                  return (
                    <div key={vdev.guid}>
                      {/* Main VDev Row */}
                      <div
                        style={{
                          ...styles.tableRow,
                          backgroundColor: isSelected ? colors.primary + '0a' : 'transparent',
                        }}
                        onClick={() => setSelectedItem(vdev)}
                      >
                        <div style={styles.colName}>
                          {hasChildren ? (
                            <button
                              style={styles.expandBtn}
                              onClick={e => toggleVdev(vdev.guid, e)}
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                          ) : (
                            <span style={styles.expandSpacer} />
                          )}
                          <HardDrive size={15} color={isSelected ? colors.primary : colors.textSecondary} />
                          <span style={{
                            ...styles.vdevName,
                            color: isSelected ? colors.primary : colors.text,
                          }}>
                            {isDisk ? vdev.disk : vdev.name}
                          </span>
                          {!isDisk && (
                            <span style={styles.vdevTypeBadge}>
                              {getVdevTypeLabel(vdev.type)}
                            </span>
                          )}
                        </div>
                        <div style={styles.colStatus}>
                          <span style={{ ...styles.statusDot, backgroundColor: statusColor }} />
                          <span style={styles.statusText}>{statusLabel}</span>
                        </div>
                        <div style={styles.colCapacity}>
                          {vdev.stats.size > 0 ? formatBytes(vdev.stats.size) : '-'}
                        </div>
                        <div style={styles.colErrors}>
                          {hasErrors ? (
                            <span style={styles.errorText}>
                              <AlertTriangle size={12} color={colors.danger} />
                              {item.stats.read_errors + item.stats.write_errors + item.stats.checksum_errors}
                            </span>
                          ) : (
                            <span style={styles.noErrorText}>没有错误</span>
                          )}
                        </div>
                      </div>

                      {/* Children Rows */}
                      {hasChildren && isExpanded && !isDisk && (
                        vdev.children.map(child => {
                          const isChildSelected = selectedItem?.guid === child.guid
                          const childStatusColor = getTopologyStatusColor(child.status)
                          const childStatusLabel = getTopologyStatusLabel(child.status)
                          const childHasErrors = hasVdevErrors(child)

                          return (
                            <div
                              key={child.guid}
                              style={{
                                ...styles.tableRow,
                                ...styles.childRow,
                                backgroundColor: isChildSelected ? colors.primary + '0a' : 'transparent',
                              }}
                              onClick={() => setSelectedItem(child)}
                            >
                              <div style={styles.colName}>
                                <span style={styles.childIndent} />
                                <HardDrive size={13} color={isChildSelected ? colors.primary : colors.textTertiary} />
                                <span style={{
                                  ...styles.diskName,
                                  color: isChildSelected ? colors.primary : colors.text,
                                }}>
                                  {child.disk}
                                </span>
                              </div>
                              <div style={styles.colStatus}>
                                <span style={{ ...styles.statusDot, backgroundColor: childStatusColor }} />
                                <span style={styles.statusText}>{childStatusLabel}</span>
                              </div>
                              <div style={styles.colCapacity}>
                                {child.stats.size > 0 ? formatBytes(child.stats.size) : '-'}
                              </div>
                              <div style={styles.colErrors}>
                                {childHasErrors ? (
                                  <span style={styles.errorText}>
                                    <AlertTriangle size={12} color={colors.danger} />
                                    {child.stats.read_errors + child.stats.write_errors + child.stats.checksum_errors}
                                  </span>
                                ) : (
                                  <span style={styles.noErrorText}>没有错误</span>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bubble: Detail Panel */}
        {selectedItem && (
          <div style={styles.bottomBubble}>
            <VDevDetailPanel item={selectedItem} disk={selectedDisk} />
          </div>
        )}
      </div>
    </div>
  )
}

function VDevDetailPanel({ item, disk }: { item: VDevItem; disk: Disk | null }) {
  const isDisk = isTopologyDisk(item)
  const statusColor = getTopologyStatusColor(item.status)
  const statusLabel = getTopologyStatusLabel(item.status)
  const hasErrors = hasVdevErrors(item)
  const allOk = item.status === TopologyItemStatus.Online && !hasErrors

  return (
    <div style={styles.detailPanel}>
      {/* Detail Header */}
      <div style={styles.detailHeader}>
        <div style={styles.detailIconWrap}>
          <HardDrive size={28} color={colors.primary} />
        </div>
        <div style={styles.detailHeaderInfo}>
          <h2 style={styles.detailTitle}>{isDisk ? item.disk : item.name}</h2>
          <div style={styles.detailBadges}>
            {!isDisk && (
              <span style={styles.typeBadge}>{getVdevTypeLabel(item.type)}</span>
            )}
            <span style={{ ...styles.statusBadge, backgroundColor: statusColor }}>
              {statusLabel}
            </span>
            {allOk && (
              <span style={styles.okBadge}>
                <CheckCircle size={12} />
                无错误
              </span>
            )}
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.editButton}>编辑</button>
        </div>
      </div>

      {/* 磁盘信息 (仅对磁盘显示) */}
      {isDisk && disk && (
        <div style={styles.detailCard}>
          <div style={styles.detailCardTitle}>磁盘信息</div>
          {disk.size > 0 && (
            <InfoRow label="磁盘大小" value={formatBytes(disk.size)} />
          )}
          <InfoRow label="传输模式" value={disk.transfermode} />
          <InfoRow label="序列号" value={disk.serial} mono />
          <InfoRow label="型号" value={disk.model || '不可用'} />
          <InfoRow
            label="转速"
            value={disk.rotationrate ? `${disk.rotationrate} RPM` : '不可用'}
          />
          <InfoRow label="类型" value={disk.type} />
          <InfoRow label="HDD 休眠" value={disk.hddstandby} />
          <InfoRow label="描述" value={disk.description || '不可用'} />
        </div>
      )}

      {/* ZFS 统计 */}
      <div style={styles.detailCard}>
        <div style={styles.detailCardTitle}>ZFS 统计</div>
        <div style={styles.statsGrid}>
          <StatBox
            label="读错误"
            value={item.stats.read_errors}
            error={item.stats.read_errors > 0}
          />
          <StatBox
            label="写错误"
            value={item.stats.write_errors}
            error={item.stats.write_errors > 0}
          />
          <StatBox
            label="校验错误"
            value={item.stats.checksum_errors}
            error={item.stats.checksum_errors > 0}
          />
        </div>
        {hasErrors && (
          <div style={styles.errorBanner}>
            <AlertTriangle size={14} />
            此设备存在错误，建议检查磁盘健康状态
          </div>
        )}
      </div>

      {/* 设备信息 */}
      <div style={styles.detailCard}>
        <div style={styles.detailCardTitle}>设备信息</div>
        <InfoRow label="GUID" value={item.guid} mono />
        {item.path && <InfoRow label="设备路径" value={item.path} mono />}
        <InfoRow label="类型" value={isDisk ? '磁盘' : getVdevTypeLabel(item.type)} />
        {item.stats.size > 0 && (
          <InfoRow label="容量" value={formatBytes(item.stats.size)} />
        )}
        {!isDisk && item.stats.allocated > 0 && (
          <InfoRow label="已分配" value={formatBytes(item.stats.allocated)} />
        )}
        {!isDisk && item.stats.size > 0 && item.stats.allocated > 0 && (
          <InfoRow
            label="可用"
            value={formatBytes(item.stats.size - item.stats.allocated)}
          />
        )}
      </div>

      {/* Children count (for vdevs) */}
      {!isDisk && (item.children?.length ?? 0) > 0 && (
        <div style={styles.detailCard}>
          <div style={styles.detailCardTitle}>子设备</div>
          {item.children.map(child => (
            <div key={child.guid} style={styles.childRow}>
              <HardDrive size={14} color={colors.textSecondary} />
              <span style={styles.childName}>{child.disk}</span>
              <span style={{
                ...styles.childStatus,
                color: getTopologyStatusColor(child.status),
              }}>
                {getTopologyStatusLabel(child.status)}
              </span>
              {child.stats.size > 0 && (
                <span style={styles.childSize}>{formatBytes(child.stats.size)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isDisk && (
        <div style={styles.actionsBar}>
          <button style={styles.replaceButton}>更换</button>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, error }: { label: string; value: number; error?: boolean }) {
  return (
    <div style={{
      ...styles.statBox,
      borderColor: error ? colors.danger + '50' : colors.border,
      backgroundColor: error ? colors.danger + '08' : colors.background,
    }}>
      <span style={{ ...styles.statBoxValue, color: error ? colors.danger : colors.text }}>
        {value}
      </span>
      <span style={styles.statBoxLabel}>{label}</span>
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

function hasVdevErrors(item: VDevItem): boolean {
  return (
    item.stats.read_errors > 0 ||
    item.stats.write_errors > 0 ||
    item.stats.checksum_errors > 0
  )
}

function collectExpandableGuids(topology: Pool['topology']): string[] {
  const guids: string[] = []
  const allVdevs = [
    ...(topology.data || []),
    ...(topology.special || []),
    ...(topology.dedup || []),
    ...(topology.log || []),
    ...(topology.cache || []),
    ...(topology.spare || []),
  ]
  for (const vdev of allVdevs) {
    if (!isTopologyDisk(vdev) && (vdev.children?.length ?? 0) > 0) {
      guids.push(vdev.guid)
    }
  }
  return guids
}

function getVdevTypeLabel(type: TopologyItemType): string {
  const labels: Record<string, string> = {
    [TopologyItemType.Mirror]: 'Mirror',
    [TopologyItemType.Raidz]: 'RAIDZ',
    [TopologyItemType.Raidz1]: 'RAIDZ1',
    [TopologyItemType.Raidz2]: 'RAIDZ2',
    [TopologyItemType.Raidz3]: 'RAIDZ3',
    [TopologyItemType.Stripe]: 'Stripe',
    [TopologyItemType.Disk]: 'Disk',
    [TopologyItemType.L2Cache]: 'L2ARC',
    [TopologyItemType.Log]: 'Log',
    [TopologyItemType.Spare]: 'Spare',
    [TopologyItemType.Draid]: 'DRAID',
  }
  return labels[type] || type
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
  bubbleLayout: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  topBubble: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  searchBar: {
    padding: '12px 16px',
    backgroundColor: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
  },
  searchInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    backgroundColor: colors.background,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: 14,
    color: colors.text,
    outline: 'none',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tableBody: {
    maxHeight: 'calc(50vh - 120px)',
    overflowY: 'auto' as const,
  },
  groupRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: colors.cardBg,
    borderBottom: `1px solid ${colors.border}`,
  },
  groupIcon: {
    color: colors.primary,
    display: 'flex',
    alignItems: 'center',
    marginRight: 8,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
  },
  groupToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: colors.textSecondary,
    padding: 0,
    marginLeft: 4,
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
    userSelect: 'none' as const,
    borderBottom: `1px solid ${colors.border}`,
  },
  childRow: {
    backgroundColor: colors.background + '50',
  },
  colName: {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  colStatus: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  colCapacity: {
    flex: 1,
    textAlign: 'right' as const,
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  colErrors: {
    flex: 1,
    textAlign: 'right' as const,
    fontSize: 13,
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
  vdevName: {
    fontSize: 13,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  vdevTypeBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 5px',
    backgroundColor: colors.primary + '18',
    color: colors.primary,
    borderRadius: 3,
    flexShrink: 0,
    textTransform: 'uppercase' as const,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 500,
  },
  errorText: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: colors.danger,
    fontWeight: 500,
  },
  noErrorText: {
    color: colors.success,
    fontSize: 12,
  },
  childIndent: {
    width: 26,
    flexShrink: 0,
  },
  diskName: {
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  bottomBubble: {
    minHeight: 300,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
  headerActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 8,
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: colors.primary,
    cursor: 'pointer',
  },
  actionsBar: {
    display: 'flex',
    gap: 8,
    padding: '16px 24px',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
  },
  replaceButton: {
    padding: '8px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
    cursor: 'pointer',
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
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  statusBadge: {
    padding: '3px 10px',
    color: 'white',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  okBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    backgroundColor: colors.success + '15',
    color: colors.success,
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    padding: '14px 10px',
    borderRadius: 10,
    border: '1px solid',
  },
  statBoxValue: {
    fontSize: 28,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  statBoxLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: 500,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: '10px 14px',
    backgroundColor: colors.warning + '12',
    border: `1px solid ${colors.warning}30`,
    borderRadius: 8,
    fontSize: 13,
    color: colors.warning,
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
  childRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  childName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
  },
  childStatus: {
    fontSize: 12,
    fontWeight: 600,
  },
  childSize: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
}
