/**
 * Network Configuration Card Component
 * Display network configuration as a modern card
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Globe, Server, Wifi, Shield, Edit } from 'lucide-react'
import { networkService } from '@truenas/services/network'
import type { NetworkConfigurationConfig, NetworkSummary } from '@truenas/types/network-types'
import { colors } from '../../styles/theme'

interface NetworkConfigurationCardProps {
  onRefresh: () => void
}

export function NetworkConfigurationCard({ onRefresh: _onRefresh }: NetworkConfigurationCardProps) {
  const [config, setConfig] = useState<NetworkConfigurationConfig | null>(null)
  const [_summary, setSummary] = useState<NetworkSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    try {
      const [configData, summaryData] = await Promise.all([
        networkService.getConfiguration(),
        networkService.getGeneralSummary(),
      ])
      setConfig(configData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load network config:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  if (loading || !config) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.sectionTitle}>网络配置</h3>
        </div>
        <div style={styles.loadingState}>
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  const getServiceAnnouncement = (): string[] => {
    const options: string[] = []
    if (config.service_announcement?.netbios) options.push('NETBIOS-NS')
    if (config.service_announcement?.mdns) options.push('mDNS')
    if (config.service_announcement?.wsd) options.push('WS-DISCOVERY')
    return options
  }

  const getOutboundNetwork = (): { label: string; type: 'allow' | 'deny' | 'mixed' } => {
    if (!config.activity) return { label: '未配置', type: 'allow' }
    if (config.activity.activities.length === 0) {
      return config.activity.type === 'ALLOW'
        ? { label: '允许全部', type: 'allow' }
        : { label: '拒绝全部', type: 'deny' }
    }
    if (config.activity.type === 'ALLOW') {
      return { label: `仅允许: ${config.activity.activities.join(', ')}`, type: 'mixed' }
    }
    return { label: `允许全部，除了: ${config.activity.activities.join(', ')}`, type: 'mixed' }
  }

  const outbound = getOutboundNetwork()
  const services = getServiceAnnouncement()

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.sectionTitle}>网络配置</h3>
        <button style={styles.editButton}>
          <Edit size={14} />
          编辑
        </button>
      </div>

      {/* Main Card */}
      <div style={styles.card}>
        {/* Hostname Section */}
        <div style={styles.section}>
          <div style={styles.iconBox}>
            <Server size={20} />
          </div>
          <div style={styles.sectionContent}>
            <div style={styles.mainValue}>{config.hostname}</div>
            <div style={styles.subValue}>
              域名: {config.domain || '(无)'}
              {config.domains?.length > 0 && ` • ${config.domains.join(', ')}`}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Network Info Grid */}
        <div style={styles.grid}>
          {/* DNS Servers */}
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>
              <Globe size={14} />
              DNS 服务器
            </div>
            <div style={styles.gridValue}>
              {config.nameserver1 || '-'}
              {config.nameserver2 && <span style={styles.gridSubValue}> / {config.nameserver2}</span>}
              {config.nameserver3 && <span style={styles.gridSubValue}> / {config.nameserver3}</span>}
            </div>
          </div>

          {/* IPv4 Gateway */}
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>
              <Wifi size={14} />
              IPv4 默认网关
            </div>
            <div style={styles.gridValue}>{config.ipv4gateway || '-'}</div>
          </div>

          {/* IPv6 Gateway */}
          <div style={styles.gridItem}>
            <div style={styles.gridLabel}>
              <Wifi size={14} />
              IPv6 默认网关
            </div>
            <div style={styles.gridValue}>{config.ipv6gateway || '-'}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Service Announcement */}
        <div style={styles.bottomSection}>
          <div style={styles.bottomLabel}>
            <Shield size={14} />
            服务公告
          </div>
          <div style={styles.tagList}>
            {services.length > 0 ? (
              services.map((service) => (
                <span key={service} style={styles.tag}>{service}</span>
              ))
            ) : (
              <span style={styles.noData}>已禁用</span>
            )}
          </div>
        </div>

        {/* Outbound Network */}
        <div style={styles.bottomSection}>
          <div style={styles.bottomLabel}>
            出站网络
          </div>
          <span style={{
            ...styles.outboundBadge,
            backgroundColor: outbound.type === 'allow' ? colors.success + '20' :
                            outbound.type === 'deny' ? colors.danger + '20' :
                            colors.warning + '20',
            color: outbound.type === 'allow' ? colors.success :
                   outbound.type === 'deny' ? colors.danger :
                   colors.warning,
          }}>
            {outbound.label}
          </span>
        </div>
      </div>
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
  editButton: {
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
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  } as React.CSSProperties,
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    color: colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  sectionContent: {
    flex: 1,
  } as React.CSSProperties,
  mainValue: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.text,
    fontFamily: 'monospace',
  } as React.CSSProperties,
  subValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  } as React.CSSProperties,
  divider: {
    height: 1,
    backgroundColor: colors.border,
    margin: '16px 0',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20,
  } as React.CSSProperties,
  gridItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  } as React.CSSProperties,
  gridLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 500,
  } as React.CSSProperties,
  gridValue: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'monospace',
    fontWeight: 500,
  } as React.CSSProperties,
  gridSubValue: {
    fontSize: 13,
    color: colors.textSecondary,
  } as React.CSSProperties,
  bottomSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  } as React.CSSProperties,
  bottomLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 500,
    minWidth: 100,
  } as React.CSSProperties,
  tagList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
  } as React.CSSProperties,
  tag: {
    padding: '4px 10px',
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  } as React.CSSProperties,
  outboundBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  } as React.CSSProperties,
  noData: {
    color: colors.textSecondary,
    fontSize: 13,
  } as React.CSSProperties,
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    color: colors.textSecondary,
  } as React.CSSProperties,
}