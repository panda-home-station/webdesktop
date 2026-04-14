import { memo } from 'react'

const EmptyState = memo(() => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#64748b',
    }}
  >
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
    <p>暂无通知</p>
  </div>
))

EmptyState.displayName = 'EmptyState'

export default EmptyState
