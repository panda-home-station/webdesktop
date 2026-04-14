import { memo } from 'react'
import { Clock, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import type { JobState } from '../types'
import { JobStateEnum } from '../types'

interface StateBadgeProps {
  state: JobState
}

const StateBadge = memo(({ state }: StateBadgeProps) => {
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

export default StateBadge
