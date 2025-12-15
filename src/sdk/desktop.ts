const ev = new EventTarget()

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
