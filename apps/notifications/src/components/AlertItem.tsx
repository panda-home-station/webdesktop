import { useState, memo, type ReactNode, type MouseEvent } from 'react'
import { X, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import type { Alert } from '@truenas/types/alert.interface'
import { formatDate, getLevelLabel, getAlertLevelColor } from '../utils'

interface AlertItemProps {
  alert: Alert
  onDismiss: (id: string) => void
  onRestore: (id: string) => void
}

const AlertItem = memo(({ alert, onDismiss, onRestore }: AlertItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const levelColor = getAlertLevelColor(alert.level)
  const levelLabel = getLevelLabel(alert.level)

  return (
    <div
      style={{
        borderRadius: '8px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: levelColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: levelColor,
            padding: '2px 6px',
            borderRadius: '4px',
            background: levelColor + '15',
            flexShrink: 0,
          }}
        >
          {levelLabel}
        </span>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: '13px',
            color: '#1e293b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {alert.formatted || alert.text}
        </div>
        <span
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            flexShrink: 0,
          }}
        >
          {formatDate(alert.datetime)}
        </span>
        {expanded ? (
          <ChevronUp size={16} color="#64748b" />
        ) : (
          <ChevronDown size={16} color="#64748b" />
        )}
      </div>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            padding: '12px',
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.6,
              marginBottom: '10px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {alert.formatted || alert.text}
          </div>
          {alert.klass && (
            <div
              style={{
                fontSize: '12px',
                color: '#64748b',
                marginBottom: '10px',
              }}
            >
              <strong>类型:</strong> {alert.klass}
            </div>
          )}
          <div
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '10px',
            }}
          >
            <div><strong>ID:</strong> {alert.id}</div>
            <div><strong>来源:</strong> {alert.source}</div>
            {alert.node && <div><strong>节点:</strong> {alert.node}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {alert.dismissed ? (
              <ActionButton
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  onRestore(alert.id)
                }}
                icon={<RefreshCw size={12} />}
                label="重新打开"
                variant="primary"
              />
            ) : (
              <ActionButton
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  onDismiss(alert.id)
                }}
                icon={<X size={12} />}
                label="忽略"
                variant="secondary"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
})

AlertItem.displayName = 'AlertItem'

interface ActionButtonProps {
  onClick: (e: MouseEvent) => void
  icon: ReactNode
  label: string
  variant: 'primary' | 'secondary'
}

const ActionButton = memo(({ onClick, icon, label, variant }: ActionButtonProps) => {
  const isPrimary = variant === 'primary'
  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        background: isPrimary ? '#3b82f6' : 'transparent',
        color: isPrimary ? '#fff' : '#64748b',
        border: isPrimary ? 'none' : '1px solid #cbd5e1',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isPrimary ? '#2563eb' : '#f1f5f9'
        if (!isPrimary) e.currentTarget.style.borderColor = '#94a3b8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isPrimary ? '#3b82f6' : 'transparent'
        if (!isPrimary) e.currentTarget.style.borderColor = '#cbd5e1'
      }}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
})

ActionButton.displayName = 'ActionButton'

export default AlertItem
