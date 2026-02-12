import axios from 'axios'

const host = window.location.hostname || 'localhost'
const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
const base = window.location.port === '5173' 
  ? window.location.origin 
  : `${protocol}://${host}:${apiPort}`

let offline = false
const TOKEN_KEY = 'authToken'
const USER_KEY = 'authUser'
type Entry = { name: string; is_dir: boolean; size: number; modified_ts: number }
type Node = { type: 'dir' | 'file'; children?: Record<string, Node>; size?: number; modified_ts?: number }
type User = { user_id: string; username: string }
type FsListResp = {
  path: string
  entries: { id?: string; name: string; is_dir: boolean; size: number; modified_ts: number }[]
  has_more?: boolean
  next_offset?: number
  total?: number
}
let token = localStorage.getItem(TOKEN_KEY) || ''
let currentUser: User | null = null
let currentWallpaper: string = ''
try {
  const rawUser = localStorage.getItem(USER_KEY)
  if (token && rawUser) {
    currentUser = JSON.parse(rawUser)
  } else {
    // If no token, clear any residual user info
    localStorage.removeItem(USER_KEY)
    currentUser = null
  }
} catch {
  currentUser = null
}
const instance = axios.create({
  baseURL: base,
})

instance.interceptors.request.use(config => {
  const currentToken = token || localStorage.getItem(TOKEN_KEY) || ''
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`
  }
  return config
})

instance.interceptors.response.use(
  res => res,
  err => {
    return Promise.reject(err)
  }
)

function setToken(t: string) {
  token = t
  localStorage.setItem(TOKEN_KEY, t)
}

function clearToken() {
  token = ''
  localStorage.removeItem(TOKEN_KEY)
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
    root = { type: 'dir', children: {} }
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}



export const api = {
  async health() {
    try {
      const r = await instance.get(`/health`)
      offline = false
      return r.data as { status: string; ts: number }
    } catch (e: any) {
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        throw e
      }
      offline = true
      return { status: 'offline', ts: Math.floor(Date.now() / 1000) }
    }
  },
  async version() {
    try {
      const r = await instance.get(`/version`)
      offline = false
      return r.data as { version: string }
    } catch {
      offline = true
      return { version: 'frontend-only' }
    }
  },
  async getDeviceInfo() {
    const r = await instance.get(`/api/system/device`)
    return r.data as {
      device_name: string
      device_id: string
      system_version: string
      system_time: string
      uptime: string
    }
  },
  async initState() {
    const r = await instance.get(`/api/system/init/state`)
    return r.data as { initialized: boolean }
  },
  async initSystem(deviceName: string, username: string, password: string) {
    const r = await instance.post(`/api/system/init`, { device_name: deviceName, username, password })
    return r.data as { ok: boolean }
  },
  async signup(username: string, password: string) {
    const r = await instance.post(`/api/auth/signup`, { username, password })
    return r.data as { user_id: string }
  },
  async login(username: string, password: string) {
    const r = await instance.post(`/api/auth/login`, { username, password })
    const data = r.data as { user_id: string; token: string }
    setToken(data.token)
    try {
      const me = await this.whoami()
      if (me) {
        setUser({ user_id: me.user_id, username: me.username })
      } else {
        setUser({ user_id: data.user_id, username })
      }
    } catch {
      setUser({ user_id: data.user_id, username })
    }
    return { ok: true }
  },
  async whoami() {
    try {
      const r = await instance.get(`/api/auth/whoami`)
      const data = r.data && typeof r.data === 'object' ? r.data : null
      if (data) {
        const u = {
          user_id: data.user_id || data.id || '',
          username: data.username || ''
        }
        setUser(u)
        return u
      }
    } catch (e: any) {
      console.error('whoami failed:', e)
      if (e.response?.status === 401 || e.response?.status === 404) {
        console.warn('Session invalid or user not found, clearing token')
        clearToken()
        setUser(null)
      }
    }
    return null
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
  async getWallpaper(): Promise<string> {
    const currentToken = token || localStorage.getItem(TOKEN_KEY)
    if (!currentToken) {
      return localStorage.getItem('wallpaperPath') || '/wallpaper_default.webp'
    }
    try {
      const r = await instance.get(`/api/user/wallpaper`)
      const path = (r.data as { path?: string }).path || ''
      if (path && path.length > 0) {
        currentWallpaper = path
        return path
      }
    } catch {
      // ignore
    }
    const local = localStorage.getItem('wallpaperPath') || ''
    currentWallpaper = local
    return local
  },
  async listDownloads() {
    const r = await instance.get(`/api/downloads`)
    return r.data
  },
  async createDownload(url: string, path?: string) {
    const r = await instance.post(`/api/downloads`, { url, path })
    return r.data
  },
  async controlDownload(id: string, action: string) {
    const r = await instance.post(`/api/downloads/${id}/control`, { action })
    return r.data
  },
  async resolveMagnet(magnet_url: string) {
    const r = await instance.post(`/api/downloads/magnet/resolve`, { magnet_url })
    return r.data
  },
  async startMagnetDownload(token: string, files: number[], path?: string) {
    const r = await instance.post(`/api/downloads/magnet/start`, { token, files, path })
    return r.data
  },
  getWallpaperCached(): string {
    return currentWallpaper
  },
  async setWallpaper(path: string | null) {
    try {
      await instance.post(`/api/user/wallpaper`, { path: path || '' })
      currentWallpaper = path || ''
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async fsList(path: string) {
    try {
      const r = await instance.get(`/api/docs/list`, { params: { path, limit: 200 } })
      offline = false
      return r.data as FsListResp
    } catch {
      offline = true
      return getMockList(path)
    }
  },
  async fsListPage(path: string, offset: number, limit = 500) {
    const r = await instance.get(`/api/docs/list`, { params: { path, offset, limit } })
    return r.data as FsListResp
  },
  async fsMkdir(path: string) {
    try {
      const r = await instance.post(`/api/docs/mkdir`, { path })
      offline = false
      return r.data as { ok: boolean }
    } catch (e: any) {
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        throw e
      }
      offline = true
      mockEnsureDir(path)
      return { ok: true }
    }
  },
  async fsDelete(path: string) {
    try {
      const r = await instance.delete(`/api/docs/delete`, { params: { path } })
      offline = false
      return r.data as { ok: boolean }
    } catch (e: any) {
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        throw e
      }
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
      const r = await instance.post(`/api/docs/rename`, { from, to })
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
  async fsUpload(path: string, file: File, onProgress?: (info: { percent: number; loaded: number; total: number; bps?: number }) => void, signal?: AbortSignal) {
    try {
      const fd = new FormData()
      fd.append('path', path)
      fd.append('size', String(file.size))
      fd.append('file', file)

      let lastLoaded = 0
      let lastTs = Date.now()
      
      const r = await instance.post(`/api/docs/upload`, fd, {
        signal,
        onUploadProgress: (e) => {
          if (onProgress && e.loaded != null && e.total != null) {
             const now = Date.now()
             const dt = Math.max(1, now - lastTs)
             const dbytes = Math.max(0, e.loaded - lastLoaded)
             const bps = (dbytes / dt) * 1000
             lastLoaded = e.loaded
             lastTs = now
             const pct = Math.round((e.loaded / e.total) * 100)
             onProgress({ percent: pct, loaded: e.loaded, total: e.total, bps })
          }
        }
      })
      offline = false
      return { ok: true }
    } catch (e: any) {
       if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
         throw e
       }
       offline = true
       return { ok: true }
    }
  },
  fsDownloadUrl(path: string) {
    const u = new URL(`/api/docs/download`, window.location.origin)
    u.searchParams.set('path', path)
    if (token) u.searchParams.set('token', token)
    return u.toString()
  },
  async fsDownloadBlob(path: string) {
    const r = await instance.get(`/api/docs/download`, {
      params: { path, token },
      responseType: 'blob'
    })
    return r.data as Blob
  },

  // Task API
  async getTasks() {
    try {
      const r = await instance.get(`/api/tasks`)
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
      await instance.post(`/api/tasks`, task)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async updateTask(id: string, patch: { progress?: number; status?: string }) {
    try {
      await instance.post(`/api/tasks/${id}`, patch)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async deleteTask(id: string) {
    try {
      await instance.post(`/api/tasks/delete`, { id })
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async clearTasks() {
    try {
      await instance.post(`/api/tasks/clear`)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  // Docker API
  async podmanListContainers() {
    const r = await instance.get(`/api/podman/containers`)
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
  async podmanListImages() {
    const r = await instance.get(`/api/podman/images`)
    return r.data as {
      id: string
      repo_tags: string[]
      size: number
      created: number
    }[]
  },
  async podmanStart(id: string) {
    const r = await instance.post(`/api/podman/container/start`, { id })
    return r.data as { ok: boolean }
  },
  async podmanStop(id: string) {
    const r = await instance.post(`/api/podman/container/stop`, { id })
    return r.data as { ok: boolean }
  },
  async podmanRestart(id: string) {
    const r = await instance.post(`/api/podman/container/restart`, { id })
    return r.data as { ok: boolean }
  },
  async podmanRemove(id: string) {
    const r = await instance.post(`/api/podman/container/remove`, { id })
    return r.data as { ok: boolean }
  },
  async podmanPull(image: string, tag?: string) {
    const r = await instance.post(`/api/podman/image/pull`, { image, tag })
    return r.data as { ok: boolean }
  },
  async podmanMirrorsGet() {
    const r = await instance.get(`/api/podman/mirrors`)
    return r.data as { id: string; name: string; host: string; enabled: boolean }[]
  },
  async podmanMirrorsSet(items: { id: string; name: string; host: string; enabled: boolean }[]) {
    const r = await instance.post(`/api/podman/mirrors`, items)
    return r.status === 200
  },
  async podmanSettingsGet() {
    const r = await instance.get(`/api/podman/settings`)
    return r.data as { mode: string; host: string }
  },
  async podmanSettingsSet(mode: string, host?: string) {
    const r = await instance.post(`/api/podman/settings`, { mode, host })
    return r.status === 200
  },
  async podmanRegistrySearch(q: string, page = 1, pageSize = 24) {
    const r = await instance.get(`/api/podman/registry/search`, { params: { q, page, page_size: pageSize } })
    const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
    return {
      items: Array.isArray(data.results) ? data.results : [],
      hasNext: !!data.next,
      hasPrev: !!data.prev
    }
  },
  async podmanRegistryHot(page = 1, pageSize = 24) {
    const r = await instance.get(`/api/podman/registry/hot`, { params: { page, page_size: pageSize } })
    const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
    return {
      items: Array.isArray(data.results) ? data.results : [],
      hasNext: !!data.next,
      hasPrev: !!data.prev
    }
  },
  isOffline() {
    return offline
  }
}
