import { Users } from 'lucide-react'
import { colors } from '../../styles/theme'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: colors.textSecondary,
    }}>
      <div style={{ fontSize: 48, color: colors.divider, marginBottom: 16 }}>
        {icon || <Users size={48} color={colors.divider} />}
      </div>
      <div style={{ fontSize: 17, marginBottom: 8, color: colors.text }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 14, color: colors.textTertiary }}>
          {description}
        </div>
      )}
    </div>
  )
}
