import { api } from '../api/client'
const KEY = 'wallpaperPath'

export function getWallpaper() {
  const p = api.getWallpaperCached() || localStorage.getItem(KEY) || ''
  return p ? api.fsDownloadUrl(p) : ''
}

export function setWallpaper(path: string | null) {
  api.setWallpaper(path)
  if (!path) {
    localStorage.removeItem(KEY)
  } else {
    localStorage.setItem(KEY, path)
  }
  const url = path ? api.fsDownloadUrl(path) : ''
  try {
    const ev = new CustomEvent('desktop:wallpaper', { detail: { url } })
    window.dispatchEvent(ev)
  } catch {}
}
