const KEY = 'wallpaperPath'

export function getWallpaper() {
  const p = localStorage.getItem(KEY) || ''
  if (!p) return ''
  const host = window.location.hostname || 'localhost'
  const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
  const base = `${protocol}://${host}:${apiPort}`
  return `${base}/api/docs/download?path=${encodeURIComponent(p)}`
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
  const url = path ? `${base}/api/docs/download?path=${encodeURIComponent(path)}` : ''
  try {
    const ev = new CustomEvent('desktop:wallpaper', { detail: { url } })
    window.dispatchEvent(ev)
  } catch {}
}
