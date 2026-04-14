import { memo } from 'react'
import { RefreshCw } from 'lucide-react'

const LoadingState = memo(() => (
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
    <RefreshCw size={28} style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
    <p>加载通知中...</p>
  </div>
))

LoadingState.displayName = 'LoadingState'

export default LoadingState
