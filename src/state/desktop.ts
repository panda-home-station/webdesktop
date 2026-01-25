const KEY = 'wallpaperPath'

export function getWallpaper() {
  const p = localStorage.getItem(KEY) || ''
  if (!p) return ''
  const host = window.location.hostname || 'localhost'
  const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
  const base = `${protocol}://${host}:${apiPort}`
  const token = localStorage.getItem('authToken') || ''
  const u = new URL(`${base}/api/docs/download`)
  u.searchParams.set('path', p)
  if (token) u.searchParams.set('token', token)
  return u.toString()
}

export function setWallpaper(path: string | null) {
  if (!path) {
    localStorage.removeItem(KEY)
  } else {
    localStorage.setItem(KEY, path)
  }
  const host = window.location.hostname || 'localhost'
  const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
  const base = `${protocol}://${host}:${apiPort}`
  const token = localStorage.getItem('authToken') || ''
  const url = (() => {
    if (!path) return ''
    const u = new URL(`${base}/api/docs/download`)
    u.searchParams.set('path', path)
    if (token) u.searchParams.set('token', token)
    return u.toString()
  })()
  try {
    const ev = new CustomEvent('desktop:wallpaper', { detail: { url } })
    window.dispatchEvent(ev)
  } catch {}
}
