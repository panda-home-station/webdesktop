import { memo } from 'react'

interface BatchActionsProps {
  showDismissed: boolean
  onDismissAll: () => void
  onRestoreAll: () => void
}

const BatchActions = memo(({ showDismissed, onDismissAll, onRestoreAll }: BatchActionsProps) => (
  <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center' }}>
    {showDismissed ? (
      <button
        style={{
          padding: '6px 14px',
          borderRadius: '6px',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
        onClick={onRestoreAll}
      >
        恢复全部
      </button>
    ) : (
      <button
        style={{
          padding: '6px 14px',
          borderRadius: '6px',
          background: '#f1f5f9',
          color: '#475569',
          border: '1px solid #cbd5e1',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#e2e8f0'
          e.currentTarget.style.borderColor = '#94a3b8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f1f5f9'
          e.currentTarget.style.borderColor = '#cbd5e1'
        }}
        onClick={onDismissAll}
      >
        忽略全部
      </button>
    )}
  </div>
))

BatchActions.displayName = 'BatchActions'

export default BatchActions
