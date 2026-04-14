import { memo } from 'react'
import type { Tab } from '../types'

interface EmptyStateProps {
  tab: Tab
}

const EmptyState = memo(({ tab }: EmptyStateProps) => {
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
})

EmptyState.displayName = 'EmptyState'

export default EmptyState
