import { memo } from 'react'

const LoadingState = memo(() => (
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
))

LoadingState.displayName = 'LoadingState'

export default LoadingState
