import React, { useState, useMemo, useCallback } from 'react'
import { useJobStore } from '@truenas/stores/job'
import { Job } from '@truenas/types/job-types'
import { truenasApi } from '@truenas/api'
import { Search, RefreshCw, ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, Pause, Copy, AlertTriangle } from 'lucide-react'

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
    [JobStateEnum.RUNNING]: { bg: '#F0F7FF', color: '#007AFF', label: '进行中', icon: Loader2 },
    [JobStateEnum.WAITING]: { bg: '#F5F5F5', color: '#8E8E93', label: '等待中', icon: Clock },
    [JobStateEnum.SUCCESS]: { bg: '#E8F9ED', color: '#34C759', label: '已完成', icon: CheckCircle2 },
    [JobStateEnum.FAILED]: { bg: '#FFEEEE', color: '#FF3B30', label: '失败', icon: XCircle },
    [JobStateEnum.ABORTED]: { bg: '#F5F5F5', color: '#8E8E93', label: '已取消', icon: XCircle },
  }[state] || { bg: '#F5F5F5', color: '#8E8E93', label: '未知', icon: AlertTriangle }

  const Icon = config.icon

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 6,
      background: config.bg,
      color: config.color,
      fontSize: 12,
      fontWeight: 600,
    }}>
      <Icon size={14} className={state === JobStateEnum.RUNNING ? 'spin' : ''} />
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
    <div style={{
      width: '100%',
      height: 4,
      background: 'rgba(0,0,0,0.08)',
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 8,
    }}>
      <div style={{
        width: `${percent}%`,
        height: '100%',
        background: '#007AFF',
        borderRadius: 2,
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
})
ProgressBar.displayName = 'ProgressBar'

// ==================== Job Row ====================

const JobRow = React.memo(({ job, isExpanded, onToggle, onAbort }: {
  job: ExtendedJob
  isExpanded: boolean
  onToggle: () => void
  onAbort: (job: ExtendedJob) => void
}) => {
  const description = getJobDescription(job)
  const canAbort = job.state === JobStateEnum.RUNNING && job.abortable

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 160px 160px 80px',
          alignItems: 'center',
          padding: '12px 16px',
          background: isExpanded ? '#f8fafc' : '#fff',
          borderBottom: '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onClick={onToggle}
        onMouseEnter={e => !isExpanded && (e.currentTarget.style.background = '#f8fafc')}
        onMouseLeave={e => !isExpanded && (e.currentTarget.style.background = '#fff')}
      >
        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ color: '#64748b', flexShrink: 0 }}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#1e293b',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {description}
            </div>
            {job.state === JobStateEnum.RUNNING && (
              <ProgressBar job={job} />
            )}
          </div>
        </div>

        {/* State */}
        <div>
          <StateBadge state={job.state} />
        </div>

        {/* Started */}
        <div style={{ fontSize: 13, color: '#64748b' }}>
          {formatDate(job.time_started)}
        </div>

        {/* Finished */}
        <div style={{ fontSize: 13, color: '#64748b' }}>
          {job.time_finished ? formatDate(job.time_finished) : '-'}
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
                gap: 4,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(255,59,48,0.1)',
                color: '#ef4444',
                border: 'none',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.1)'}
            >
              <Pause size={12} />
              停止
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{
          padding: '16px 20px',
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            fontSize: 13,
          }}>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>任务 ID</div>
              <div style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                {job.id}
                <button
                  onClick={() => navigator.clipboard.writeText(String(job.id))}
                  style={{
                    padding: 2,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>方法</div>
              <div style={{ color: '#1e293b', fontFamily: 'monospace' }}>{job.method}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>耗时</div>
              <div style={{ color: '#1e293b' }}>
                {formatDuration(job.time_started, job.time_finished || null)}
              </div>
            </div>
            {job.progress?.percent !== undefined && (
              <div>
                <div style={{ color: '#94a3b8', marginBottom: 4 }}>进度</div>
                <div style={{ color: '#1e293b' }}>{job.progress.percent.toFixed(1)}%</div>
              </div>
            )}
            {job.arguments && job.arguments.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#94a3b8', marginBottom: 4 }}>参数</div>
                <pre style={{
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  margin: 0,
                }}>
                  {JSON.stringify(job.arguments, null, 2)}
                </pre>
              </div>
            )}
            {job.error && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#ef4444', marginBottom: 4 }}>错误信息</div>
                <pre style={{
                  background: '#fef2f2',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#ef4444',
                  overflow: 'auto',
                  margin: 0,
                }}>
                  {job.error}
                </pre>
              </div>
            )}
            {job.logs_excerpt && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#94a3b8', marginBottom: 4 }}>日志摘要</div>
                <pre style={{
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  overflow: 'auto',
                  margin: 0,
                  maxHeight: 200,
                }}>
                  {job.logs_excerpt}
                </pre>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>日志路径</div>
              <div style={{ color: '#1e293b', fontFamily: 'monospace', fontSize: 12 }}>
                {job.logs_path || '不可用'}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>用户凭据</div>
              <div style={{ color: '#1e293b', fontSize: 12 }}>
                {job.credentials ? `创建者: ${job.credentials}` : '不可用'}
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
    all: jobs.filter(j => j.state !== JobStateEnum.SUCCESS).length,
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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1e293b' }}>任务</h2>
          <button
            onClick={loadJobs}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              fontSize: 13,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            刷新
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['all', 'running', 'failed'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                background: tab === t ? '#3b82f6' : '#f1f5f9',
                color: tab === t ? '#fff' : '#64748b',
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tabLabels[t]}
              {counts[t] > 0 && (
                <span style={{
                  background: tab === t ? 'rgba(255,255,255,0.3)' : 'rgba(59,130,246,0.1)',
                  color: tab === t ? '#fff' : '#3b82f6',
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
          }} />
          <input
            type="text"
            placeholder="搜索任务..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px 160px 160px 80px',
        padding: '10px 16px',
        background: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        fontSize: 12,
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        <div>名称</div>
        <div>状态</div>
        <div>开始时间</div>
        <div>结束时间</div>
        <div style={{ textAlign: 'right' }}>操作</div>
      </div>

      {/* Job List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isLoading && filteredJobs.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#64748b',
          }}>
            <Loader2 size={32} className="spin" style={{ marginBottom: 12 }} />
            <p>加载任务中...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#94a3b8',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#64748b', margin: '0 0 4px' }}>
              暂无任务
            </p>
            <p style={{ fontSize: 13, margin: 0 }}>
              {tab === 'running' ? '没有正在运行的任务' : '没有失败的任务'}
            </p>
          </div>
        ) : (
          paginatedJobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              isExpanded={expandedId === job.id}
              onToggle={() => handleToggle(job.id)}
              onAbort={handleAbort}
            />
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid #e5e7eb',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#64748b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>每页</span>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>条</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>共 {totalCount} 条</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              首页
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              上一页
            </button>
            <span style={{ padding: '0 8px' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              下一页
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#fff',
                fontSize: 12,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              末页
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
      `}</style>
    </div>
  )
}
