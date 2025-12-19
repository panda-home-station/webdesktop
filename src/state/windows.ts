type WinPersist = {
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

const KEY_WINS = 'desktop:wins'
const KEY_Z = 'desktop:zorder'

export function getPersistWins(): WinPersist[] {
  try {
    const s = localStorage.getItem(KEY_WINS)
    const arr = s ? JSON.parse(s) : []
    if (!Array.isArray(arr)) return []
    return arr.filter((w: any) => typeof w?.appId === 'string' && w.appId.length > 0)
  } catch {
    return []
  }
}

export function setPersistWins(ws: WinPersist[]) {
  try {
    localStorage.setItem(KEY_WINS, JSON.stringify(ws))
  } catch {}
}

export function getPersistZOrder(): string[] {
  try {
    const s = localStorage.getItem(KEY_Z)
    return s ? JSON.parse(s) : []
  } catch {
    return []
  }
}

export function setPersistZOrder(z: string[]) {
  try {
    localStorage.setItem(KEY_Z, JSON.stringify(z))
  } catch {}
}
