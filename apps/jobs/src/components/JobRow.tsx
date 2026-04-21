import { memo, type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Timer,
  Pause,
  Copy,
  AlertTriangle,
  Activity,
  Terminal,
} from 'lucide-react'
import type { ExtendedJob } from '../types'
import { JobStateEnum } from '../types'
import { formatDate, formatDuration, getJobDescription } from '../utils'
import StateBadge from './StateBadge'
import ProgressBar from './ProgressBar'

interface JobRowProps {
  job: ExtendedJob
  isExpanded: boolean
  onToggle: () => void
  onAbort: (job: ExtendedJob) => void
  isEven: boolean
}

const JobRow = memo(({ job, isExpanded, onToggle, onAbort, isEven }: JobRowProps) => {
  const description = getJobDescription(job)
  const canAbort = job.state === JobStateEnum.RUNNING && job.abortable

  return (
    <div style={{ marginBottom: 8 }}>
      <div
        data-job-id={job.id}
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
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = '#f8fafc'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
          }
        }}
        onMouseLeave={(e) => {
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
              }}
            >
              <Pause size={12} />
              停止
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
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
            <DetailItem label="任务 ID" value={`#${job.id}`} copyable valueText={String(job.id)} />
            <DetailItem label="耗时" value={formatDuration(job.time_started, job.time_finished || null)} />
            {job.progress?.percent !== undefined && (
              <DetailItem label="进度" value={`${job.progress.percent.toFixed(1)}%`} />
            )}
            {job.arguments && job.arguments.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailLabel icon={<Terminal size={12} />}>参数</DetailLabel>
                <pre style={{
                  background: '#1e293b',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  overflow: 'auto',
                  margin: 0,
                  maxHeight: 150,
                }}>
                  {JSON.stringify(job.arguments, null, 2)}
                </pre>
              </div>
            )}
            {job.error && (
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailLabel icon={<AlertTriangle size={12} />} color="#ef4444">错误信息</DetailLabel>
                <pre style={{
                  background: '#fef2f2',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#dc2626',
                  overflow: 'auto',
                  margin: 0,
                  border: '1px solid #fecaca',
                }}>
                  {job.error}
                </pre>
              </div>
            )}
            {job.logs_excerpt && (
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailLabel icon={<Activity size={12} />}>日志摘要</DetailLabel>
                <pre style={{
                  background: '#f8fafc',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#475569',
                  overflow: 'auto',
                  margin: 0,
                  maxHeight: 150,
                  border: '1px solid #e2e8f0',
                }}>
                  {job.logs_excerpt}
                </pre>
              </div>
            )}
            <DetailItem label="日志路径" value={job.logs_path || '不可用'} valueColor={job.logs_path ? '#3b82f6' : '#cbd5e1'} />
            <DetailItem
              label="用户凭据"
              value={job.credentials || '系统任务'}
              valueColor={job.credentials ? '#10b981' : '#cbd5e1'}
            />
          </div>
        </div>
      )}
    </div>
  )
})

JobRow.displayName = 'JobRow'

interface DetailItemProps {
  label: string
  value: string
  copyable?: boolean
  valueText?: string
  valueColor?: string
  icon?: ReactNode
  color?: string
}

const DetailItem = memo(({ label, value, copyable, valueText, valueColor, icon, color }: DetailItemProps) => (
  <div>
    <DetailLabel icon={icon} color={color}>{label}</DetailLabel>
    <div style={{ color: valueColor || '#1e293b', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
      {value}
      {copyable && valueText && (
        <button
          onClick={() => navigator.clipboard.writeText(valueText)}
          style={{
            padding: 4,
            border: 'none',
            background: '#f1f5f9',
            borderRadius: 4,
            cursor: 'pointer',
            color: '#64748b',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0'
            e.currentTarget.style.color = '#3b82f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <Copy size={12} />
        </button>
      )}
    </div>
  </div>
))

DetailItem.displayName = 'DetailItem'

interface DetailLabelProps {
  children: ReactNode
  icon?: ReactNode
  color?: string
}

const DetailLabel = memo(({ children, icon, color }: DetailLabelProps) => (
  <div style={{
    color: color || '#94a3b8',
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }}>
    {icon}
    {children}
  </div>
))

DetailLabel.displayName = 'DetailLabel'

export default JobRow
