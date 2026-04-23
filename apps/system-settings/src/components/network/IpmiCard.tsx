/**
 * IPMI Card Component
 * Display IPMI management as a modern card
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Cpu, RefreshCw, Edit, Eye, Wifi, WifiOff } from 'lucide-react'
import { networkService } from '@truenas/services/network'
import type { IpmiLan } from '@truenas/types/network-types'
import { colors } from '../../styles/theme'

interface IpmiCardProps {
  onRefresh: () => void
}

export function IpmiCard({ onRefresh: _onRefresh }: IpmiCardProps) {
  const [ipmiEntries, setIpmiEntries] = useState<IpmiLan[]>([])
  const [loading, setLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(false)

  const loadIpmi = useCallback(async () => {
    try {
      const available = await networkService.isIpmiLoaded()
      setIsAvailable(available)
      if (available) {
        const data = await networkService.queryIpmiLan()
        setIpmiEntries(data)
      }
    } catch (error) {
      console.error('Failed to load IPMI:', error)
      setIsAvailable(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIpmi()
  }, [loadIpmi])

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.sectionTitle}>IPMI 管理</h3>
        <div style={styles.headerActions}>
          <button onClick={loadIpmi} style={styles.iconButton}>
            <RefreshCw size={16} />
          </button>
          {isAvailable && (
            <button style={styles.addButton}>
              <Edit size={14} />
              配置 IPMI
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.loadingState}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>加载中...</span>
        </div>
      ) : !isAvailable ? (
        <div style={styles.unavailableState}>
          <div style={styles.unavailableIcon}>
            <Cpu size={32} />
          </div>
          <h4 style={styles.unavailableTitle}>IPMI 不可用</h4>
          <p style={styles.unavailableText}>此系统不支持 IPMI 管理</p>
        </div>
      ) : ipmiEntries.length > 0 ? (
        <div style={styles.grid}>
          {ipmiEntries.map((entry) => (
            <div key={entry.id} style={styles.card}>
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div style={styles.channelIcon}>
                  <Cpu size={20} />
                </div>
                <div>
                  <div style={styles.channelLabel}>通道 {entry.channel}</div>
                  <div style={styles.channelSubLabel}>
                    {entry.ip_address ? (
                      <span style={styles.ipmiActive}>
                        <Wifi size={12} />
                        已配置
                      </span>
                    ) : (
                      <span style={styles.ipmiInactive}>
                        <WifiOff size={12} />
                        未配置
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* IP Info */}
              <div style={styles.ipInfo}>
                <div style={styles.ipRow}>
                  <span style={styles.ipLabel}>IP 地址</span>
                  <span style={styles.ipValue}>{entry.ip_address || '-'}</span>
                </div>
                <div style={styles.ipRow}>
                  <span style={styles.ipLabel}>子网掩码</span>
                  <span style={styles.ipValue}>{entry.subnet_mask || '-'}</span>
                </div>
                <div style={styles.ipRow}>
                  <span style={styles.ipLabel}>网关</span>
                  <span style={styles.ipValue}>{entry.default_gateway_ip_address || '-'}</span>
                </div>
              </div>

              {/* MAC Address */}
              <div style={styles.macSection}>
                <span style={styles.macLabel}>MAC 地址</span>
                <span style={styles.macValue}>{entry.mac_address}</span>
              </div>

              {/* VLAN */}
              {entry.vlan_id_enable && (
                <div style={styles.vlanSection}>
                  <span style={styles.vlanTag}>VLAN {entry.vlan_id}</span>
                </div>
              )}

              {/* Actions */}
              <div style={styles.cardActions}>
                <button style={styles.editBtn}>
                  <Edit size={14} />
                  编辑
                </button>
                <button style={styles.eventsBtn}>
                  <Eye size={14} />
                  查看事件
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔌</div>
          <h4 style={styles.emptyTitle}>暂无 IPMI 配置</h4>
          <p style={styles.emptyText}>配置 IPMI 以启用远程硬件管理</p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: 24,
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  } as React.CSSProperties,
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  iconButton: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    color: colors.textSecondary,
  } as React.CSSProperties,
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  } as React.CSSProperties,
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  } as React.CSSProperties,
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  channelLabel: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.text,
  } as React.CSSProperties,
  channelSubLabel: {
    fontSize: 12,
    marginTop: 2,
  } as React.CSSProperties,
  ipmiActive: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: colors.success,
    fontWeight: 500,
  } as React.CSSProperties,
  ipmiInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: colors.textSecondary,
    fontWeight: 500,
  } as React.CSSProperties,
  ipInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    paddingBottom: 12,
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: 12,
  } as React.CSSProperties,
  ipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  ipLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  } as React.CSSProperties,
  ipValue: {
    fontSize: 13,
    color: colors.text,
    fontFamily: 'monospace',
    fontWeight: 500,
  } as React.CSSProperties,
  macSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  } as React.CSSProperties,
  macLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  } as React.CSSProperties,
  macValue: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
  } as React.CSSProperties,
  vlanSection: {
    marginBottom: 12,
  } as React.CSSProperties,
  vlanTag: {
    padding: '4px 8px',
    backgroundColor: colors.warning + '20',
    color: colors.warning,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  } as React.CSSProperties,
  cardActions: {
    display: 'flex',
    gap: 8,
    paddingTop: 12,
    borderTop: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  editBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 12px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  eventsBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
  loadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 48,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    color: colors.textSecondary,
  } as React.CSSProperties,
  unavailableState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
  } as React.CSSProperties,
  unavailableIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  } as React.CSSProperties,
  unavailableTitle: {
    margin: '0 0 8px 0',
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  unavailableText: {
    margin: 0,
    fontSize: 14,
    color: colors.textSecondary,
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  } as React.CSSProperties,
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  } as React.CSSProperties,
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: colors.textSecondary,
  } as React.CSSProperties,
}