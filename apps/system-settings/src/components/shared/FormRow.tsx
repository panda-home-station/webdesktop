import { colors } from '../../styles/theme'

interface FormRowProps {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  border?: boolean
}

export function FormRow({ label, icon, children, border = true }: FormRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: border ? '1px solid ' + colors.border : 'none',
    }}>
      {icon && <div style={{ marginRight: 12, color: colors.primary, width: 24 }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: colors.textTertiary, marginBottom: 4 }}>{label}</div>
        <div>{children}</div>
      </div>
    </div>
  )
}
