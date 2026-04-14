import type { ExtendedJob } from './types'

// TrueNAS API timestamp format: { $date: number } (Unix timestamp in milliseconds)
export type ApiTimestamp = { $date: number }

export function extractTimestamp(value: string | number | ApiTimestamp | null | undefined): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime()
    return isNaN(parsed) ? null : parsed
  }
  if (typeof value === 'object' && '$date' in value) {
    return (value as ApiTimestamp).$date
  }
  return null
}

export function formatDate(timestamp: string | number | ApiTimestamp | null | undefined): string {
  const ms = extractTimestamp(timestamp)
  if (ms === null) return '-'
  const date = new Date(ms)
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export function formatDuration(
  start: string | number | ApiTimestamp | null | undefined,
  end: string | number | ApiTimestamp | null | undefined
): string {
  const startMs = extractTimestamp(start)
  const endMs = extractTimestamp(end)
  if (startMs === null || endMs === null) return '进行中'
  const diff = Math.floor((endMs - startMs) / 1000)

  if (diff < 60) return `${diff}秒`
  if (diff < 3600) return `${Math.floor(diff / 60)}分${diff % 60}秒`
  return `${Math.floor(diff / 3600)}小时${Math.floor((diff % 3600) / 60)}分`
}

export function getJobDescription(job: ExtendedJob): string {
  if (job.progress?.description) {
    return job.progress.description
  }
  const method = job.method || ''
  return method.split('.').pop()?.replace(/_/g, ' ') || '任务'
}
