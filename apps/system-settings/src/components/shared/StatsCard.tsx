import { colors } from '../../styles/theme'

interface StatsCardProps {
  label: string
  value: number | string
  color?: string
}

export function StatsCard({ label, value, color = colors.primary }: StatsCardProps) {
  return (
    <div style={{
      flex: 1,
      background: colors.background,
      borderRadius: 8,
      padding: '12px 16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.textSecondary }}>{label}</div>
    </div>
  )
}
