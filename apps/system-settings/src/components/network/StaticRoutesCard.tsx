/**
 * Static Routes Card Component
 * Display static routes as a modern card list
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Route, Plus, RefreshCw, Edit, Trash2 } from 'lucide-react'
import { networkService } from '@truenas/services/network'
import type { StaticRoute } from '@truenas/types/network-types'
import { ConfirmDialog } from '@desktop/components/ConfirmDialog'
import { colors } from '../../styles/theme'

interface StaticRoutesCardProps {
  onRefresh: () => void
}

export function StaticRoutesCard({ onRefresh }: StaticRoutesCardProps) {
  const [routes, setRoutes] = useState<StaticRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<StaticRoute | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const loadRoutes = useCallback(async () => {
    try {
      const data = await networkService.queryStaticRoutes()
      setRoutes(data)
    } catch (error) {
      console.error('Failed to load static routes:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoutes()
  }, [loadRoutes])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setShowDeleteDialog(false)
    try {
      await networkService.deleteStaticRoute(deleteTarget.id)
      onRefresh()
    } catch (error) {
      console.error('Failed to delete static route:', error)
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.sectionTitle}>静态路由</h3>
        <div style={styles.headerActions}>
          <button onClick={loadRoutes} style={styles.iconButton}>
            <RefreshCw size={16} />
          </button>
          <button style={styles.addButton}>
            <Plus size={16} />
            添加路由
          </button>
        </div>
      </div>

      {/* Routes List */}
      {loading ? (
        <div style={styles.loadingState}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>加载中...</span>
        </div>
      ) : routes.length > 0 ? (
        <div style={styles.card}>
          {/* Table Header */}
          <div style={styles.tableHeader}>
            <div style={{ ...styles.col, flex: 2 }}>目标地址</div>
            <div style={{ ...styles.col, flex: 1 }}>网关</div>
            <div style={{ ...styles.col, flex: 1 }}>描述</div>
            <div style={{ ...styles.col, width: 100 }}>操作</div>
          </div>

          {/* Route Rows */}
          {routes.map((route, index) => (
            <div
              key={route.id}
              style={{
                ...styles.tableRow,
                borderBottom: index < routes.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <div style={{ ...styles.cell, flex: 2 }}>
                <Route size={14} color={colors.primary} />
                <span style={styles.routeDest}>{route.destination}</span>
              </div>
              <div style={{ ...styles.cell, flex: 1, fontFamily: 'monospace' }}>
                {route.gateway}
              </div>
              <div style={{ ...styles.cell, flex: 1, color: colors.textSecondary }}>
                {route.description || '-'}
              </div>
              <div style={{ ...styles.cell, width: 100 }}>
                <div style={styles.actionButtons}>
                  <button style={styles.actionBtn} title="编辑">
                    <Edit size={14} />
                  </button>
                  <button
                    style={{ ...styles.actionBtn, color: colors.danger }}
                    title="删除"
                    onClick={() => {
                      setDeleteTarget(route)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🛤️</div>
          <h4 style={styles.emptyTitle}>暂无静态路由</h4>
          <p style={styles.emptyText}>添加静态路由以自定义网络路径</p>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="删除静态路由"
        message={`确定要删除静态路由 "${deleteTarget?.destination}" 吗？`}
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
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  } as React.CSSProperties,
  tableHeader: {
    display: 'flex',
    padding: '12px 20px',
    backgroundColor: colors.background,
    borderBottom: `1px solid ${colors.border}`,
  } as React.CSSProperties,
  col: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  tableRow: {
    display: 'flex',
    padding: '16px 20px',
    alignItems: 'center',
  } as React.CSSProperties,
  cell: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: colors.text,
  } as React.CSSProperties,
  routeDest: {
    fontFamily: 'monospace',
    fontWeight: 500,
  } as React.CSSProperties,
  actionButtons: {
    display: 'flex',
    gap: 8,
  } as React.CSSProperties,
  actionBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    color: colors.textSecondary,
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