import { Job } from '@truenas/types/job-types'

export type Tab = 'all' | 'running' | 'failed'
export type JobState = 'WAITING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ABORTED'

export interface ExtendedJob extends Job {
  abortable?: boolean
  transient?: boolean
  description?: string | null
  exc_info?: unknown
  exception?: string
  logs_path?: string
  credentials?: string | null
  result?: unknown
  removed?: boolean
  message_ids?: string[]
}

export const tabLabels: Record<Tab, string> = {
  all: '全部',
  running: '进行中',
  failed: '失败',
}

export const JobStateEnum = {
  WAITING: 'WAITING' as JobState,
  RUNNING: 'RUNNING' as JobState,
  SUCCESS: 'SUCCESS' as JobState,
  FAILED: 'FAILED' as JobState,
  ABORTED: 'ABORTED' as JobState,
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
