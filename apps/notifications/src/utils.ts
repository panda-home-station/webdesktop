import { AlertLevel, alertLevelLabels } from '@truenas/types/alert.enum'

export type ApiTimestamp = { $date: number }

export function getAlertLevelColor(level: AlertLevel): string {
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

export function formatDate(timestamp: ApiTimestamp): string {
  const date = new Date(timestamp.$date)
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getLevelLabel(level: AlertLevel): string {
  return alertLevelLabels.get(level) || level
}
