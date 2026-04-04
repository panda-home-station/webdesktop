import React, { useEffect, useState, useMemo } from 'react'
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

const getAlertLevelBgColor = (level: AlertLevel): string => {
  switch (level) {
    case AlertLevel.Emergency:
    case AlertLevel.Critical:
    case AlertLevel.Alert:
    case AlertLevel.Error:
      return 'rgba(239, 68, 68, 0.1)'
    case AlertLevel.Warning:
      return 'rgba(245, 158, 11, 0.1)'
    case AlertLevel.Notice:
    case AlertLevel.Info:
    default:
      return 'rgba(59, 130, 246, 0.1)'
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
  const levelColor = getAlertLevelColor(alert.level)
  const levelBgColor = getAlertLevelBgColor(alert.level)
  const levelLabel = alertLevelLabels.get(alert.level) || alert.level

  const formatDate = (timestamp: { $date: number }): string => {
    const date = new Date(timestamp.$date)
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '12px',
        background: levelBgColor,
        border: `1px solid ${levelColor}30`,
        marginBottom: '12px',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            marginTop: '4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: levelColor,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: levelColor,
                padding: '2px 8px',
                borderRadius: '4px',
                background: `${levelColor}20`,
                textTransform: 'uppercase',
              }}
            >
              {levelLabel}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginLeft: 'auto',
              }}
            >
              {formatDate(alert.datetime)}
            </span>
          </div>
          <div
            style={{
              fontSize: '14px',
              color: '#1e293b',
              lineHeight: 1.5,
              marginBottom: '8px',
            }}
          >
            {alert.formatted || alert.text}
          </div>
          {alert.klass && (
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              {alert.klass}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
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
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            onClick={() => onRestore(alert.id)}
          >
            <RefreshCw size={14} />
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
              fontSize: '13px',
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
            onClick={() => onDismiss(alert.id)}
          >
            <X size={14} />
            忽略
          </button>
        )}
      </div>
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

  // Alerts are initialized in App.tsx via useAlertInit hook
  // This component only fetches alerts when needed

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
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#1e293b' }}>
            通知中心
          </h2>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onClick={fetchAlerts}
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>

        {/* Severity Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(alertCounts).map(([filter, count]) => (
            <button
              key={filter}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
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
                fontSize: '12px',
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
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 6px',
                    borderRadius: '9px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '11px',
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

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
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
            <RefreshCw size={32} style={{ marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
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
            <p style={{ fontSize: '14px', color: '#64748b' }}>{error}</p>
            <button
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                borderRadius: '8px',
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
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

            {/* Action Buttons */}
            {filteredAlerts.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
                {showDismissed ? (
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      fontSize: '14px',
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
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
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
