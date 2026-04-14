// iOS-style color palette for system-settings
export const colors = {
  background: '#ffffff',
  cardBg: '#ffffff',
  primary: '#007aff',
  success: '#34c759',
  warning: '#ff9500',
  danger: '#ff3b30',
  text: '#1c1c1e',
  textSecondary: '#8e8e93',
  textTertiary: '#6c6c70',
  border: '#e5e5ea',
  divider: '#c6c6c8',
} as const

export type Colors = typeof colors
