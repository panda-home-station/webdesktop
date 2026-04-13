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
    <div style={styles.outerCard}>
      {/* Header */}
      <div style={styles.headerSection}>
        <div style={styles.diskIconWrap}>
          <HardDrive size={28} color={colors.primary} />
        </div>
        <div style={styles.headerText}>
          <div style={styles.diskIdentifier}>{isDisk ? item.disk : item.name}</div>
          <div style={styles.diskMeta}>
            {!isDisk && (
              <span style={styles.typeBadge}>{getVdevTypeLabel(item.type)}</span>
            )}
            <span style={{ ...styles.statusPill, backgroundColor: statusColor }}>
              {statusLabel}
            </span>
            {allOk && (
              <span style={styles.okPill}>
                <CheckCircle size={11} />
                正常
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.sectionDivider} />

      {/* ZFS 统计 */}
      <div style={styles.sectionWrap}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>ZFS 统计</span>
          <div style={styles.actionBtnsRow}>
            <button style={styles.actionBtn}>扩展</button>
            <button style={styles.actionBtn}>删除</button>
            <button style={styles.actionBtn}>离线</button>
          </div>
        </div>
        <div style={styles.glassCard}>
          <InfoRow label="读错误" value={item.stats.read_errors} />
          <InfoRow label="写错误" value={item.stats.write_errors} />
          <InfoRow label="校验错误" value={item.stats.checksum_errors} />
          {hasErrors && (
            <div style={styles.errorBanner}>
              <AlertTriangle size={13} />
              <span>检测到错误，建议检查磁盘健康状态</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.sectionDivider} />

      {/* 磁盘信息 */}
      {isDisk && disk && (
        <div style={styles.sectionWrap}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>磁盘信息</span>
            <div style={styles.actionBtnsRow}>
              <button style={styles.actionBtn}>编辑</button>
              <button style={styles.actionBtnPrimary}>更换</button>
            </div>
          </div>
          <div style={styles.glassCard}>
            <InfoRow label="容量" value={disk.size > 0 ? formatBytes(disk.size) : '-'} />
            <InfoRow label="传输模式" value={disk.transfermode || '-'} />
            <InfoRow label="型号" value={disk.model || '-'} />
            <InfoRow label="转速" value={disk.rotationrate ? `${disk.rotationrate} RPM` : '-'} />
            <InfoRow label="类型" value={disk.type || '-'} />
            <InfoRow label="HDD 休眠" value={disk.hddstandby || '-'} />
            {disk.serial && <InfoRow label="序列号" value={disk.serial} mono />}
            {disk.description && <InfoRow label="描述" value={disk.description} />}
          </div>
        </div>
      )}

      {/* Children count (for vdevs) */}
      {!isDisk && (item.children?.length ?? 0) > 0 && (
        <div style={styles.sectionWrap}>
          <div style={styles.sectionLabel}>子设备</div>
          <div style={styles.glassCard}>
            {item.children.map(child => (
              <div key={child.guid} style={styles.childItem}>
                <HardDrive size={14} color={colors.textSecondary} />
                <span style={styles.childItemName}>{child.disk}</span>
                <span style={{
                  ...styles.childItemStatus,
                  color: getTopologyStatusColor(child.status),
                }}>
                  {getTopologyStatusLabel(child.status)}
                </span>
                {child.stats.size > 0 && (
                  <span style={styles.childItemSize}>{formatBytes(child.stats.size)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, mono, error }: { label: string; value: string | number; mono?: boolean; error?: boolean }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={{
        ...styles.infoValue,
        fontFamily: mono ? 'monospace' : 'inherit',
        color: error ? colors.danger : 'inherit',
      }}>
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
  diskIconWrap: {
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
  diskIdentifier: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
    letterSpacing: '-0.3px',
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  diskMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap' as const,
  },
  typeBadge: {
    padding: '3px 9px',
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.2px',
  },
  statusPill: {
    padding: '3px 9px',
    color: 'white',
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
  },
  okPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 9px',
    backgroundColor: colors.success + '15',
    color: colors.success,
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
  },

  // Section wrapper
  sectionWrap: {
    padding: '0 24px 20px',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    margin: '0',
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

  // Glass card
  glassCard: {
    backgroundColor: colors.background,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 14,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    border: `1px solid ${colors.border}`,
    borderTop: 'none',
    overflow: 'hidden',
  },

  // Action buttons row
  actionBtnsRow: {
    display: 'flex',
    gap: 8,
  },
  actionBtn: {
    padding: '8px 16px',
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
    padding: '8px 16px',
    backgroundColor: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Error banner
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: 0,
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderTop: `1px solid rgba(255, 69, 58, 0.15)`,
    fontSize: 13,
    color: colors.danger,
    fontWeight: 500,
  },

  // Info row (simple label: value format)
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

  // Child items (for vdev children)
  childItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
  },
  childItemName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
    fontFamily: 'SF Mono, Menlo, Monaco, monospace',
  },
  childItemStatus: {
    fontSize: 11,
    fontWeight: 600,
  },
  childItemSize: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'SF Mono, Menlo, Monaco, monospace',
  },
}
