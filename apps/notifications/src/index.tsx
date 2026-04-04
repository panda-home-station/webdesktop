import React, { useState, useMemo } from 'react'
import useAlertStore from '../../../src/truenas/stores/alert.store'
import { Alert } from '../../../src/truenas/types/alert.interface'
import { AlertLevel, alertLevelLabels } from '../../../src/truenas/types/alert.enum'
import { truenasApi } from '../../../src/truenas/api'
import { X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info' | 'dismissed'

const severityLabels: Record<SeverityFilter, string> = {
  all: '全部',
  critical: '紧急',
  warning: '警告',
  info: '信息',
  dismissed: '已忽略',
}

const getAlertLevelColor = (level: AlertLevel): string => {
  switch (level) {
    case AlertLevel.Emergency:
    case AlertLevel.Critical:
    case AlertLevel.Alert:
    case AlertLevel.Error:
      return '#ef4444'
    case AlertLevel.Warning:
      return '#f59e0b'
    case AlertLevel.Notice:
    case AlertLevel.Info:
    default:
      return '#3b82f6'
  }
}

const isCritical = (level: AlertLevel): boolean => {
  return [
    AlertLevel.Critical,
    AlertLevel.Alert,
    AlertLevel.Emergency,
    AlertLevel.Error,
  ].includes(level)
}

const isWarning = (level: AlertLevel): boolean => {
  return level === AlertLevel.Warning
}

const isInfo = (level: AlertLevel): boolean => {
  return [AlertLevel.Info, AlertLevel.Notice].includes(level)
}

const AlertItem = React.memo(({ alert, onDismiss, onRestore }: {
  alert: Alert
  onDismiss: (id: string) => void
  onRestore: (id: string) => void
}) => {
  const [expanded, setExpanded] = useState(false)
  const levelColor = getAlertLevelColor(alert.level)
  const levelLabel = alertLevelLabels.get(alert.level) || alert.level

  const formatDate = (timestamp: { $date: number }): string => {
    const date = new Date(timestamp.$date)
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div
      style={{
        borderRadius: '8px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: levelColor,
            flexShrink: 0,
          }}
        />        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: levelColor,
            padding: '2px 6px',
            borderRadius: '4px',
            background: levelColor + '15',
            flexShrink: 0,
          }}
        >
          {levelLabel}
        </span>        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '13px',
            color: '#1e293b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {alert.formatted || alert.text}
        </div>
        <span
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            flexShrink: 0,
          }}
        >
          {formatDate(alert.datetime)}
        </span>
        {expanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </div>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            padding: '12px',
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.6,
              marginBottom: '10px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {alert.formatted || alert.text}
          </div>
          {alert.klass && (
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '10px',
              }}
            >
              <strong>类型:</strong> {alert.klass}
            </div>
          )}
          <div
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '10px',
            }}
          >
            <div><strong>ID:</strong> {alert.id}</div>
            <div><strong>来源:</strong> {alert.source}</div>
            {alert.node && <div><strong>节点:</strong> {alert.node}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {alert.dismissed ? (
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore(alert.id)
                }}
              >
                <RefreshCw size={12} />
                重新打开
              </button>
            ) : (
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.borderColor = '#94a3b8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onDismiss(alert.id)
                }}
              >
                <X size={12} />
                忽略
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default function NotificationsApp() {
  const {
    alerts,
    isLoading,
    isPanelOpen,
    error,
    dismissAlert,
    reopenAlert,
    dismissAllAlerts,
    reopenAllAlerts,
    fetchAlerts,
  } = useAlertStore()

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [showDismissed, setShowDismissed] = useState(false)

  const filteredAlerts = useMemo(() => {
    let filtered = alerts

    if (showDismissed) {
      filtered = filtered.filter(a => a.dismissed)
    } else {
      filtered = filtered.filter(a => !a.dismissed)

      switch (severityFilter) {
        case 'critical':
          filtered = filtered.filter(a => isCritical(a.level))
          break
        case 'warning':
          filtered = filtered.filter(a => isWarning(a.level))
          break
        case 'info':
          filtered = filtered.filter(a => isInfo(a.level))
          break
        default:
          break
      }
    }

    return filtered
  }, [alerts, severityFilter, showDismissed])

  const unreadAlerts = alerts.filter(a => !a.dismissed)
  const dismissedAlerts = alerts.filter(a => a.dismissed)

  const alertCounts = {
    all: unreadAlerts.length,
    critical: unreadAlerts.filter(a => isCritical(a.level)).length,
    warning: unreadAlerts.filter(a => isWarning(a.level)).length,
    info: unreadAlerts.filter(a => isInfo(a.level)).length,
    dismissed: dismissedAlerts.length,
  }

  const handleDismiss = async (id: string) => {
    try {
      await truenasApi.call('alert.dismiss', [id])
      dismissAlert(id)
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await truenasApi.call('alert.restore', [id])
      reopenAlert(id)
    } catch (error) {
      console.error('Failed to restore alert:', error)
    }
  }

  const handleDismissAll = async () => {
    const alertIds = showDismissed
      ? []
      : filteredAlerts.map(a => a.id)

    if (alertIds.length === 0) return

    try {
      await Promise.all(alertIds.map(id => truenasApi.call('alert.dismiss', [id])))
      dismissAllAlerts(alertIds)
    } catch (error) {
      console.error('Failed to dismiss alerts:', error)
    }
  }

  const handleRestoreAll = async () => {
    const alertIds = showDismissed
      ? filteredAlerts.map(a => a.id)
      : []

    if (alertIds.length === 0) return

    try {
      await Promise.all(alertIds.map(id => truenasApi.call('alert.restore', [id])))
      reopenAllAlerts(alertIds)
    } catch (error) {
      console.error('Failed to restore alerts:', error)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#1e293b' }}>
            通知中心
          </h2>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onClick={fetchAlerts}
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(alertCounts).map(([filter, count]) => (
            <button
              key={filter}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                background:
                  (showDismissed && filter === 'dismissed') ||
                  (!showDismissed && filter === severityFilter)
                    ? '#3b82f6'
                    : '#f1f5f9',
                color:
                  (showDismissed && filter === 'dismissed') ||
                  (!showDismissed && filter === severityFilter)
                    ? '#fff'
                    : '#475569',
                border: 'none',
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                const isInactive =
                  (showDismissed && filter !== 'dismissed') ||
                  (!showDismissed && filter !== severityFilter)
                if (isInactive) e.currentTarget.style.background = '#e2e8f0'
              }}
              onMouseLeave={(e) => {
                const isInactive =
                  (showDismissed && filter !== 'dismissed') ||
                  (!showDismissed && filter !== severityFilter)
                if (isInactive) e.currentTarget.style.background = '#f1f5f9'
              }}
              onClick={() => {
                if (filter === 'dismissed') {
                  setShowDismissed(true)
                } else {
                  setShowDismissed(false)
                  setSeverityFilter(filter as SeverityFilter)
                }
              }}
            >
              {severityLabels[filter as SeverityFilter]}
              {count > 0 && (
                <span
                  style={{
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 5px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255, 0.3)',
                    fontSize: '10px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px',
        }}
      >
        {isLoading && filteredAlerts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#64748b',
            }}
          >
            <RefreshCw size={28} style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
            <p>加载通知中...</p>
          </div>
        ) : error ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#ef4444',
            }}
          >
            <p>加载通知失败</p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>{error}</p>
            <button
              style={{
                marginTop: '12px',
                padding: '6px 14px',
                borderRadius: '6px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={fetchAlerts}
            >
              重试
            </button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#64748b',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
            <p>暂无通知</p>
          </div>
        ) : (
          <>
            {filteredAlerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onRestore={handleRestore}
              />
            ))}

            {filteredAlerts.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center' }}>
                {showDismissed ? (
                  <button
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    onClick={handleRestoreAll}
                  >
                    恢复全部
                  </button>
                ) : (
                  <button
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      color: '#4kt569',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e2e8f0'
                      e.currentTarget.style.borderColor = '#94a3b8'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f1f5f9'
                      e.currentTarget.style.borderColor = '#cbd5e1'
                    }}
                    onClick={handleDismissAll}
                  >
                    忽略全部
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
