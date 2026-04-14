import { memo } from 'react'
import type { ExtendedJob } from '../types'
import { JobStateEnum } from '../types'

interface ProgressBarProps {
  job: ExtendedJob
}

const ProgressBar = memo(({ job }: ProgressBarProps) => {
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

export default ProgressBar
