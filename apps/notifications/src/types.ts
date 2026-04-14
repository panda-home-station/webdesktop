import { AlertLevel } from '@truenas/types/alert.enum'

export type SeverityFilter = 'all' | 'critical' | 'warning' | 'info' | 'dismissed'

export const severityLabels: Record<SeverityFilter, string> = {
  all: '全部',
  critical: '紧急',
  warning: '警告',
  info: '信息',
  dismissed: '已忽略',
}

export function isCritical(level: AlertLevel): boolean {
  return [
    AlertLevel.Critical,
    AlertLevel.Alert,
    AlertLevel.Emergency,
    AlertLevel.Error,
  ].includes(level)
}

export function isWarning(level: AlertLevel): boolean {
  return level === AlertLevel.Warning
}

export function isInfo(level: AlertLevel): boolean {
  return [AlertLevel.Info, AlertLevel.Notice].includes(level)
}
