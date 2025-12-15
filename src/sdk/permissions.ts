export function getPermissionKey(appId: string, cap: string) {
  return `perm:${appId}:${cap}`
}

export function isAllowed(appId: string, cap: string) {
  const k = getPermissionKey(appId, cap)
  return localStorage.getItem(k) === 'allow'
}

export function requestPermission(appId: string, cap: string) {
  const k = getPermissionKey(appId, cap)
  const existing = localStorage.getItem(k)
  if (existing === 'allow') return true
  if (existing === 'deny') return false
  const ok = window.confirm(`应用请求权限：${cap}\n允许 ${appId} 使用该能力吗？`)
  localStorage.setItem(k, ok ? 'allow' : 'deny')
  return ok
}
