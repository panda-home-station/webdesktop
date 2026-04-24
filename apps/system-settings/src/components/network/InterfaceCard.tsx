/**
 * Interface Card Component
 * Display a single network interface as a full-width card with complete info
 */

import React, { useState } from 'react'
import { NetworkInterface, NetworkInterfaceType, LinkState } from '@truenas/types/network-types'
import type { NetworkInterfaceUpdate } from '@truenas/types/system-types'
import { colors } from '../../styles/theme'
import { Edit, Trash2, Network, Link2, Radio, ArrowDown, ArrowUp, Copy, Check, ChevronDown, ChevronUp, EthernetPort } from 'lucide-react'

interface InterfaceCardProps {
  interface_: NetworkInterface
  stats?: NetworkInterfaceUpdate
  onEdit?: (iface: NetworkInterface) => void
  _onReset?: (iface: NetworkInterface) => void
  onDelete?: (iface: NetworkInterface) => void
  isHaEnabled?: boolean
}

function formatBytes(bytesPerSec: number): string {
  if (bytesPerSec === 0) return '0 B/s'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(1024))
  const value = bytesPerSec / Math.pow(1024, i)
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function CopyableText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div style={styles.copyableContainer}>
      <span style={style}>{text}</span>
      <button onClick={handleCopy} style={styles.copyButton} title="复制">
        {copied ? <Check size={12} color={colors.success} /> : <Copy size={12} />}
      </button>
    </div>
  )
}

export function InterfaceCard({
  interface_: iface,
  stats,
  onEdit,
  _onReset,
  onDelete,
  isHaEnabled = false,
}: InterfaceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isUp = iface.state?.link_state === LinkState.Up
  const isPhysical = iface.type === NetworkInterfaceType.Physical

  const getTypeIcon = () => {
    switch (iface.type) {
      case NetworkInterfaceType.Bridge:
        return <Network size={18} />
      case NetworkInterfaceType.LinkAggregation:
        return <Link2 size={18} />
      case NetworkInterfaceType.Vlan:
        return <Radio size={18} />
      default:
        return isUp ? <EthernetPort size={18} /> : <EthernetPort size={18} />
    }
  }

  const getTypeLabel = () => {
    switch (iface.type) {
      case NetworkInterfaceType.Bridge:
        return '网桥'
      case NetworkInterfaceType.LinkAggregation:
        return '链路聚合'
      case NetworkInterfaceType.Vlan:
        return 'VLAN'
      case NetworkInterfaceType.Physical:
        return '物理网卡'
      default:
        return iface.type || '未知'
    }
  }

  // Get all IP addresses from aliases
  const getIpAddresses = (): { ipv4: string[]; ipv6: string[] } => {
    const aliases = iface.state?.aliases || []
    const ipv4: string[] = []
    const ipv6: string[] = []

    aliases.forEach((alias) => {
      if (alias.type === 'INET' && alias.address) {
        ipv4.push(`${alias.address}${alias.netmask ? `/${alias.netmask}` : ''}`)
      } else if (alias.type === 'INET6' && alias.address) {
        ipv6.push(`${alias.address}${alias.netmask ? `/${alias.netmask}` : ''}`)
      }
    })

    return { ipv4, ipv6 }
  }

  const { ipv4, ipv6 } = getIpAddresses()

  return (
    <div style={styles.card}>
      {/* Top Row: Icon + Name + Status + Speed + Traffic + Actions */}
      <div style={styles.topRow}>
        <div style={styles.nameSection}>
          <div style={{
            ...styles.iconBox,
            backgroundColor: isUp ? colors.success + '15' : colors.background,
            color: isUp ? colors.success : colors.textSecondary,
          }}>
            {getTypeIcon()}
          </div>
          <div style={styles.nameContent}>
            <span style={styles.name}>{iface.name}</span>
            <span style={styles.typeLabel}>{getTypeLabel()}</span>
          </div>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: isUp ? colors.success + '15' : colors.danger + '15',
            color: isUp ? colors.success : colors.danger,
          }}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: isUp ? colors.success : colors.danger
            }} />
            {isUp ? '已连接' : '未连接'}
          </span>
          <div style={styles.trafficStats}>
            <div style={styles.trafficItem}>
              <ArrowDown size={14} color={colors.success} />
              <span style={styles.trafficValue}>{formatBytes(stats?.received_bytes_rate || 0)}</span>
            </div>
            <div style={styles.trafficItem}>
              <ArrowUp size={14} color={colors.primary} />
              <span style={styles.trafficValue}>{formatBytes(stats?.sent_bytes_rate || 0)}</span>
            </div>
          </div>
        </div>

        <div style={styles.topRight}>
          <div style={styles.actions}>
            <button
              onClick={() => onEdit?.(iface)}
              style={styles.editButton}
              title="编辑"
            >
              <Edit size={14} />
            </button>
            {!isPhysical && !isHaEnabled && (
              <button
                onClick={() => onDelete?.(iface)}
                style={{ ...styles.actionButton, color: colors.danger }}
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            )}

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setExpanded(!expanded)}
              style={styles.expandButton}
              title={expanded ? '收起' : '展开'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Info Grid - Only show when expanded */}
      {expanded && (
        <>
          <div style={styles.divider} />
          <div style={styles.infoGrid}>
          {/* IP Addresses Row */}
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>IP 地址</span>
            <div style={styles.ipList}>
              {ipv4.length > 0 ? (
                ipv4.map((ip, i) => (
                  <CopyableText key={`ipv4-${i}`} text={ip} style={styles.ipTag} />
                ))
              ) : (
                <span style={styles.noData}>-</span>
              )}
              {ipv6.length > 0 && ipv6.map((ip, i) => (
                <CopyableText key={`ipv6-${i}`} text={ip} style={{ ...styles.ipTag, ...styles.ipv6Tag }} />
              ))}
            </div>
          </div>

          {/* MAC Address Row */}
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>MAC 地址</span>
            <CopyableText
              text={iface.state?.link_address || iface.state?.permanent_link_address || '-'}
              style={styles.macAddress}
            />
          </div>
        </div>
        </>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
  } as React.CSSProperties,
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  } as React.CSSProperties,
  nameSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  nameContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  } as React.CSSProperties,
  name: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  description: {
    fontSize: 13,
    color: colors.textSecondary,
  } as React.CSSProperties,
  typeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  } as React.CSSProperties,
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  } as React.CSSProperties,
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  } as React.CSSProperties,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: 6,
  } as React.CSSProperties,
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  actionButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    color: colors.textSecondary,
  } as React.CSSProperties,
  expandButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    color: colors.textSecondary,
  } as React.CSSProperties,
  divider: {
    height: 1,
    backgroundColor: colors.border,
    margin: '12px 0',
  } as React.CSSProperties,
  infoGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } as React.CSSProperties,
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 8,
    marginBottom: 4,
    borderBottom: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  infoSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  } as React.CSSProperties,
  infoLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    minWidth: 70,
  } as React.CSSProperties,
  ipList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  } as React.CSSProperties,
  ipTag: {
    padding: '3px 8px',
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 500,
  } as React.CSSProperties,
  ipv6Tag: {
    backgroundColor: colors.warning + '15',
    color: colors.warning,
  } as React.CSSProperties,
  noData: {
    color: colors.textSecondary,
    fontSize: 13,
  } as React.CSSProperties,
  macAddress: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: colors.text,
    fontWeight: 500,
  } as React.CSSProperties,
  copyableContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    color: colors.textSecondary,
  } as React.CSSProperties,
  speedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,
  speedLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  } as React.CSSProperties,
  speedValue: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  trafficStats: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    backgroundColor: colors.background,
    borderRadius: 8,
  } as React.CSSProperties,
  trafficItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  } as React.CSSProperties,
  trafficValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 500,
    color: colors.text,
  } as React.CSSProperties,
}
