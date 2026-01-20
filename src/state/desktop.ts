const KEY = 'wallpaperUrl'

export function getWallpaper() {
  return localStorage.getItem(KEY) || ''
}

export function setWallpaper(url: string | null) {
  if (!url) {
    localStorage.removeItem(KEY)
  } else {
    localStorage.setItem(KEY, url)
  }
  try {
    const ev = new CustomEvent('desktop:wallpaper', { detail: { url: url || '' } })
    window.dispatchEvent(ev)
  } catch {}
}
