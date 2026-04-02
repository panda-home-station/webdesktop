/**
 * Desktop State
 *
 * Placeholder for desktop state management
 * Will be implemented when migrating specific features
 */

const WALLPAPER_KEY = 'wallpaperPath'
const DEFAULT_WALLPAPER = '/wallpaper_default.webp'

export function getWallpaper(): string {
  return localStorage.getItem(WALLPAPER_KEY) || DEFAULT_WALLPAPER
}

export function setWallpaper(path: string): void {
  localStorage.setItem(WALLPAPER_KEY, path)
}
