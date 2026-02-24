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
export type Entry = { 
  id: string
  name: string
  is_dir: boolean
  size: number
  modified_ts: number
  mime: string
}
type Node = { type: 'dir' | 'file'; children?: Record<string, Node>; size?: number; modified_ts?: number }
type User = { user_id: string; username: string }
type FsListResp = {
  path: string
  entries: Entry[]
  has_more: boolean
  next_offset: number
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
export const instance = axios.create({
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const api = {
  async health() {
    try {
      const r = await instance.get(`/health`)
      return r.data as { status: string; ts: number }
    } catch (e: any) {
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        throw e
      }
      return { status: 'offline', ts: Math.floor(Date.now() / 1000) }
    }
  },
  async version() {
    try {
      const r = await instance.get(`/version`)
      return r.data as { version: string }
    } catch {
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
  async getSystemStats() {
    const r = await instance.get(`/api/system/stats`)
    return r.data as {
      cpu_usage: number
      mem_total: number
      mem_used: number
      disk_total: number
      disk_used: number
      net_in: number
      net_out: number
      timestamp: number
    }
  },
  async getSystemStatsHistory(start: string, end: string, limit = 1000) {
    const r = await instance.get(`/api/system/stats/history`, {
      params: { start, end, limit }
    })
    return r.data as {
      cpu_usage: number
      mem_total: number
      mem_used: number
      disk_total: number
      disk_used: number
      net_in: number
      net_out: number
      timestamp: number
    }[]
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
  async getSecuritySettings() {
    try {
      const r = await instance.get(`/api/user/security`)
      return r.data as { idle_timeout: number; idle_action: 'lock' | 'logout' }
    } catch {
      return {
        idle_timeout: Number(localStorage.getItem('pnas_idle_timeout')) || 0,
        idle_action: (localStorage.getItem('pnas_idle_action') as 'lock' | 'logout') || 'lock'
      }
    }
  },
  async setSecuritySettings(settings: { idle_timeout: number; idle_action: string }) {
    try {
      await instance.post(`/api/user/security`, settings)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async fsList(path: string, limit = 200) {
    const r = await instance.get(`/api/docs/list`, { params: { path, limit } })
    return r.data as FsListResp
  },
  async fsListPage(path: string, offset: number, limit = 500) {
    const r = await instance.get(`/api/docs/list`, { params: { path, offset, limit } })
    return r.data as FsListResp
  },
  async fsMkdir(path: string) {
    const r = await instance.post(`/api/docs/mkdir`, { path })
    return r.data as { ok: boolean }
  },
  async fsDelete(path: string) {
    const r = await instance.delete(`/api/docs/delete`, { params: { path } })
    return r.data as { ok: boolean }
  },
  async fsRename(from: string, to: string) {
    const r = await instance.post(`/api/docs/rename`, { from, to })
    return r.data as { ok: boolean }
  },
  async execCommand(command: string, sessionId?: string) {
    const r = await instance.post('/api/agent/terminal/exec', { command, session_id: sessionId })
    return r.data as { stdout: string; stderr: string; exit_code: number; cwd: string }
  },
  async completeCommand(command: string, sessionId?: string) {
    const r = await instance.post('/api/agent/terminal/complete', { command, session_id: sessionId })
    return r.data as string[]
  },
  async fsUploadLegacy(path: string, file: File, onProgress?: (info: { percent: number; loaded: number; total: number; bps?: number }) => void, signal?: AbortSignal) {
      const fd = new FormData()
      fd.append('path', path)
      fd.append('size', String(file.size))
      fd.append('file', file)

      let lastLoaded = 0
      let lastTs = Date.now()
      let currentBps = 0
      
      await instance.post(`/api/docs/upload`, fd, {
        signal,
        onUploadProgress: (e) => {
          if (onProgress && e.loaded != null && e.total != null) {
             const now = Date.now()
             const dt = now - lastTs
             
             // Update speed every 1s
             if (dt >= 1000) {
               const dbytes = Math.max(0, e.loaded - lastLoaded)
               currentBps = (dbytes / dt) * 1000
               lastLoaded = e.loaded
               lastTs = now
             }
             
             const pct = Math.round((e.loaded / e.total) * 100)
             onProgress({ percent: pct, loaded: e.loaded, total: e.total, bps: currentBps })
          }
        }
      })
      return { ok: true }
  },

  async fsUpload(path: string, file: File, onProgress?: (info: { percent: number; loaded: number; total: number; bps?: number }) => void, signal?: AbortSignal) {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

    if (file.size < CHUNK_SIZE) {
      return this.fsUploadLegacy(path, file, onProgress, signal);
    }

    // 1. Initiate Multipart Upload
    const initiateResponse = await instance.post('/api/docs/upload/initiate', {
      path: path,
      name: file.name,
    });
    const uploadId = initiateResponse.data.upload_id;

    // 2. Upload parts
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const parts: { part_number: number; etag: string }[] = [];
    let uploadedSize = 0;
    
    // Speed calculation state
    let lastLoaded = 0;
    let lastTs = Date.now();
    let currentBps = 0;

    for (let i = 0; i < totalChunks; i++) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const partNumber = i + 1;

      const partResponse = await instance.put(`/api/docs/upload/part?upload_id=${uploadId}&part_number=${partNumber}`, chunk, {
        headers: { 'Content-Type': 'application/octet-stream' },
        signal,
        onUploadProgress: (e) => {
          if (onProgress && e.loaded != null) {
            const currentTotalLoaded = uploadedSize + e.loaded
            const now = Date.now()
            const dt = now - lastTs
            
            // Update speed every 1s
            if (dt >= 1000) {
              const dbytes = Math.max(0, currentTotalLoaded - lastLoaded)
              currentBps = (dbytes / dt) * 1000
              lastLoaded = currentTotalLoaded
              lastTs = now
            }

            const percent = Math.round((currentTotalLoaded / file.size) * 100)
            onProgress({ percent, loaded: currentTotalLoaded, total: file.size, bps: currentBps })
          }
        }
      });

      parts.push({ part_number: partNumber, etag: partResponse.data.etag });
      uploadedSize += chunk.size;
    }

    // 3. Complete Multipart Upload
    await instance.post('/api/docs/upload/complete', {
      upload_id: uploadId,
      parts: parts,
    });

    return { ok: true };
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
