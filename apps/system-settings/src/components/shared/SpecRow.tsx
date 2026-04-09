import { ChevronRight } from 'lucide-react'
import { colors } from '../../styles/theme'

// Row component for settings lists
export function Row({
  label,
  value,
  icon,
  border = true,
  onClick,
  destructive = false
}: {
  label: string
  value?: React.ReactNode
  icon?: React.ReactNode
  border?: boolean
  onClick?: () => void
  destructive?: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16,
        background: colors.cardBg,
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 48
      }}
    >
      {icon && <div style={{ marginRight: 12, color: colors.primary }}>{icon}</div>}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottom: border ? '1px solid ' + colors.border : 'none',
        height: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: 17, color: destructive ? colors.danger : colors.text, fontWeight: 400 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, transform: 'translateZ(0)' }}>
          <div style={{ fontSize: 17, color: colors.textSecondary }}>{value}</div>
          {onClick && <ChevronRight size={16} color={colors.divider} />}
        </div>
      </div>
    </div>
  )
}

// SpecGroup for key-value display groups
export function SpecGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12, paddingLeft: 2 }}>{title}</h3>
      <div style={{ background: colors.cardBg, borderRadius: 8, border: '1px solid #e5e5eb', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        {children}
      </div>
    </div>
  )
}

// SpecRow for key-value rows
export function SpecRow({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f3f4f6', minHeight: 24 }}>
      <div style={{ width: 140, fontSize: 13, color: '#6b7280', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#111827', fontWeight: 500, flex: 1, userSelect: 'text', lineHeight: 1.5 }}>{value}</div>
      {action && <div style={{ marginLeft: 12 }}>{action}</div>}
    </div>
  )
}

// PoolRow for pool display with progress bar
export function PoolRow({ name, status, isHealthy, usedStr, totalStr, freeStr, percent, isLast }: {
  name: string
  status: string
  isHealthy: boolean
  usedStr: string
  totalStr: string
  freeStr: string
  percent: string
  isLast?: boolean
}) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: isLast ? 'none' : '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{name}</div>
          <span style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            background: isHealthy ? '#dcfce7' : '#fef3c7',
            color: isHealthy ? '#166534' : '#92400e',
          }}>
            {status}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {usedStr} / {totalStr}
        </div>
      </div>
      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: Number(percent) > 90 ? colors.danger : Number(percent) > 75 ? colors.warning : colors.primary,
          borderRadius: 4,
          transition: 'width 0.5s ease-out'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
        <span>已用: {usedStr}</span>
        <span>空闲: {freeStr}</span>
      </div>
    </div>
  )
}
