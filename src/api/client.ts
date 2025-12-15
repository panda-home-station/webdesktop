import axios from 'axios'

const host = window.location.hostname || 'localhost'
const base = `http://${host}:8000`

let offline = false
type Entry = { name: string; is_dir: boolean; size: number; modified_ts: number }
type Node = { type: 'dir' | 'file'; children?: Record<string, Node>; size?: number; modified_ts?: number }
function getMock(): { base: string; path: string; entries: Entry[] } {
  const raw = localStorage.getItem('mockfs')
  let root: Node
  if (raw) {
    try {
      root = JSON.parse(raw)
    } catch {
      root = { type: 'dir', children: {} }
    }
  } else {
    root = {
      type: 'dir',
      children: {
        Documents: { type: 'dir', children: {} },
        Pictures: { type: 'dir', children: {} },
        Downloads: { type: 'dir', children: {} }
      }
    }
    localStorage.setItem('mockfs', JSON.stringify(root))
  }
  const entries: Entry[] = Object.entries(root.children || {}).map(([name, node]) => ({
    name,
    is_dir: node.type === 'dir',
    size: node.type === 'file' ? node.size || 0 : 0,
    modified_ts: node.modified_ts || Math.floor(Date.now() / 1000)
  }))
  return { base: '/', path: '/', entries }
}

export const api = {
  async health() {
    try {
      const r = await axios.get(`${base}/health`)
      offline = false
      return r.data as { status: string; ts: number }
    } catch {
      offline = true
      return { status: 'offline', ts: Math.floor(Date.now() / 1000) }
    }
  },
  async version() {
    try {
      const r = await axios.get(`${base}/version`)
      offline = false
      return r.data as { version: string }
    } catch {
      offline = true
      return { version: 'frontend-only' }
    }
  },
  async fsList(path: string) {
    try {
      const r = await axios.get(`${base}/api/fs/list`, { params: { path } })
      offline = false
      return r.data as {
        base: string
        path: string
        entries: { name: string; is_dir: boolean; size: number; modified_ts: number }[]
      }
    } catch {
      offline = true
      return getMock()
    }
  },
  async fsMkdir(path: string) {
    try {
      const r = await axios.post(`${base}/api/fs/mkdir`, { path })
      offline = false
      return r.data as { ok: boolean }
    } catch {
      offline = true
      const raw = localStorage.getItem('mockfs')
      const root: Node = raw ? JSON.parse(raw) : { type: 'dir', children: {} }
      const name = (path || '').split('/').filter(Boolean).pop()
      if (name) {
        root.children = root.children || {}
        if (!root.children[name]) {
          root.children[name] = { type: 'dir', children: {}, modified_ts: Math.floor(Date.now() / 1000) }
          localStorage.setItem('mockfs', JSON.stringify(root))
        }
      }
      return { ok: true }
    }
  },
  async fsDelete(path: string) {
    try {
      const r = await axios.delete(`${base}/api/fs/delete`, { params: { path } })
      offline = false
      return r.data as { ok: boolean }
    } catch {
      offline = true
      const raw = localStorage.getItem('mockfs')
      const root: Node = raw ? JSON.parse(raw) : { type: 'dir', children: {} }
      const name = (path || '').split('/').filter(Boolean).pop()
      if (name && root.children && root.children[name]) {
        delete root.children[name]
        localStorage.setItem('mockfs', JSON.stringify(root))
      }
      return { ok: true }
    }
  },
  isOffline() {
    return offline
  }
}
