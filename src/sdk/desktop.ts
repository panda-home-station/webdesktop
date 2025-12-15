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
