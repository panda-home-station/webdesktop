interface BadgeProps {
  count: number
  max?: number
}

export function Badge({ count, max = 99 }: BadgeProps) {
  if (count <= 0) return null

  return (
    <span
      style={{
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: '14px',
        height: '14px',
        borderRadius: '8px',
        background: '#ef4444',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 3px',
      }}
    >
      {count > max ? `${max}+` : count}
    </span>
  )
}
