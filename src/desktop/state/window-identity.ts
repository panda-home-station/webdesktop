/**
 * Window Identity Manager
 *
 * Provides unique window/session identification for multi-window support.
 * Each browser tab gets a unique ID that's persisted in sessionStorage.
 */

const WINDOW_ID_KEY = 'phs_window_id'
const WINDOW_ID_LENGTH = 12

/**
 * Generate a random window ID
 */
function generateWindowId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'win_'
  for (let i = 0; i < WINDOW_ID_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Get or create the unique window ID for this tab
 * This ID persists only within this tab's session (sessionStorage)
 */
export function getWindowId(): string {
  // Try to get existing window ID from sessionStorage
  let windowId = sessionStorage.getItem(WINDOW_ID_KEY)

  if (!windowId) {
    // Generate a new window ID
    windowId = generateWindowId()
    sessionStorage.setItem(WINDOW_ID_KEY, windowId)
  }

  return windowId
}

/**
 * Get the storage key prefix for this window
 * All window-specific data should be stored with this prefix
 */
export function getWindowStoragePrefix(): string {
  return `phs_${getWindowId()}`
}

/**
 * Clear window ID (useful for testing)
 */
export function clearWindowId(): void {
  sessionStorage.removeItem(WINDOW_ID_KEY)
}
