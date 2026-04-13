/**
 * Pool Status Utility Functions
 * Ported from webui/src/app/enums/pool-status.enum.ts
 */

/**
 * Pool status labels
 */
export const poolStatusLabels: Record<string, string> = {
  'HEALTHY': '健康',
  'ONLINE': '在线',
  'DEGRADED': '降级',
  'FAULTED': '故障',
  'OFFLINE': '离线',
  'UNAVAILABLE': '不可用',
  'REMOVED': '已移除',
  'NONE': '无',
}

/**
 * Get pool status display label
 */
export function getPoolStatusLabel(status: string): string {
  return poolStatusLabels[status] || status
}

/**
 * Get pool status color
 */
export function getPoolStatusColor(status: string): string {
  switch (status) {
    case 'HEALTHY':
    case 'ONLINE':
      return '#4caf50' // green
    case 'DEGRADED':
      return '#ff9800' // orange
    case 'FAULTED':
    case 'UNAVAILABLE':
    case 'OFFLINE':
      return '#f44336' // red
    default:
      return '#9e9e9e' // gray
  }
}