const ev = new EventTarget()
export type AppContextMenuItem = { label: string; onClick?: () => void }
export type AppContextMenuProvider = (ev: { x: number; y: number; target: HTMLElement }) => AppContextMenuItem[]
const appContextMenuProviders = new Map<string, AppContextMenuProvider>()

export function registerAppContextMenu(appId: string, provider: AppContextMenuProvider) {
  appContextMenuProviders.set(appId, provider)
}

export function unregisterAppContextMenu(appId: string) {
  appContextMenuProviders.delete(appId)
}

export function getAppContextMenu(appId: string, evinfo: { x: number; y: number; target: HTMLElement }): AppContextMenuItem[] {
  const p = appContextMenuProviders.get(appId)
  const items = p ? p(evinfo) : []
  return Array.isArray(items) ? items : []
}

export type FileTask = {
  id: string
  kind: 'upload' | 'delete' | 'download' | 'mkdir'
  name: string
  dir: string
  progress?: number
  total?: number
  loaded?: number
  bps?: number
  status: 'running' | 'done' | 'error' | 'paused' | 'pending'
}
let fileTasks: FileTask[] = []

export function openLauncher() {
  ev.dispatchEvent(new CustomEvent('openLauncher'))
}

export function subscribeLauncher(handler: () => void) {
  const h = () => handler()
  ev.addEventListener('openLauncher', h as EventListener)
  return () => ev.removeEventListener('openLauncher', h as EventListener)
}

export function openApp(id: string, args?: any) {
  ev.dispatchEvent(new CustomEvent('openApp', { detail: { id, args } }))
}

export function subscribeOpenApp(handler: (id: string, args?: any) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler(ce.detail.id as string, ce.detail.args)
  }
  ev.addEventListener('openApp', h as EventListener)
  return () => ev.removeEventListener('openApp', h as EventListener)
}

export function setMaximizedWindow(info: { id: string; title: string } | null) {
  ev.dispatchEvent(new CustomEvent('winMaxChanged', { detail: info }))
}

export function subscribeMaximizedWindow(handler: (info: { id: string; title: string } | null) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler((ce.detail as any) ?? null)
  }
  ev.addEventListener('winMaxChanged', h as EventListener)
  return () => ev.removeEventListener('winMaxChanged', h as EventListener)
}

export function requestWinAction(id: string, action: 'minimize' | 'toggleMax' | 'close') {
  ev.dispatchEvent(new CustomEvent('winAction', { detail: { id, action } }))
}

export function subscribeWinAction(handler: (id: string, action: 'minimize' | 'toggleMax' | 'close') => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    const d = ce.detail as any
    handler(d.id as string, d.action as any)
  }
  ev.addEventListener('winAction', h as EventListener)
  return () => ev.removeEventListener('winAction', h as EventListener)
}

function emitFileTasks() {
  ev.dispatchEvent(new CustomEvent('fileTasks', { detail: [...fileTasks] }))
}

export function getFileTasks(): FileTask[] {
  return [...fileTasks]
}

export function subscribeFileTasks(handler: (tasks: FileTask[]) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler((ce.detail as FileTask[]) || [])
  }
  ev.addEventListener('fileTasks', h as EventListener)
  return () => ev.removeEventListener('fileTasks', h as EventListener)
}

export function pushFileTask(task: FileTask) {
  fileTasks.push(task)
  emitFileTasks()
}

export function updateFileTask(id: string, patch: Partial<FileTask>) {
  const t = fileTasks.find(x => x.id === id)
  if (t) {
    Object.assign(t, patch)
    emitFileTasks()
  }
}

export function removeFileTask(id: string) {
  fileTasks = fileTasks.filter(x => x.id !== id)
  emitFileTasks()
}

export function clearCompletedFileTasks() {
  fileTasks = fileTasks.filter(x => x.status !== 'done')
  emitFileTasks()
}

export function showDesktop() {
  ev.dispatchEvent(new CustomEvent('showDesktop'))
}

export function subscribeShowDesktop(handler: () => void) {
  const h = () => handler()
  ev.addEventListener('showDesktop', h as EventListener)
  return () => ev.removeEventListener('showDesktop', h as EventListener)
}

export function setDragging(isDragging: boolean) {
  ev.dispatchEvent(new CustomEvent('dragging', { detail: isDragging }))
}

export function subscribeDragging(handler: (isDragging: boolean) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler(ce.detail as boolean)
  }
  ev.addEventListener('dragging', h as EventListener)
  return () => ev.removeEventListener('dragging', h as EventListener)
}

export function setAnimating(isAnimating: boolean) {
  ev.dispatchEvent(new CustomEvent('animating', { detail: isAnimating }))
}

export function subscribeAnimating(handler: (isAnimating: boolean) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler(ce.detail as boolean)
  }
  ev.addEventListener('animating', h as EventListener)
  return () => ev.removeEventListener('animating', h as EventListener)
}

export function setLauncherOpen(isOpen: boolean) {
  ev.dispatchEvent(new CustomEvent('launcherOpen', { detail: isOpen }))
}

export function subscribeLauncherOpen(handler: (isOpen: boolean) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler(ce.detail as boolean)
  }
  ev.addEventListener('launcherOpen', h as EventListener)
  return () => ev.removeEventListener('launcherOpen', h as EventListener)
}
