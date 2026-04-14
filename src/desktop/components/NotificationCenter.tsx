import { useMemo, memo, useState } from 'react'
import {
  Clock, AlertTriangle, X, Bell, Trash2,
  HardDrive, RefreshCw, Folder, Monitor, Download, Settings, Wifi, Cpu, Database,
  Globe, Shield, Cloud
} from 'lucide-react'
import useAlertStore from '@truenas/stores/alert'
import { useJobStore } from '@truenas/stores/job'
import { Drawer } from './Drawer'
import { Alert } from '@truenas/types/alert.interface'
import { AlertLevel } from '@truenas/types/alert.enum'
import { Job } from '@truenas/types/job-types'
import { openApp } from '@shared/sdk/desktop'

// ==================== Types ====================

type NotificationItem = {
  id: string
  type: 'alert' | 'job'
  data: Alert | Job
  timestamp: number
}

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

// ==================== Unified Notification Bubble ====================

// App source icon mapping
const getAppIcon = (item: NotificationItem) => {
  if (item.type === 'alert') {
    const alert = item.data as Alert
    const source = (alert.source || alert.klass || '').toLowerCase()

    // Storage related
    if (source.includes('pool') || source.includes('disk') || source.includes('volume') || source.includes('storage')) {
      return { icon: HardDrive, category: 'storage' }
    }
    // Network related
    if (source.includes('network') || source.includes('interface') || source.includes('ethernet') || source.includes('wifi') || source.includes('bridge')) {
      return { icon: Wifi, category: 'network' }
    }
    // System/CPU related
    if (source.includes('cpu') || source.includes('memory') || source.includes('system') || source.includes('hardware')) {
      return { icon: Cpu, category: 'system' }
    }
    // Update related
    if (source.includes('update') || source.includes('upgrade') || source.includes('download')) {
      return { icon: Download, category: 'update' }
    }
    // Security related
    if (source.includes('security') || source.includes('ssl') || source.includes('certificate') || source.includes('ssh')) {
      return { icon: Shield, category: 'security' }
    }
    // Service related
    if (source.includes('service') || source.includes('smb') || source.includes('nfs') || source.includes('iscsi') || source.includes('ftp')) {
      return { icon: Globe, category: 'service' }
    }
    // Database related
    if (source.includes('database') || source.includes('postgres') || source.includes('sql')) {
      return { icon: Database, category: 'database' }
    }
    // Cloud/Sync related
    if (source.includes('cloud') || source.includes('sync') || source.includes('snapshot')) {
      return { icon: Cloud, category: 'cloud' }
    }
    // Default alert icon
    return { icon: AlertTriangle, category: 'alert' }
  } else {
    const job = item.data as Job
    const method = (job.method || '').toLowerCase()

    // Storage related
    if (method.includes('pool') || method.includes('disk') || method.includes('volume') || method.includes('scrub') || method.includes('resilver')) {
      return { icon: HardDrive, category: 'storage' }
    }
    // Network related
    if (method.includes('network') || method.includes('interface') || method.includes('vlan') || method.includes('bridge')) {
      return { icon: Wifi, category: 'network' }
    }
    // VM related
    if (method.includes('vm') || method.includes('virtual') || method.includes('kvm') || method.includes('docker') || method.includes('container')) {
      return { icon: Monitor, category: 'vm' }
    }
    // Update related
    if (method.includes('update') || method.includes('upgrade') || method.includes('download') || method.includes('reboot')) {
      return { icon: Download, category: 'update' }
    }
    // Replication related
    if (method.includes('replication') || method.includes('replica') || method.includes('rsync')) {
      return { icon: RefreshCw, category: 'replication' }
    }
    // Service related
    if (method.includes('service') || method.includes('smb') || method.includes('nfs') || method.includes('iscsi')) {
      return { icon: Globe, category: 'service' }
    }
    // Folder/Directory related
    if (method.includes('directory') || method.includes('permission') || method.includes('smb')) {
      return { icon: Folder, category: 'directory' }
    }
    // Default job icon
    return { icon: Settings, category: 'job' }
  }
}

// Get icon color based on severity/state
const getIconColor = (item: NotificationItem) => {
  if (item.type === 'alert') {
    const alert = item.data as Alert
    switch (alert.level) {
      case AlertLevel.Emergency:
      case AlertLevel.Alert:
      case AlertLevel.Critical:
      case AlertLevel.Error:
        return { color: '#FF3B30', shadow: 'rgba(255,59,48,0.12)' }
      case AlertLevel.Warning:
        return { color: '#FF9500', shadow: 'rgba(255,149,0,0.12)' }
      case AlertLevel.Notice:
      case AlertLevel.Info:
      default:
        return { color: '#007AFF', shadow: 'rgba(0,122,255,0.12)' }
    }
  } else {
    const job = item.data as Job
    switch (job.state) {
      case 'RUNNING':
        return { color: '#007AFF', shadow: 'rgba(0,122,255,0.12)' }
      case 'SUCCESS':
        return { color: '#34C759', shadow: 'rgba(52,199,89,0.12)' }
      case 'FAILED':
        return { color: '#FF3B30', shadow: 'rgba(255,59,48,0.12)' }
      default:
        return { color: '#8E8E93', shadow: 'rgba(142,142,147,0.12)' }
    }
  }
}

const NotificationBubble = memo(({ item, onDismiss, onClick }: {
  item: NotificationItem
  onDismiss: (id: string) => void
  onClick: (item: NotificationItem) => void
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const timestamp = item.type === 'alert'
    ? formatTimestamp(getAlertTimestamp(item.data as Alert))
    : formatTimestamp(getJobTimestamp(item.data as Job))

  const description = item.type === 'alert'
    ? ((item.data as Alert).formatted || (item.data as Alert).text || '系统通知')
    : getJobDescription(item.data as Job)

  const progress = item.type === 'job' ? getJobProgress(item.data as Job) : 0
  const isRunning = item.type === 'job' && (item.data as Job).state === 'RUNNING'

  const appIcon = getAppIcon(item)
  const iconConfig = getIconColor(item)

  // Gradient based on severity/state
  const getGradient = () => {
    if (item.type === 'alert') {
      const alert = item.data as Alert
      switch (alert.level) {
        case AlertLevel.Emergency:
        case AlertLevel.Alert:
        case AlertLevel.Critical:
        case AlertLevel.Error:
          return 'linear-gradient(135deg, #FFEEEE 0%, #FFE4E4 100%)'
        case AlertLevel.Warning:
          return 'linear-gradient(135deg, #FFF8E6 0%, #FFF3D6 100%)'
        default:
          return 'linear-gradient(135deg, #F0F7FF 0%, #E8F2FF 100%)'
      }
    } else {
      const job = item.data as Job
      switch (job.state) {
        case 'RUNNING':
          return 'linear-gradient(135deg, #F0F7FF 0%, #E8F2FF 100%)'
        case 'SUCCESS':
          return 'linear-gradient(135deg, #E8F9ED 0%, #DFF6E8 100%)'
        case 'FAILED':
          return 'linear-gradient(135deg, #FFEEEE 0%, #FFE4E4 100%)'
        default:
          return 'linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)'
      }
    }
  }

  const getBorder = () => {
    if (item.type === 'alert') {
      const alert = item.data as Alert
      switch (alert.level) {
        case AlertLevel.Emergency:
        case AlertLevel.Alert:
        case AlertLevel.Critical:
        case AlertLevel.Error:
          return 'rgba(255,59,48,0.15)'
        case AlertLevel.Warning:
          return 'rgba(255,149,0,0.15)'
        default:
          return 'rgba(0,122,255,0.15)'
      }
    } else {
      const job = item.data as Job
      switch (job.state) {
        case 'RUNNING':
          return 'rgba(0,122,255,0.15)'
        case 'SUCCESS':
          return 'rgba(52,199,89,0.15)'
        case 'FAILED':
          return 'rgba(255,59,48,0.15)'
        default:
          return 'rgba(142,142,147,0.15)'
      }
    }
  }

  const isAlertDismissed = item.type === 'alert' && (item.data as Alert).dismissed

  const IconComponent = appIcon.icon
  const isSpinning = isRunning

  return (
    <div
      onClick={() => onClick(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: getGradient(),
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        cursor: 'pointer',
        border: `1px solid ${getBorder()}`,
        outline: 'none',
        transform: isHovered ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: isHovered
          ? `0 8px 24px ${iconConfig.shadow}, 0 2px 8px rgba(0,0,0,0.04)`
          : `0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)`,
        transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
      {/* Icon Container */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)`,
        border: '1px solid rgba(255,255,255,0.6)',
      }}>
        <IconComponent
          size={20}
          color={iconConfig.color}
          style={isSpinning ? { animation: 'spin 1s linear infinite' } : undefined}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 1.4,
          marginBottom: isRunning ? 10 : 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
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
              background: iconConfig.color,
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
          {isAlertDismissed && (
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
          {isRunning && (item.data as Job).progress?.details && (
            <span style={{
              background: 'rgba(0,122,255,0.1)',
              color: '#007AFF',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: '500',
            }}>
              {(item.data as Job).progress?.details}
            </span>
          )}
        </div>
      </div>

      {/* Dismiss Button for Alerts */}
      {item.type === 'alert' && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDismiss(item.id)
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: isHovered ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,59,48,0.12)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <X size={16} color={colors.textSecondary} />
          </button>
        </div>
      )}
    </div>
  )
})
NotificationBubble.displayName = 'NotificationBubble'

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
  
  const alerts = useAlertStore(state => state.alerts)
  const jobs = useJobStore(state => state.jobs)
  const dismissAlert = useAlertStore(state => state.dismissAlert)

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

  const totalCount = notifications.length

  const handleDismissAlert = (alertId: string) => {
    dismissAlert(alertId)
  }

  const handleItemClick = (_item: NotificationItem) => {
    openApp('notifications')
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
    >
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: colors.background,
      }}>
        {notifications.length === 0 ? (
          <EmptyState
            message="暂无通知"
            subMessage="所有提醒都将显示在这里"
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
              {notifications.map((item) => (
                <NotificationBubble
                  key={item.id}
                  item={item}
                  onDismiss={handleDismissAlert}
                  onClick={handleItemClick}
                />
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
