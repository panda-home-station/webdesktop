import axios from 'axios'

const host = window.location.hostname || 'localhost'
const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
const base = `${protocol}://${host}:${apiPort}`

let offline = false
const TOKEN_KEY = 'authToken'
const USER_KEY = 'authUser'
type Entry = { name: string; is_dir: boolean; size: number; modified_ts: number }
type Node = { type: 'dir' | 'file'; children?: Record<string, Node>; size?: number; modified_ts?: number }
type User = { user_id: string; username: string }
let token = localStorage.getItem(TOKEN_KEY) || ''
let currentUser: User | null = null
try {
  const rawUser = localStorage.getItem(USER_KEY)
  currentUser = rawUser ? JSON.parse(rawUser) : null
} catch {
  currentUser = null
}
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
function setToken(t: string) {
  token = t
  localStorage.setItem(TOKEN_KEY, t)
  axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
}
function clearToken() {
  token = ''
  localStorage.removeItem(TOKEN_KEY)
  delete axios.defaults.headers.common['Authorization']
}
function setUser(u: User | null) {
  currentUser = u
  if (u) {
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}
function mockLoadRoot(): Node {
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
  return root
}
function mockSaveRoot(root: Node) {
  localStorage.setItem('mockfs', JSON.stringify(root))
}
function mockEnsureDir(path: string) {
  const root = mockLoadRoot()
  const parts = (path || '/').split('/').filter(Boolean)
  let cur: Node = root
  for (const p of parts) {
    cur.children = cur.children || {}
    if (!cur.children[p]) {
      cur.children[p] = { type: 'dir', children: {}, modified_ts: Math.floor(Date.now() / 1000) }
    }
    cur = cur.children[p]
  }
  mockSaveRoot(root)
}
function mockTraverse(path: string): { root: Node; node: Node; parent: Node | null; name: string } {
  const root = mockLoadRoot()
  const parts = (path || '/').split('/').filter(Boolean)
  let cur: Node = root
  let parent: Node | null = null
  let name = ''
  for (const p of parts) {
    parent = cur
    name = p
    cur.children = cur.children || {}
    cur = cur.children[p] || { type: 'dir', children: {} }
  }
  return { root, node: cur, parent, name }
}
function getMockList(path: string): { base: string; path: string; entries: Entry[] } {
  const { node } = mockTraverse(path)
  const children = node.children || {}
  const entries: Entry[] = Object.entries(children).map(([name, n]) => ({
    name,
    is_dir: n.type === 'dir',
    size: n.type === 'file' ? n.size || 0 : 0,
    modified_ts: n.modified_ts || Math.floor(Date.now() / 1000)
  }))
  return { base: '/', path, entries }
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
  async getDeviceInfo() {
    const r = await axios.get(`${base}/api/system/device`)
    return r.data as {
      device_name: string
      device_id: string
      system_version: string
      system_time: string
      uptime: string
    }
  },
  async initState() {
    const r = await axios.get(`${base}/api/system/init/state`)
    return r.data as { initialized: boolean }
  },
  async initSystem(deviceName: string, username: string, password: string) {
    const r = await axios.post(`${base}/api/system/init`, { device_name: deviceName, username, password })
    return r.data as { ok: boolean }
  },
  async signup(username: string, password: string) {
    const r = await axios.post(`${base}/api/auth/signup`, { username, password })
    return r.data as { user_id: string }
  },
  async login(username: string, password: string) {
    const r = await axios.post(`${base}/api/auth/login`, { username, password })
    const data = r.data as { user_id: string; token: string }
    setToken(data.token)
    try {
      const me = await this.whoami()
      setUser({ user_id: me.user_id, username: me.username })
    } catch {
      setUser({ user_id: data.user_id, username })
    }
    return { ok: true }
  },
  async whoami() {
    const r = await axios.get(`${base}/api/auth/whoami`)
    return r.data as { user_id: string; username: string }
  },
  logout() {
    clearToken()
    setUser(null)
  },
  getToken() {
    return token
  },
  getUser() {
    return currentUser
  },
  async fsList(path: string) {
    try {
      const r = await axios.get(`${base}/api/docs/list`, { params: { path } })
      offline = false
      return r.data as {
        path: string
        entries: { id: string; name: string; is_dir: boolean; size: number; modified_ts: number }[]
      }
    } catch {
      offline = true
      return getMockList(path)
    }
  },
  async fsMkdir(path: string) {
    try {
      const r = await axios.post(`${base}/api/docs/mkdir`, { path })
      offline = false
      return r.data as { ok: boolean }
    } catch {
      offline = true
      mockEnsureDir(path)
      return { ok: true }
    }
  },
  async fsDelete(path: string) {
    try {
      const r = await axios.delete(`${base}/api/docs/delete`, { params: { path } })
      offline = false
      return r.data as { ok: boolean }
    } catch {
      offline = true
      const { root, parent, name } = mockTraverse(path)
      if (parent && parent.children && name && parent.children[name]) {
        delete parent.children[name]
        mockSaveRoot(root)
      }
      return { ok: true }
    }
  },
  async fsRename(from: string, to: string) {
    try {
      const r = await axios.post(`${base}/api/docs/rename`, { from, to })
      return r.data as { ok: boolean }
    } catch {
      const { root, parent, name } = mockTraverse(from)
      if (!parent || !parent.children || !parent.children[name]) return { ok: false }
      const node = parent.children[name]
      delete parent.children[name]
      const toParts = (to || '').split('/').filter(Boolean)
      const newName = toParts.pop() || name
      let cur = root
      for (const p of toParts) {
        cur.children = cur.children || {}
        cur.children[p] = cur.children[p] || { type: 'dir', children: {} }
        cur = cur.children[p]
      }
      cur.children = cur.children || {}
      cur.children[newName] = node
      node.modified_ts = Math.floor(Date.now() / 1000)
      mockSaveRoot(root)
      return { ok: true }
    }
  },
  async fsUpload(path: string, file: File, onProgress?: (info: { percent: number; loaded: number; total: number; bps?: number }) => void) {
    try {
      const fd = new FormData()
      fd.append('path', path)
      fd.append('file', file)
      let lastLoaded = 0
      let lastTs = Date.now()
      if (onProgress) onProgress({ percent: 0, loaded: 0, total: file.size, bps: 0 })
      const r = await axios.post(`${base}/api/docs/upload`, fd, {
        onUploadProgress: (e) => {
          if (onProgress && e.loaded != null) {
            const now = Date.now()
            const dt = Math.max(1, now - lastTs)
            const dbytes = Math.max(0, e.loaded - lastLoaded)
            const bps = (dbytes / dt) * 1000
            lastLoaded = e.loaded
            lastTs = now
            const total = e.total ?? file.size
            const pct = total > 0 ? Math.round((e.loaded / total) * 100) : 0
            onProgress({ percent: pct, loaded: e.loaded, total, bps })
          }
        }
      })
      offline = false
      return r.data as { ok: boolean }
    } catch {
      offline = true
      mockEnsureDir(path)
      const { root, node } = mockTraverse(path)
      node.children = node.children || {}
      node.children[file.name] = { type: 'file', size: file.size, modified_ts: Math.floor(Date.now() / 1000) }
      mockSaveRoot(root)
      if (onProgress) onProgress({ percent: 100, loaded: file.size, total: file.size, bps: undefined })
      return { ok: true }
    }
  },
  fsDownloadUrl(path: string) {
    const u = new URL(`${base}/api/docs/download`)
    u.searchParams.set('path', path)
    if (token) u.searchParams.set('token', token)
    return u.toString()
  },
  async fsDownloadBlob(path: string) {
    const r = await axios.get(`${base}/api/docs/download`, {
      params: { path, token },
      responseType: 'blob'
    })
    return r.data as Blob
  },
  // Task API
  async getTasks() {
    try {
      const r = await axios.get(`${base}/api/tasks`)
      return r.data as {
        id: string
        type: string
        name: string
        dir?: string
        progress: number
        status: string
      }[]
    } catch {
      return []
    }
  },
  async createTask(task: {
    id: string
    type: string
    name: string
    dir?: string
    progress: number
    status: string
  }) {
    try {
      await axios.post(`${base}/api/tasks`, task)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async updateTask(id: string, patch: { progress?: number; status?: string }) {
    try {
      await axios.post(`${base}/api/tasks/${id}`, patch)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async clearTasks() {
    try {
      await axios.post(`${base}/api/tasks/clear`)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  // Docker API
  async dockerListContainers() {
    const r = await axios.get(`${base}/api/docker/containers`)
    return r.data as {
      id: string
      names: string[]
      image: string
      state: string
      status?: string
      created: number
      ports: [number, number | null, string | null][]
    }[]
  },
  async dockerListImages() {
    const r = await axios.get(`${base}/api/docker/images`)
    return r.data as {
      id: string
      repo_tags: string[]
      size: number
      created: number
    }[]
  },
  async dockerStart(id: string) {
    const r = await axios.post(`${base}/api/docker/container/start`, { id })
    return r.data as { ok: boolean }
  },
  async dockerStop(id: string) {
    const r = await axios.post(`${base}/api/docker/container/stop`, { id })
    return r.data as { ok: boolean }
  },
  async dockerRestart(id: string) {
    const r = await axios.post(`${base}/api/docker/container/restart`, { id })
    return r.data as { ok: boolean }
  },
  async dockerRemove(id: string) {
    const r = await axios.post(`${base}/api/docker/container/remove`, { id })
    return r.data as { ok: boolean }
  },
  async dockerPull(image: string, tag?: string) {
    const r = await axios.post(`${base}/api/docker/image/pull`, { image, tag })
    return r.data as { ok: boolean }
  },
  isOffline() {
    return offline
  }
}
