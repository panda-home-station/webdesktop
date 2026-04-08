import { colors } from '../../styles/theme'

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: colors.cardBg,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      ...style,
    }}>
      {children}
    </div>
  )
}
