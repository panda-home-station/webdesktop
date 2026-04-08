import { colors } from '../../styles/theme'

interface SectionProps {
  title?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

export function Section({ title, footer, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {title && (
        <h3 style={{
          fontSize: 13,
          fontWeight: 400,
          color: colors.textTertiary,
          marginBottom: 8,
          paddingLeft: 16,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {title}
        </h3>
      )}
      <div style={{
        background: colors.cardBg,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {children}
      </div>
      {footer && (
        <div style={{
          fontSize: 13,
          color: colors.textTertiary,
          marginTop: 8,
          paddingLeft: 16,
          lineHeight: 1.4,
        }}>
          {footer}
        </div>
      )}
    </div>
  )
}
