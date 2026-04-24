/**
 * Interfaces Card Component
 * Display all network interfaces in a full-width card list layout
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { networkService } from '@truenas/services/network'
import type { NetworkInterface } from '@truenas/types/network-types'
import type { NetworkInterfaceUpdate } from '@truenas/types/system-types'
import { InterfaceCard } from './InterfaceCard'
import { ConfirmDialog } from '@desktop/components/ConfirmDialog'
import { colors } from '../../styles/theme'

interface InterfacesCardProps {
  onRefresh: () => void
}

export function InterfacesCard({ onRefresh }: InterfacesCardProps) {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([])
  const [loading, setLoading] = useState(true)
  const [isHaEnabled, setIsHaEnabled] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NetworkInterface | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [interfaceStats, setInterfaceStats] = useState<Record<string, NetworkInterfaceUpdate>>({})
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadInterfaces = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [ifaces, ha] = await Promise.all([
        networkService.queryInterfaces(),
        networkService.isHaEnabled(),
      ])
      setInterfaces(ifaces)
      setIsHaEnabled(ha)
    } catch (error) {
      console.error('Failed to load interfaces:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }, [])

  useEffect(() => {
    loadInterfaces()
  }, [loadInterfaces])

  // Subscribe to realtime stats for network interfaces
  useEffect(() => {
    const subscribeToRealtime = () => {
      unsubscribeRef.current = networkService.subscribeRealtime((data: unknown) => {
        const realtimeData = data as { interfaces?: Record<string, NetworkInterfaceUpdate> }
        if (realtimeData.interfaces) {
          setInterfaceStats(realtimeData.interfaces)
        }
      })
    }

    subscribeToRealtime()

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setShowDeleteDialog(false)
    try {
      await networkService.deleteInterface(deleteTarget.id)
      onRefresh()
    } catch (error) {
      console.error('Failed to delete interface:', error)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.sectionTitle}>网络接口</h3>
        </div>
        <div style={styles.loadingState}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.sectionTitle}>网络接口</h3>
        <div style={styles.headerActions}>
          <button onClick={loadInterfaces} style={styles.iconButton} disabled={isRefreshing}>
            <RefreshCw size={16} style={isRefreshing ? { animation: 'spin 0.8s ease-in-out' } : undefined} />
          </button>
          <button style={styles.addButton}>
            <Plus size={16} />
            添加接口
          </button>
        </div>
      </div>

      {/* Interface List */}
      {interfaces.length > 0 ? (
        <div style={styles.list}>
          {interfaces.map((iface) => (
            <InterfaceCard
              key={iface.id}
              interface_={iface}
              stats={interfaceStats[iface.name]}
              isHaEnabled={isHaEnabled}
              onEdit={(_i) => { /* TODO: Open edit dialog */ }}
              onReset={(_i) => { /* TODO: Reset interface */ }}
              onDelete={(i) => {
                setDeleteTarget(i)
                setShowDeleteDialog(true)
              }}
            />
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🌐</div>
          <h4 style={styles.emptyTitle}>暂无网络接口</h4>
          <p style={styles.emptyText}>添加一个网络接口开始配置</p>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="删除接口"
        message={`确定要删除接口 "${deleteTarget?.name}" 吗？`}
        confirmText="删除"
        dangerous
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteDialog(false)
          setDeleteTarget(null)
        }}
      />

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
    padding: '8px 16px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
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
