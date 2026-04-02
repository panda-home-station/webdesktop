/**
 * Desktop SDK
 *
 * Placeholder for desktop functionality
 * Will be implemented when migrating specific features
 */

const logoutCallbacks: Array<() => void> = []
const lockScreenCallbacks: Array<() => void> = []
const openAppCallbacks: Array<(id: string, args?: any) => void> = []
const winActionCallbacks: Array<(id: string, action: string) => void> = []
const showDesktopCallbacks: Array<() => void> = []
const launcherCallbacks: Array<() => void> = []

let dragging = false
let maximizedWindow: { id: string; title: string } | null = null
let animating = false
let launcherOpen = false

export function subscribeLogout(callback: () => void): () => void {
  logoutCallbacks.push(callback)
  return () => {
    const idx = logoutCallbacks.indexOf(callback)
    if (idx > -1) logoutCallbacks.splice(idx, 1)
  }
}

export function logout() {
  logoutCallbacks.forEach(cb => cb())
}

export function subscribeLockScreen(callback: () => void): () => void {
  lockScreenCallbacks.push(callback)
  return () => {
    const idx = lockScreenCallbacks.indexOf(callback)
    if (idx > -1) lockScreenCallbacks.splice(idx, 1)
  }
}

export function lockScreen() {
  lockScreenCallbacks.forEach(cb => cb())
}

export function subscribeOpenApp(callback: (id: string, args?: any) => void): () => void {
  openAppCallbacks.push(callback)
  return () => {
    const idx = openAppCallbacks.indexOf(callback)
    if (idx > -1) openAppCallbacks.splice(idx, 1)
  }
}

export function openApp(id: string, args?: any) {
  openAppCallbacks.forEach(cb => cb(id, args))
}

export function subscribeWinAction(callback: (id: string, action: string) => void): () => void {
  winActionCallbacks.push(callback)
  return () => {
    const idx = winActionCallbacks.indexOf(callback)
    if (idx > -1) winActionCallbacks.splice(idx, 1)
  }
}

export function subscribeShowDesktop(callback: () => void): () => void {
  showDesktopCallbacks.push(callback)
  return () => {
    const idx = showDesktopCallbacks.indexOf(callback)
    if (idx > -1) showDesktopCallbacks.splice(idx, 1)
  }
}

export function showDesktop() {
  showDesktopCallbacks.forEach(cb => cb())
}

export function subscribeLauncher(callback: () => void): () => void {
  launcherCallbacks.push(callback)
  return () => {
    const idx = launcherCallbacks.indexOf(callback)
    if (idx > -1) launcherCallbacks.splice(idx, 1)
  }
}

export function openLauncher() {
  launcherCallbacks.forEach(cb => cb())
}

export function getFileTasks() {
  return []
}

export function subscribeDragging(callback: (isDragging: boolean) => void): () => void {
  // TODO: Implement drag subscription
  return () => {}
}

export function setDragging(isDragging: boolean) {
  dragging = isDragging
}

export function getAppContextMenu(appId: string, context: { x: number; y: number; target: HTMLElement }): Array<{ label: string; onClick?: () => void }> {
  // TODO: Implement context menu based on appId
  return []
}

export function setMaximizedWindow(win: { id: string; title: string } | null) {
  maximizedWindow = win
}

export function setAnimating(isAnimating: boolean) {
  animating = isAnimating
}

export function setLauncherOpen(isOpen: boolean) {
  launcherOpen = isOpen
}
