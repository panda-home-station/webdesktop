const ev = new EventTarget()

export function notify(message: string) {
  ev.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
}

export function subscribe(handler: (msg: string) => void) {
  const h = (e: Event) => {
    const ce = e as CustomEvent
    handler(ce.detail.message as string)
  }
  ev.addEventListener('notify', h as EventListener)
  return () => ev.removeEventListener('notify', h as EventListener)
}
