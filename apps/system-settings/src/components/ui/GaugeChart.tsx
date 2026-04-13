/**
 * GaugeChart Component
 * A circular ring chart for displaying usage percentage
 */

interface GaugeChartProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  colorFill?: string
  colorBlank?: string
  label?: string
  showWarning?: boolean
}

export function GaugeChart({
  value,
  size = 120,
  strokeWidth = 8,
  colorFill = '#007aff',
  colorBlank = '#e5e5ea',
  label,
  showWarning = false,
}: GaugeChartProps) {
  // Ring chart (full circle with hole)
  const radius = (size - strokeWidth) / 2
  const center = size / 2

  // Circumference for full circle
  const circumference = 2 * Math.PI * radius

  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value))

  // Calculate stroke dash offset
  // For a ring, we fill clockwise from top (270° in standard coords)
  const filledLength = (clampedValue / 100) * circumference

  const displayColor = showWarning ? '#ff3b30' : colorFill

  return (
    <div style={{ ...styles.container, width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background ring (gray) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={colorBlank}
          strokeWidth={strokeWidth}
        />
        {/* Value ring (colored) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={displayColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${circumference}`}
          strokeDashoffset={0}
          style={{
            transition: 'stroke-dasharray 0.5s ease',
          }}
        />
      </svg>
      {/* Center label */}
      <div style={styles.labelContainer}>
        <span
          style={{
            ...styles.percentage,
            color: displayColor,
          }}
        >
          {clampedValue.toFixed(1)}%
        </span>
        {label && <span style={styles.label}>{label}</span>}
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  percentage: {
    fontSize: 20,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  label: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 2,
  },
}