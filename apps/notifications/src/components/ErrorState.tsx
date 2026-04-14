import { memo } from 'react'

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

const ErrorState = memo(({ error, onRetry }: ErrorStateProps) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#ef4444',
    }}
  >
    <p>加载通知失败</p>
    <p style={{ fontSize: '13px', color: '#64748b' }}>{error}</p>
    <button
      style={{
        marginTop: '12px',
        padding: '6px 14px',
        borderRadius: '6px',
        background: '#3b82f6',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
      }}
      onClick={onRetry}
    >
      重试
    </button>
  </div>
))

ErrorState.displayName = 'ErrorState'

export default ErrorState
