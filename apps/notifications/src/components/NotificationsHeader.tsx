import { memo } from 'react'
import type { SeverityFilter } from '../types'
import { severityLabels } from '../types'

interface NotificationsHeaderProps {
  alertCounts: Record<SeverityFilter, number>
  severityFilter: SeverityFilter
  showDismissed: boolean
  onFilterChange: (filter: SeverityFilter) => void
  onShowDismissedChange: (show: boolean) => void
}

const NotificationsHeader = memo(({
  alertCounts,
  severityFilter,
  showDismissed,
  onFilterChange,
  onShowDismissedChange,
}: NotificationsHeaderProps) => (
  <div
    style={{
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      background: '#fff',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#1e293b' }}>
        通知中心
      </h2>
    </div>

    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {(Object.keys(alertCounts) as SeverityFilter[]).map((filter) => {
        const isActive = (showDismissed && filter === 'dismissed') ||
          (!showDismissed && filter === severityFilter)

        return (
          <button
            key={filter}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              background: isActive ? '#3b82f6' : '#f1f5f9',
              color: isActive ? '#fff' : '#475569',
              border: 'none',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = '#e2e8f0'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = '#f1f5f9'
            }}
            onClick={() => {
              if (filter === 'dismissed') {
                onShowDismissedChange(true)
              } else {
                onShowDismissedChange(false)
                onFilterChange(filter)
              }
            }}
          >
            {severityLabels[filter]}
            {alertCounts[filter] > 0 && (
              <span
                style={{
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 5px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255, 0.3)',
                  fontSize: '10px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {alertCounts[filter]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  </div>
))

NotificationsHeader.displayName = 'NotificationsHeader'

export default NotificationsHeader
