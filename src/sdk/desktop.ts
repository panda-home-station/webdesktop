import { api } from '../api/client'

const ev = new EventTarget()
export type FileTask = {
  id: string
  kind: 'upload' | 'delete' | 'download' | 'mkdir'
  name: string
  dir: string
  progress?: number
  total?: number
  status: 'running' | 'done' | 'error'
}
let fileTasks: FileTask[] = []
const KEY_TASKS = 'desktop:fileTasks'

function saveLocalTasks() {
  try {
    localStorage.setItem(KEY_TASKS, JSON.stringify(fileTasks))
  } catch {}
}
function loadLocalTasks(): FileTask[] {
  try {
    const s = localStorage.getItem(KEY_TASKS)
    const arr = s ? JSON.parse(s) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// Init tasks
api.getTasks()
  .then(tasks => {
    if (Array.isArray(tasks) && tasks.length > 0) {
      fileTasks = tasks.map(t => ({
        id: t.id,
        kind: t.type as any,
        name: t.name,
        dir: t.dir || '',
        progress: t.progress,
        status: t.status as any
      }))
    } else {
      fileTasks = loadLocalTasks()
    }
    emitFileTasks()
  })
  .catch(() => {
    fileTasks = loadLocalTasks()
    emitFileTasks()
  })

export function openLauncher() {
  ev.dispatchEvent(new CustomEvent('openLauncher'))
}

export function subscribeLauncher(handler: () => void) {
  const h = () => handler()
  ev.addEventListener('openLauncher', h as EventListener)
  return () => ev.removeEventListener('openLauncher', h as EventListener)
}

export function openApp(id: string) {
  ev.dispatchEvent(new CustomEvent('openApp', { detail: { id } }))
}

export function subscribeOpenApp(handler: (id: string) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler(ce.detail.id as string)
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
  ev.dispatchEvent(new CustomEvent('fileTasks', { detail: fileTasks }))
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
  saveLocalTasks()
  api.createTask({
    id: task.id,
    type: task.kind,
    name: task.name,
    dir: task.dir,
    progress: task.progress || 0,
    status: task.status
  })
}

export function updateFileTask(id: string, patch: Partial<FileTask>) {
  const t = fileTasks.find(x => x.id === id)
  if (t) {
    Object.assign(t, patch)
    emitFileTasks()
    saveLocalTasks()
    api.updateTask(id, {
      progress: patch.progress,
      status: patch.status
    })
  }
}

export function clearCompletedFileTasks() {
  fileTasks = fileTasks.filter(x => x.status !== 'done')
  emitFileTasks()
  saveLocalTasks()
  api.clearTasks()
}

export function showDesktop() {
  ev.dispatchEvent(new CustomEvent('showDesktop'))
}

export function subscribeShowDesktop(handler: () => void) {
  const h = () => handler()
  ev.addEventListener('showDesktop', h as EventListener)
  return () => ev.removeEventListener('showDesktop', h as EventListener)
}
