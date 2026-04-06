/**
 * Desktop State
 *
 * Desktop state management using unified persistence layer
 */

import { createTypedStore } from './persistence';

// Create typed stores for desktop settings
const wallpaperStore = createTypedStore<string>('wallpaper', '/wallpaper_default.webp');

const DEFAULT_WALLPAPER = '/wallpaper_default.webp';

export function getWallpaper(): string {
  return wallpaperStore.get();
}

export function setWallpaper(path: string): void {
  wallpaperStore.set(path);
}

export function resetWallpaper(): void {
  wallpaperStore.set(DEFAULT_WALLPAPER);
}
