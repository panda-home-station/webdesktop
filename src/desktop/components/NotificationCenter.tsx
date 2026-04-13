import { useState, useMemo, memo } from 'react'
import { Bell, Repeat, CheckCircle2, XCircle, Clock, AlertTriangle, X, Trash2, Loader2 } from 'lucide-react'
import useAlertStore from '@truenas/stores/alert'
import { useJobStore } from '@truenas/stores/job'
import { Drawer } from './Drawer'
import { Alert } from '@truenas/types/alert.interface'
import { AlertLevel } from '@truenas/types/alert.enum'
import { Job, JobState } from '@truenas/types/job-types'
import { openApp } from '@shared/sdk/desktop'

// ==================== Types ====================

type NotificationItem = {
  id: string
  type: 'alert' | 'job'
  data: Alert | Job
  timestamp: number
}

type Tab = 'all' | 'tasks' | 'alerts'

// ==================== Utility Functions ====================

function formatTimestamp(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function getAlertTimestamp(alert: Alert): number {
  return alert.datetime.$date || alert.last_occurrence.$date || 0
}

function getJobTimestamp(job: Job): number {
  return new Date(job.time_started).getTime()
}

function getJobProgress(job: Job): number {
  return job.progress?.percent || 0
}

function getJobDescription(job: Job): string {
  if (job.progress?.description) {
    return job.progress.description
  }
  const method = job.method || ''
  return method.split('.').pop()?.replace(/_/g, ' ') || '任务'
}

// ==================== Color Palette ====================

const colors = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#8E8E93',
  background: '#F2F2F7',
  cardBackground: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  separator: '#E5E5EA',
}

// ==================== Alert Bubble ====================

const AlertBubble = memo(({ alert, onDismiss, onClick }: {
  alert: Alert
  onDismiss: (id: string) => void
  onClick: (alert: Alert) => void
}) => {
  const timestamp = formatTimestamp(getAlertTimestamp(alert))

  // Color based on severity
  const getSeverityColor = (level: AlertLevel) => {
    switch (level) {
      case AlertLevel.Emergency:
      case AlertLevel.Alert:
      case AlertLevel.Critical:
      case AlertLevel.Error:
        return { bg: '#FFEEEE', icon: '#FF3B30', dot: '#FF3B30' }
      case AlertLevel.Warning:
        return { bg: '#FFF8E6', icon: '#FF9500', dot: '#FF9500' }
      case AlertLevel.Notice:
      case AlertLevel.Info:
      default:
        return { bg: '#F0F7FF', icon: '#007AFF', dot: '#007AFF' }
    }
  }

  const severity = getSeverityColor(alert.level)

  return (
    <div
      onClick={() => onClick(alert)}
      style={{
        background: severity.bg,
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
      }}>
      {/* Icon Container */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <AlertTriangle size={20} color={severity.icon} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 1.4,
          marginBottom: 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {alert.formatted || alert.text || '系统通知'}
        </div>
        <div style={{
          fontSize: 13,
          color: colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Clock size={12} />
          <span>{timestamp}</span>
          {alert.dismissed && (
            <span style={{
              background: 'rgba(0,0,0,0.06)',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: '500',
            }}>
              已忽略
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(alert.id)
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'rgba(0,0,0,0.04)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,59,48,0.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
          }}
        >
          <X size={16} color={colors.textSecondary} />
        </button>
      </div>
    </div>
  )
})
AlertBubble.displayName = 'AlertBubble'

// ==================== Job Bubble ====================

const JobBubble = memo(({ job, onClick }: {
  job: Job
  onClick: (job: Job) => void
}) => {
  const timestamp = formatTimestamp(getJobTimestamp(job))
  const progress = getJobProgress(job)
  const description = getJobDescription(job)

  const getStateConfig = (state: JobState) => {
    switch (state) {
      case 'RUNNING':
        return { bg: '#F0F7FF', icon: '#007AFF' }
      case 'WAITING':
        return { bg: '#F5F5F5', icon: '#8E8E93' }
      case 'SUCCESS':
        return { bg: '#E8F9ED', icon: '#34C759' }
      case 'FAILED':
        return { bg: '#FFEEEE', icon: '#FF3B30' }
      case 'ABORTED':
        return { bg: '#F5F5F5', icon: '#8E8E93' }
      default:
        return { bg: '#F5F5F5', icon: '#8E8E93' }
    }
  }

  const stateConfig = getStateConfig(job.state)
  const isRunning = job.state === 'RUNNING'

  return (
    <div
      onClick={() => onClick(job)}
      style={{
        background: stateConfig.bg,
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        border: 'none',
        outline: 'none',
      }}>
      {/* Icon Container */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {isRunning ? (
          <Loader2 size={20} color={stateConfig.icon} style={{ animation: 'spin 1s linear infinite' }} />
        ) : job.state === 'SUCCESS' ? (
          <CheckCircle2 size={20} color={stateConfig.icon} />
        ) : job.state === 'FAILED' ? (
          <XCircle size={20} color={stateConfig.icon} />
        ) : (
          <Repeat size={20} color={stateConfig.icon} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 1.4,
          marginBottom: isRunning ? 10 : 4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {description}
        </div>

        {/* Progress Bar for Running Jobs */}
        {isRunning && (
          <div style={{
            marginBottom: 8,
            height: 4,
            background: 'rgba(0,0,0,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: stateConfig.icon,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}

        <div style={{
          fontSize: 13,
          color: colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Clock size={12} />
          <span>{timestamp}</span>
          {isRunning && job.progress?.details && (
            <span style={{
              background: 'rgba(0,122,255,0.1)',
              color: '#007AFF',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: '500',
            }}>
              {job.progress.details}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
JobBubble.displayName = 'JobBubble'

// ==================== Tab Button ====================

const TabButton = memo(({ active, label, count, onClick }: {
  active: boolean
  label: string
  count?: number
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      border: 'none',
      background: active ? colors.primary : 'transparent',
      color: active ? '#fff' : colors.textSecondary,
      borderRadius: 20,
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span style={{
        background: active ? 'rgba(255,255,255,0.3)' : 'rgba(0,122,255,0.1)',
        color: active ? '#fff' : colors.primary,
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: '600',
      }}>
        {count}
      </span>
    )}
  </button>
))
TabButton.displayName = 'TabButton'

// ==================== Empty State ====================

const EmptyState = memo(({ message, subMessage }: {
  message: string
  subMessage: string
}) => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  }}>
    <div style={{
      width: 80,
      height: 80,
      borderRadius: 24,
      background: `linear-gradient(135deg, ${colors.background} 0%, #fff 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    }}>
      <Bell size={32} color={colors.textTertiary} />
    </div>
    <div style={{
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    }}>
      {message}
    </div>
    <div style={{
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    }}>
      {subMessage}
    </div>
  </div>
))
EmptyState.displayName = 'EmptyState'

// ==================== Main Component ====================

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
  anchorEl?: { x: number; y: number } | null
}

export function NotificationCenter({ open, onClose, anchorEl }: NotificationCenterProps) {
  const [tab, setTab] = useState<Tab>('all')

  const alerts = useAlertStore(state => state.alerts)
  const jobs = useJobStore(state => state.jobs)
  const dismissAlert = useAlertStore(state => state.dismissAlert)
  const unreadAlertCount = useAlertStore(state => state.getImportantUnreadAlertsCount())
  const jobCounts = useJobStore(state => state.counts)

  // Combine and sort notifications
  const notifications = useMemo<NotificationItem[]>(() => {
    const alertItems: NotificationItem[] = alerts
      .filter(a => !a.dismissed)
      .map(a => ({
        id: `alert-${a.id}`,
        type: 'alert' as const,
        data: a,
        timestamp: getAlertTimestamp(a)
      }))

    const jobItems: NotificationItem[] = jobs
      .filter(j => j.state === 'RUNNING' || j.state === 'WAITING' || j.state === 'FAILED')
      .map(j => ({
        id: `job-${j.id}`,
        type: 'job' as const,
        data: j,
        timestamp: getJobTimestamp(j)
      }))

    const combined = [...alertItems, ...jobItems]
    combined.sort((a, b) => b.timestamp - a.timestamp)

    return combined.slice(0, 50)
  }, [alerts, jobs])

  const filteredNotifications = useMemo(() => {
    if (tab === 'tasks') {
      return notifications.filter(n => n.type === 'job')
    }
    if (tab === 'alerts') {
      return notifications.filter(n => n.type === 'alert')
    }
    return notifications
  }, [notifications, tab])

  const totalCount = unreadAlertCount + jobCounts.running + jobCounts.failed
  const runningJobCount = jobCounts.running + jobCounts.failed

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId)
  }

  const handleAlertClick = (_alert: Alert) => {
    openApp('notifications')
    onClose()
  }

  const handleJobClick = (_job: Job) => {
    openApp('storage')
    onClose()
  }

  const handleClearAll = () => {
    const alertIds = notifications.filter(n => n.type === 'alert').map(n => (n.data as Alert).id)
    useAlertStore.getState().dismissAllAlerts(alertIds)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      width={400}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>通知中心</span>
          {totalCount > 0 && (
            <span style={{
              background: colors.primary,
              color: '#fff',
              padding: '3px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: '600',
            }}>
              {totalCount}
            </span>
          )}
        </div>
      }
      headerExtra={
        <div style={{
          display: 'flex',
          gap: 4,
          background: colors.background,
          padding: 4,
          borderRadius: 12,
        }}>
          <TabButton
            active={tab === 'all'}
            label="全部"
            count={totalCount}
            onClick={() => setTab('all')}
          />
          <TabButton
            active={tab === 'tasks'}
            label="任务"
            count={runningJobCount || undefined}
            onClick={() => setTab('tasks')}
          />
          <TabButton
            active={tab === 'alerts'}
            label="提醒"
            count={unreadAlertCount || undefined}
            onClick={() => setTab('alerts')}
          />
        </div>
      }
    >
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: colors.background,
      }}>
        {filteredNotifications.length === 0 ? (
          <EmptyState
            message={tab === 'tasks' ? '暂无任务' : '暂无通知'}
            subMessage={tab === 'tasks' ? '所有任务都将显示在这里' : '所有提醒都将显示在这里'}
          />
        ) : (
          <>
            {/* Notification List */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              {filteredNotifications.map((item) => (
                item.type === 'alert' ? (
                  <AlertBubble
                    key={item.id}
                    alert={item.data as Alert}
                    onDismiss={handleDismissAlert}
                    onClick={handleAlertClick}
                  />
                ) : (
                  <JobBubble
                    key={item.id}
                    job={item.data as Job}
                    onClick={handleJobClick}
                  />
                )
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 16px',
              background: '#fff',
              borderTop: `1px solid ${colors.separator}`,
              display: 'flex',
              justifyContent: 'center',
            }}>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  background: colors.background,
                  color: colors.error,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,59,48,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = colors.background
                }}
              >
                <Trash2 size={16} />
                清除所有提醒
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Drawer>
  )
}
