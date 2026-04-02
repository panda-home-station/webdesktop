/**
 * Desktop SDK
 *
 * Placeholder for desktop functionality
 * Will be implemented when migrating specific features
 */

export function subscribeLogout(callback: () => void): () => void {
  console.warn('subscribeLogout not implemented yet')
  return () => {}
}

export function subscribeLockScreen(callback: () => void): () => void {
  console.warn('subscribeLockScreen not implemented yet')
  return () => {}
}

export function getFileTasks() {
  return []
}

export function showDesktop() {
  console.warn('showDesktop not implemented yet')
}

export function openApp(id: string) {
  console.warn('openApp not implemented yet:', id)
}

export function openLauncher() {
  console.warn('openLauncher not implemented yet')
}
