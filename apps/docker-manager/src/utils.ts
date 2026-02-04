export const fmtSize = (n: number) => {
  if (n < 1000) return `${n} B`
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = n
  let i = 0
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  return `${v.toFixed(2)} ${units[i]}`
}

export const fmtImageName = (repoTag: string) => {
  if (!repoTag) return ''
  const parts = repoTag.split('/')
  const lastPart = parts[parts.length - 1]
  return lastPart
}

export const iOSButtonStyle = (type: 'primary' | 'danger' | 'default' = 'default') => ({
  background: type === 'primary' ? '#007aff' : type === 'danger' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(118, 118, 128, 0.12)',
  color: type === 'primary' ? '#fff' : type === 'danger' ? '#ff3b30' : '#000',
  border: 'none',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
})
