import { colors } from '../../styles/theme'

interface LoadingSkeletonProps {
  count?: number
  height?: number
}

export function LoadingSkeleton({ count = 3, height = 180 }: LoadingSkeletonProps) {
  return (
    <div style={{ padding: 20 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{
          background: colors.cardBg,
          borderRadius: 10,
          padding: 16,
          marginBottom: 12,
          height,
          animation: 'pulse 1.5s infinite',
        }} />
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
