/**
 * Windows State
 *
 * Handles persistent window state
 */

const STORAGE_KEY_WINS = 'webdesktop_windows'
const STORAGE_KEY_ZORDER = 'webdesktop_zorder'

type PersistedWindow = {
  id: string
  title: string
  appId: string
  iconUrl?: string
  x?: number
  y?: number
  w?: number
  h?: number
  minimized?: boolean
  maximized?: boolean
}

const cachedWins: PersistedWindow[] = []
const cachedZOrder: string[] = []

export function getPersistWins(): PersistedWindow[] {
  if (cachedWins.length > 0) return cachedWins

  try {
    const data = localStorage.getItem(STORAGE_KEY_WINS)
    if (data) {
      const parsed = JSON.parse(data)
      Array.isArray(parsed) && parsed.forEach((w: PersistedWindow) => {
        cachedWins.push(w)
      })
    }
  } catch (error) {
    console.error('Failed to load windows state:', error)
  }

  return cachedWins
}

export function setPersistWins(wins: PersistedWindow[]) {
  // Update cache
  cachedWins.length = 0
  wins.forEach(w => cachedWins.push(w))

  try {
    localStorage.setItem(STORAGE_KEY_WINS, JSON.stringify(wins))
  } catch (error) {
    console.error('Failed to save windows state:', error)
  }
}

export function getPersistZOrder(): string[] {
  if (cachedZOrder.length > 0) return cachedZOrder

  try {
    const data = localStorage.getItem(STORAGE_KEY_ZORDER)
    if (data) {
      const parsed = JSON.parse(data)
      Array.isArray(parsed) && parsed.forEach((id: string) => {
        cachedZOrder.push(id)
      })
    }
  } catch (error) {
    console.error('Failed to load zorder state:', error)
  }

  return cachedZOrder
}

export function setPersistZOrder(zOrder: string[]) {
  // Update cache
  cachedZOrder.length = 0
  zOrder.forEach(id => cachedZOrder.push(id))

  try {
    localStorage.setItem(STORAGE_KEY_ZORDER, JSON.stringify(zOrder))
  } catch (error) {
    console.error('Failed to save zorder state:', error)
  }
}

export function clearPersistState() {
  localStorage.removeItem(STORAGE_KEY_WINS)
  localStorage.removeItem(STORAGE_KEY_ZORDER)
  cachedWins.length = 0
  cachedZOrder.length = 0
}
