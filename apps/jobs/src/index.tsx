import React, { useState, useMemo, useCallback } from 'react'
import { useJobStore } from '@truenas/stores/job'
import { Job } from '@truenas/types/job-types'
import { truenasApi } from '@truenas/api'
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Pause,
  Copy,
  AlertTriangle,
  Activity,
  Timer,
  Terminal,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

// ==================== Types ====================

type Tab = 'all' | 'running' | 'failed'
type JobState = 'WAITING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ABORTED'

// Extended Job interface with additional fields from API
interface ExtendedJob extends Job {
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

const tabLabels: Record<Tab, string> = {
  all: '全部',
  running: '进行中',
  failed: '失败',
}

const JobStateEnum = {
  WAITING: 'WAITING' as JobState,
  RUNNING: 'RUNNING' as JobState,
  SUCCESS: 'SUCCESS' as JobState,
  FAILED: 'FAILED' as JobState,
  ABORTED: 'ABORTED' as JobState,
}

// ==================== Utility Functions ====================

function formatDate(timestamp: string | null | undefined): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!end) return '进行中'
  const startTime = new Date(start!).getTime()
  const endTime = new Date(end).getTime()
  if (isNaN(startTime) || isNaN(endTime)) return '进行中'
  const diff = Math.floor((endTime - startTime) / 1000)

  if (diff < 60) return `${diff}秒`
  if (diff < 3600) return `${Math.floor(diff / 60)}分${diff % 60}秒`
  return `${Math.floor(diff / 3600)}小时${Math.floor((diff % 3600) / 60)}分`
}

function getJobDescription(job: ExtendedJob): string {
  if (job.progress?.description) {
    return job.progress.description
  }
  const method = job.method || ''
  return method.split('.').pop()?.replace(/_/g, ' ') || '任务'
}

// ==================== State Badge ====================

const StateBadge = React.memo(({ state }: { state: JobState }) => {
  const config = {
    [JobStateEnum.RUNNING]: {
      bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: '#fff',
      label: '进行中',
      icon: Loader2,
      glow: 'rgba(59, 130, 246, 0.3)',
    },
    [JobStateEnum.WAITING]: {
      bg: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
      color: '#fff',
      label: '等待中',
      icon: Clock,
      glow: 'rgba(148, 163, 184, 0.3)',
    },
    [JobStateEnum.SUCCESS]: {
      bg: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      color: '#fff',
      label: '已完成',
      icon: CheckCircle2,
      glow: 'rgba(52, 211, 153, 0.3)',
    },
    [JobStateEnum.FAILED]: {
      bg: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
      color: '#fff',
      label: '失败',
      icon: XCircle,
      glow: 'rgba(248, 113, 113, 0.3)',
    },
    [JobStateEnum.ABORTED]: {
      bg: 'linear-gradient(135deg, #a1a1aa 0%, #71717a 100%)',
      color: '#fff',
      label: '已取消',
      icon: XCircle,
      glow: 'rgba(161, 161, 170, 0.3)',
    },
  }[state] || {
    bg: 'linear-gradient(135deg, #a1a1aa 0%, #71717a 100%)',
    color: '#fff',
    label: '未知',
    icon: AlertTriangle,
    glow: 'rgba(161, 161, 170, 0.3)',
  }

  const Icon = config.icon

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        borderRadius: 20,
        background: config.bg,
        color: config.color,
        fontSize: 11,
        fontWeight: 600,
        boxShadow: `0 2px 8px ${config.glow}`,
        transition: 'all 0.2s ease',
      }}
    >
      <Icon size={12} className={state === JobStateEnum.RUNNING ? 'spin' : ''} />
      {config.label}
    </div>
  )
})
StateBadge.displayName = 'StateBadge'

// ==================== Progress Bar ====================

const ProgressBar = React.memo(({ job }: { job: ExtendedJob }) => {
  if (job.state !== JobStateEnum.RUNNING && job.state !== JobStateEnum.WAITING) return null

  const percent = job.progress?.percent || 0

  return (
    <div
      style={{
        width: '100%',
        height: 6,
        background: 'rgba(59, 130, 246, 0.15)',
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 10,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
          borderRadius: 3,
          transition: 'width 0.4s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
    </div>
  )
})
ProgressBar.displayName = 'ProgressBar'

// ==================== Job Row ====================

const JobRow = React.memo(({ job, isExpanded, onToggle, onAbort, isEven }: {
  job: ExtendedJob
  isExpanded: boolean
  onToggle: () => void
  onAbort: (job: ExtendedJob) => void
  isEven: boolean
}) => {
  const description = getJobDescription(job)
  const canAbort = job.state === JobStateEnum.RUNNING && job.abortable

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Main Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 160px 160px 80px',
          alignItems: 'center',
          padding: '16px 20px',
          background: isExpanded ? '#e0e7ff' : isEven ? '#ffffff' : '#fafbfc',
          borderRadius: 12,
          cursor: 'pointer',
          border: isExpanded ? '1px solid #818cf8' : '1px solid rgba(0,0,0,0.06)',
          boxShadow: isExpanded ? '0 4px 16px rgba(99, 102, 241, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
        }}
        onClick={onToggle}
        onMouseEnter={e => {
          if (!isExpanded) {
            e.currentTarget.style.background = '#f8fafc'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
          }
        }}
        onMouseLeave={e => {
          if (!isExpanded) {
            e.currentTarget.style.background = isEven ? '#ffffff' : '#fafbfc'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
          }
        }}
      >
        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{ color: '#94a3b8', flexShrink: 0 }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1e293b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: 2,
              }}
            >
              {description}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {job.method}
            </div>
            {job.state === JobStateEnum.RUNNING && <ProgressBar job={job} />}
          </div>
        </div>

        {/* State */}
        <div>
          <StateBadge state={job.state} />
        </div>

        {/* Started */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          <Clock size={14} style={{ opacity: 0.6 }} />
          {formatDate(job.time_started)}
        </div>

        {/* Finished */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
          {job.time_finished ? (
            <>
              <Timer size={14} style={{ opacity: 0.6 }} />
              {formatDate(job.time_finished)}
            </>
          ) : (
            <span style={{ color: '#cbd5e1' }}>-</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {canAbort && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAbort(job)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                color: '#dc2626',
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
              }}
            >
              <Pause size={12} />
              停止
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details - Simple Card */}
      {isExpanded && (
        <div
          style={{
            marginTop: 8,
            padding: 20,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
              fontSize: 13,
            }}
          >
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                任务 ID
              </div>
              <div style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                #{job.id}
                <button
                  onClick={() => navigator.clipboard.writeText(String(job.id))}
                  style={{ padding: 4, border: 'none', background: '#f1f5f9', borderRadius: 4, cursor: 'pointer', color: '#64748b' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#3b82f6' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                耗时
              </div>
              <div style={{ color: '#1e293b', fontWeight: 500 }}>
                {formatDuration(job.time_started, job.time_finished || null)}
              </div>
            </div>
            {job.progress?.percent !== undefined && (
              <div>
                <div style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  进度
                </div>
                <div style={{ color: '#1e293b', fontWeight: 500 }}>{job.progress.percent.toFixed(1)}%</div>
              </div>
            )}
            {job.arguments && job.arguments.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Terminal size={12} /> 参数
                </div>
                <pre style={{ background: '#1e293b', padding: 14, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: '#e2e8f0', overflow: 'auto', margin: 0, maxHeight: 150 }}>
                  {JSON.stringify(job.arguments, null, 2)}
                </pre>
              </div>
            )}
            {job.error && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#ef4444', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} /> 错误信息
                </div>
                <pre style={{ background: '#fef2f2', padding: 14, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: '#dc2626', overflow: 'auto', margin: 0, border: '1px solid #fecaca' }}>
                  {job.error}
                </pre>
              </div>
            )}
            {job.logs_excerpt && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Activity size={12} /> 日志摘要
                </div>
                <pre style={{ background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: '#475569', overflow: 'auto', margin: 0, maxHeight: 150, border: '1px solid #e2e8f0' }}>
                  {job.logs_excerpt}
                </pre>
              </div>
            )}
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                日志路径
              </div>
              <div style={{ color: job.logs_path ? '#3b82f6' : '#cbd5e1', fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>
                {job.logs_path || '不可用'}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                用户凭据
              </div>
              <div style={{ color: '#1e293b', fontSize: 12 }}>
                {job.credentials ? <span style={{ color: '#10b981' }}>{job.credentials}</span> : <span style={{ color: '#cbd5e1' }}>系统任务</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
JobRow.displayName = 'JobRow'

// ==================== Main Component ====================

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Empty state illustration component
const EmptyState = ({ tab }: { tab: Tab }) => {
  const configs = {
    all: {
      emoji: '📋',
      title: '暂无任务',
      subtitle: '系统当前没有任务记录',
      color: '#94a3b8',
    },
    running: {
      emoji: '⚡',
      title: '没有进行中的任务',
      subtitle: '所有任务都已完成或失败',
      color: '#3b82f6',
    },
    failed: {
      emoji: '✅',
      title: '没有失败的任务',
      subtitle: '所有任务都运行正常',
      color: '#10b981',
    },
  }
  const config = configs[tab]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 40,
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 20,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
        }}
      >
        {config.emoji}
      </div>
      <p
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: config.color,
          margin: '0 0 8px',
        }}
      >
        {config.title}
      </p>
      <p
        style={{
          fontSize: 14,
          color: '#94a3b8',
          margin: 0,
        }}
      >
        {config.subtitle}
      </p>
    </div>
  )
}

// Loading state component
const LoadingState = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 16,
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '3px solid #e2e8f0',
        borderTopColor: '#3b82f6',
        animation: 'spin 1s linear infinite',
      }}
    />
    <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>正在加载任务...</p>
  </div>
)

export default function JobsApp() {
  const { jobs, loadJobs, isLoading } = useJobStore()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filteredJobs = useMemo(() => {
    let filtered = [...jobs]

    // Filter by tab
    switch (tab) {
      case 'running':
        filtered = filtered.filter(j => j.state === JobStateEnum.RUNNING || j.state === JobStateEnum.WAITING)
        break
      case 'failed':
        filtered = filtered.filter(j => j.state === JobStateEnum.FAILED || j.state === JobStateEnum.ABORTED)
        break
    }

    // Filter by search
    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(j => {
        const desc = getJobDescription(j).toLowerCase()
        const method = (j.method || '').toLowerCase()
        return desc.includes(query) || method.includes(query)
      })
    }

    // Sort by id descending (newest first)
    filtered.sort((a, b) => b.id - a.id)

    return filtered
  }, [jobs, tab, search])

  // Pagination
  const totalCount = filteredJobs.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, currentPage, pageSize])

  // Reset to page 1 when tab or search changes
  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const counts = useMemo(() => ({
    all: jobs.length,
    running: jobs.filter(j => j.state === JobStateEnum.RUNNING || j.state === JobStateEnum.WAITING).length,
    failed: jobs.filter(j => j.state === JobStateEnum.FAILED || j.state === JobStateEnum.ABORTED).length,
  }), [jobs])

  const handleAbort = useCallback(async (job: ExtendedJob) => {
    if (!confirm(`确定要停止任务 "${getJobDescription(job)}" 吗？`)) return
    try {
      await truenasApi.call('core.job_abort', [job.id])
    } catch (error) {
      console.error('Failed to abort job:', error)
    }
  }, [])

  const handleToggle = useCallback((jobId: number) => {
    setExpandedId(prev => prev === jobId ? null : jobId)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Title Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                color: '#1e293b',
                letterSpacing: '-0.01em',
              }}
            >
              任务管理
            </h2>
            <span
              style={{
                fontSize: 12,
                color: '#94a3b8',
                fontWeight: 500,
              }}
            >
              Job Management
            </span>
          </div>
          <button
            onClick={loadJobs}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              background: isLoading
                ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading
                ? 'none'
                : '0 4px 12px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
              }
            }}
            onMouseLeave={e => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)'
              }
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            刷新
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 12,
            width: 'fit-content',
          }}
        >
          {(['all', 'running', 'failed'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? '#3b82f6' : '#64748b',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {tabLabels[t]}
              {counts[t] > 0 && (
                <span
                  style={{
                    background:
                      tab === t
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    color: tab === t ? '#fff' : '#64748b',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: 20,
                    textAlign: 'center',
                  }}
                >
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              transition: 'color 0.15s ease',
            }}
          />
          <input
            type="text"
            placeholder="搜索任务名称或方法..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 44px',
              borderRadius: 12,
              border: '2px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.15s ease',
              background: '#fff',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
      </div>

      {/* Column Headers - Subtle */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 160px 160px 80px',
          padding: '8px 32px',
          fontSize: 10,
          fontWeight: 600,
          color: '#a0aec0',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        <div>任务名称</div>
        <div>状态</div>
        <div>开始时间</div>
        <div>结束时间</div>
        <div style={{ textAlign: 'right' }}>操作</div>
      </div>

      {/* Job List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px' }}>
        {isLoading && filteredJobs.length === 0 ? (
          <LoadingState />
        ) : filteredJobs.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          paginatedJobs.map((job, index) => (
            <JobRow
              key={job.id}
              job={job}
              isExpanded={expandedId === job.id}
              onToggle={() => handleToggle(job.id)}
              onAbort={handleAbort}
              isEven={index % 2 === 0}
            />
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>每页显示</span>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
                cursor: 'pointer',
                background: '#fff',
                fontWeight: 500,
                color: '#1e293b',
              }}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span style={{ fontWeight: 500 }}>条</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#1e293b' }}>
              {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>
            <span style={{ color: '#94a3b8' }}>-</span>
            <span style={{ color: '#1e293b' }}>
              {Math.min(currentPage * pageSize, totalCount)}
            </span>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ color: '#1e293b' }}>共 {totalCount} 条</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div
              style={{
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                minWidth: 70,
                textAlign: 'center',
              }}
            >
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.4 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = '#f1f5f9'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
