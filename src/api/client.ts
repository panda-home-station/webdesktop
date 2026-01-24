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

type ChecksumEntry = { hex: string; ts: number }
const checksumCache = new Map<string, ChecksumEntry>()
const CHECKSUM_CACHE_KEY = 'checksumCache'
const MAX_CHECKSUM_CACHE = 200
function checksumKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}
function getCachedChecksum(file: File): string | undefined {
  const e = checksumCache.get(checksumKey(file))
  return e ? e.hex : undefined
}
function setCachedChecksum(file: File, hex: string) {
  const key = checksumKey(file)
  const now = Date.now()
  checksumCache.set(key, { hex, ts: now })
  try {
    if (checksumCache.size > MAX_CHECKSUM_CACHE) {
      const arr = Array.from(checksumCache.entries()).sort((a, b) => a[1].ts - b[1].ts)
      const removeCount = Math.max(0, checksumCache.size - MAX_CHECKSUM_CACHE)
      for (let i = 0; i < removeCount; i++) {
        checksumCache.delete(arr[i][0])
      }
    }
    const obj: Record<string, ChecksumEntry> = {}
    for (const [k, v] of checksumCache.entries()) obj[k] = v
    localStorage.setItem(CHECKSUM_CACHE_KEY, JSON.stringify(obj))
  } catch {}
}

try {
  const raw = localStorage.getItem(CHECKSUM_CACHE_KEY)
  if (raw) {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        const v = obj[k]
        if (v && typeof v.hex === 'string' && typeof v.ts === 'number') {
          checksumCache.set(k, v)
        }
      }
    }
  }
} catch {}

type SessionEntry = { session_id: string; ts: number }
const uploadSessions = new Map<string, SessionEntry>()
const UPLOAD_SESS_KEY = 'uploadSessions'
function sessKey(path: string, name: string, size: number, checksum?: string) {
  return `${path}:${name}:${size}:${checksum || ''}`
}
function setUploadSession(path: string, name: string, size: number, checksum: string | undefined, session_id: string) {
  const key = sessKey(path, name, size, checksum)
  uploadSessions.set(key, { session_id, ts: Date.now() })
  try {
    const obj: Record<string, SessionEntry> = {}
    for (const [k, v] of uploadSessions.entries()) obj[k] = v
    localStorage.setItem(UPLOAD_SESS_KEY, JSON.stringify(obj))
  } catch {}
}
function getUploadSession(path: string, name: string, size: number, checksum: string | undefined): string | undefined {
  const key = sessKey(path, name, size, checksum)
  const e = uploadSessions.get(key)
  return e?.session_id
}
function clearUploadSession(path: string, name: string, size: number, checksum: string | undefined) {
  const key = sessKey(path, name, size, checksum)
  uploadSessions.delete(key)
  try {
    const obj: Record<string, SessionEntry> = {}
    for (const [k, v] of uploadSessions.entries()) obj[k] = v
    localStorage.setItem(UPLOAD_SESS_KEY, JSON.stringify(obj))
  } catch {}
}
try {
  const raw = localStorage.getItem(UPLOAD_SESS_KEY)
  if (raw) {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object') {
      for (const k of Object.keys(obj)) {
        const v = obj[k]
        if (v && typeof v.session_id === 'string' && typeof v.ts === 'number') {
          uploadSessions.set(k, v)
        }
      }
    }
  }
} catch {}
let activeChecksumWorkers = 0
const MAX_CHECKSUM_WORKERS = 2
const workerWaiters: Array<() => void> = []
function acquireWorkerSlot(signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const tryAcquire = () => {
      if (activeChecksumWorkers < MAX_CHECKSUM_WORKERS) {
        activeChecksumWorkers++
        resolve()
      } else {
        workerWaiters.push(tryAcquire)
      }
    }
    if (signal && signal.aborted) {
      resolve()
      return
    }
    tryAcquire()
  })
}
function releaseWorkerSlot() {
  activeChecksumWorkers = Math.max(0, activeChecksumWorkers - 1)
  const next = workerWaiters.shift()
  if (next) next()
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
async function uploadFormWithRetry(fd: FormData, signal: AbortSignal | undefined, onUploadProgress: ((e: any) => void) | undefined, attempts = 3, baseDelay = 1000) {
  let lastErr: any = null
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await axios.post(`${base}/api/docs/upload`, fd, {
        signal,
        onUploadProgress
      })
      return r
    } catch (e: any) {
      lastErr = e
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        throw e
      }
      if (i < attempts - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await sleep(delay)
        continue
      } else {
        throw e
      }
    }
  }
  throw lastErr
}
function createChecksumJob(file: File, opts?: { signal?: AbortSignal; chunkSize?: number }) {
  let worker: Worker | null = null
  let finished = false
  const promise: Promise<string | undefined> = new Promise((resolve) => {
    try {
      const start = async () => {
        await acquireWorkerSlot(opts?.signal)
        if (opts?.signal && opts.signal.aborted) {
          if (!finished) {
            finished = true
            resolve(undefined)
          }
          releaseWorkerSlot()
          return
        }
        worker = new Worker(new URL('../workers/hashWorker.ts', import.meta.url), { type: 'module' })
        const onAbort = () => {
          if (worker) {
            worker.terminate()
            worker = null
          }
          releaseWorkerSlot()
          if (!finished) {
            finished = true
            resolve(undefined)
          }
        }
        if (opts?.signal) {
          if (opts.signal.aborted) onAbort()
          else opts.signal.addEventListener('abort', onAbort, { once: true })
        }
        worker.onmessage = (e) => {
          const d = e.data
          if (d && d.type === 'result') {
            if (opts?.signal) opts.signal.removeEventListener('abort', onAbort)
            if (worker) {
              worker.terminate()
              worker = null
            }
            releaseWorkerSlot()
            if (!finished) {
              finished = true
              resolve(d.ok ? d.hex : undefined)
            }
          }
        }
        worker.onerror = () => {
          if (opts?.signal) opts.signal.removeEventListener('abort', onAbort)
          if (worker) {
            worker.terminate()
            worker = null
          }
          releaseWorkerSlot()
          if (!finished) {
            finished = true
            resolve(undefined)
          }
        }
        worker.postMessage({ type: 'sha256', file, chunkSize: opts?.chunkSize })
      }
      start()
    } catch {
      ;(async () => {
        try {
          const buf = await file.arrayBuffer()
          const digest = await crypto.subtle.digest('SHA-256', buf)
          const view = new Uint8Array(digest)
          let hex = ''
          for (let i = 0; i < view.length; i++) {
            hex += view[i].toString(16).padStart(2, '0')
          }
          resolve(hex)
        } catch {
          resolve(undefined)
        }
      })()
    }
  })
  const cancel = () => {
    if (worker) {
      worker.terminate()
      worker = null
    }
    releaseWorkerSlot()
  }
  return { promise, cancel }
}

export const api = {
  async health() {
    try {
      const r = await axios.get(`${base}/health`)
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
  async getWallpaper(): Promise<string> {
    try {
      const r = await axios.get(`${base}/api/user/wallpaper`)
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
  getWallpaperCached(): string {
    return currentWallpaper
  },
  async setWallpaper(path: string | null) {
    try {
      await axios.post(`${base}/api/user/wallpaper`, { path: path || '' })
      currentWallpaper = path || ''
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },
  async fsList(path: string) {
    try {
      const r = await axios.get(`${base}/api/docs/list`, { params: { path, limit: 200 } })
      offline = false
      return r.data as FsListResp
    } catch {
      offline = true
      return getMockList(path)
    }
  },
  async fsListPage(path: string, offset: number, limit = 500) {
    const r = await axios.get(`${base}/api/docs/list`, { params: { path, offset, limit } })
    return r.data as FsListResp
  },
  async fsMkdir(path: string) {
    try {
      const r = await axios.post(`${base}/api/docs/mkdir`, { path })
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
      const r = await axios.delete(`${base}/api/docs/delete`, { params: { path } })
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
  async fsUpload(path: string, file: File, onProgress?: (info: { percent: number; loaded: number; total: number; bps?: number }) => void, signal?: AbortSignal, offset: number = 0) {
    try {
      try {
        const rr = await axios.post(`${base}/api/docs/rapid-upload`, {
          path,
          name: file.name,
          size: file.size
        })
        const rapid = (rr.data as any)?.rapid
        if (rapid) {
          offline = false
          if (onProgress) onProgress({ percent: 100, loaded: file.size, total: file.size, bps: undefined })
          return { ok: true }
        }
      } catch {}
      let checksumForForm = getCachedChecksum(file)
      let checksumJob: { promise: Promise<string | undefined>; cancel: () => void } | null = null
      if (!checksumForForm) {
        const chunkSize =
          file.size <= 128 * 1024 * 1024 ? 2 * 1024 * 1024 :
          file.size <= 1024 * 1024 * 1024 ? 4 * 1024 * 1024 :
          8 * 1024 * 1024
        checksumJob = createChecksumJob(file, { signal, chunkSize })
        checksumForForm = await checksumJob.promise
        if (checksumForForm) setCachedChecksum(file, checksumForForm)
      }
      if (checksumForForm) {
        try {
          const tryRapidWithChecksum = async () =>
            axios.post(`${base}/api/docs/rapid-upload`, {
              path,
              name: file.name,
              size: file.size,
              checksum: checksumForForm
            })
          let rr = await tryRapidWithChecksum()
          let rapid = (rr.data as any)?.rapid
          if (!rapid) {
            await new Promise(res => setTimeout(res, 800))
            rr = await tryRapidWithChecksum()
            rapid = (rr.data as any)?.rapid
          }
          if (rapid) {
            if (checksumJob) checksumJob.cancel()
            offline = false
            if (onProgress) onProgress({ percent: 100, loaded: file.size, total: file.size, bps: undefined })
            return { ok: true }
          }
        } catch {}
      }
      if (checksumJob) checksumJob.cancel()
      const LARGE_UPLOAD_THRESHOLD = 512 * 1024 * 1024
      const baseChunk =
        file.size <= 128 * 1024 * 1024 ? 4 * 1024 * 1024 :
        file.size <= 1024 * 1024 * 1024 ? 8 * 1024 * 1024 :
        16 * 1024 * 1024
      if (file.size >= LARGE_UPLOAD_THRESHOLD) {
        let sessionId: string | undefined = getUploadSession(path, file.name, file.size, checksumForForm)
        if (!sessionId) {
          try {
            const init = await api.fsUploadInit(path, file.name, file.size, checksumForForm)
            sessionId = (init as any)?.session_id
            if (sessionId) setUploadSession(path, file.name, file.size, checksumForForm, sessionId)
          } catch {}
        }
        let resume = 0
        if (sessionId) {
          try {
            const st = await api.fsUploadStatus(sessionId)
            resume = st?.uploaded || 0
          } catch {}
        }
        let pos = Math.max(offset, resume)
        if (onProgress) onProgress({ percent: Math.round(pos / file.size * 100), loaded: pos, total: file.size, bps: 0 })
        const ranges: [number, number][] = []
        for (let start = pos; start < file.size; start += baseChunk) {
          const end = Math.min(start + baseChunk, file.size)
          ranges.push([start, end])
        }
        const maxConcurrent = 2
        let inFlight = 0
        let idx = 0
        let completed = pos
        const partial = new Map<number, number>()
        async function runNext() {
          if (idx >= ranges.length) return
          const myIdx = idx++
          const [start, end] = ranges[myIdx]
          inFlight++
          const fd = new FormData()
          fd.append('path', path)
          fd.append('size', String(file.size))
          if (checksumForForm) fd.append('checksum', checksumForForm)
          fd.append('offset', String(start))
          if (sessionId) fd.append('session_id', sessionId)
          fd.append('file', file.slice(start, end), file.name)
          partial.set(myIdx, 0)
          let lastTs = Date.now()
          let lastLoaded = 0
          try {
            await uploadFormWithRetry(fd, signal, (e) => {
              if (onProgress && e.loaded != null) {
                const now = Date.now()
                const dt = Math.max(1, now - lastTs)
                const dbytes = Math.max(0, e.loaded - lastLoaded)
                const bps = (dbytes / dt) * 1000
                lastLoaded = e.loaded
                lastTs = now
                partial.set(myIdx, e.loaded)
                let sumPartial = 0
                for (const v of partial.values()) sumPartial += v
                const loaded = completed + sumPartial
                const pct = file.size > 0 ? Math.round((loaded / file.size) * 100) : 0
                onProgress({ percent: pct, loaded, total: file.size, bps })
              }
            }, 3, 1000)
            completed += (end - start)
            partial.delete(myIdx)
            let sumPartial = 0
            for (const v of partial.values()) sumPartial += v
            if (onProgress) {
              const loaded = completed + sumPartial
              const pct = file.size > 0 ? Math.round((loaded / file.size) * 100) : 0
              onProgress({ percent: pct, loaded, total: file.size, bps: undefined })
            }
          } finally {
            inFlight--
            if (idx < ranges.length) await runNext()
          }
        }
        const starters = Math.min(maxConcurrent, ranges.length)
        const tasks: Promise<void>[] = []
        for (let i = 0; i < starters; i++) tasks.push(runNext())
        await Promise.all(tasks)
        try {
          const fin = await api.fsUploadFinalize(path, file.name, file.size, checksumForForm)
          if (sessionId) clearUploadSession(path, file.name, file.size, checksumForForm)
          offline = false
          return fin
        } catch {
          offline = false
          return { ok: true }
        }
      } else {
        const fd = new FormData()
        fd.append('path', path)
        fd.append('size', String(file.size))
        if (checksumForForm) fd.append('checksum', checksumForForm)
        if (offset > 0) {
          fd.append('offset', String(offset))
          try {
            const init = await api.fsUploadInit(path, file.name, file.size, checksumForForm)
            const sid = (init as any)?.session_id
            if (sid) fd.append('session_id', sid)
          } catch {}
          fd.append('file', file.slice(offset), file.name)
        } else {
          fd.append('file', file)
        }
        let lastLoaded = 0
        let lastTs = Date.now()
        if (onProgress) onProgress({ percent: Math.round(offset / file.size * 100), loaded: offset, total: file.size, bps: 0 })
        const r = await uploadFormWithRetry(fd, signal, (e) => {
          if (onProgress && e.loaded != null) {
            const now = Date.now()
            const dt = Math.max(1, now - lastTs)
            const dbytes = Math.max(0, e.loaded - lastLoaded)
            const bps = (dbytes / dt) * 1000
            lastLoaded = e.loaded
            lastTs = now
            const realLoaded = offset + e.loaded
            const total = file.size
            const pct = total > 0 ? Math.round((realLoaded / total) * 100) : 0
            onProgress({ percent: pct, loaded: realLoaded, total, bps })
          }
        }, 3, 1000)
        try {
          const fin = await api.fsUploadFinalize(path, file.name, file.size, checksumForForm)
          offline = false
          return fin
        } catch {
          offline = false
          return r.data as { ok: boolean }
        }
      }
    } catch (e: any) {
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        throw e
      }
      offline = true
      throw e
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
  async fsUploadFinalize(path: string, name: string, size: number, checksum?: string) {
    try {
      const r = await axios.post(`${base}/api/docs/upload/finalize`, { path, name, size, checksum })
      return r.data as { ok: boolean }
    } catch {
      return { ok: true }
    }
  },
  async fsUploadInit(path: string, name: string, size: number, checksum?: string) {
    try {
      const r = await axios.post(`${base}/api/docs/upload/init`, { path, name, size, checksum })
      return r.data as { ok: boolean; session_id?: string }
    } catch {
      return { ok: true }
    }
  },
  async fsUploadStatus(session_id: string) {
    try {
      const r = await axios.get(`${base}/api/docs/upload/status`, { params: { session_id } })
      return r.data as { uploaded: number }
    } catch {
      return { uploaded: 0 }
    }
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
  async deleteTask(id: string) {
    try {
      await axios.post(`${base}/api/tasks/delete`, { id })
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
  async dockerMirrorsGet() {
    const r = await axios.get(`${base}/api/docker/mirrors`)
    return (Array.isArray(r.data) ? r.data : []) as { id: string; name: string; host: string; enabled: boolean }[]
  },
  async dockerMirrorsSet(items: { id: string; name: string; host: string; enabled: boolean }[]) {
    const r = await axios.post(`${base}/api/docker/mirrors`, items)
    return r.status === 200
  },
  async dockerSettingsGet() {
    const r = await axios.get(`${base}/api/docker/settings`)
    return r.data as { mode: string; host?: string }
  },
  async dockerSettingsSet(mode: string, host?: string) {
    const r = await axios.post(`${base}/api/docker/settings`, { mode, host })
    return r.status === 200
  },
  async dockerRegistrySearch(q: string, page = 1, pageSize = 24) {
    const r = await axios.get(`${base}/api/docker/registry/search`, { params: { q, page, page_size: pageSize } })
    const data = r.data as { results: { name: string; namespace?: string; description?: string; star_count?: number; pull_count?: number; is_official?: boolean }[]; next?: boolean; prev?: boolean }
    return {
      items: Array.isArray(data.results) ? data.results : [],
      hasNext: !!data.next,
      hasPrev: !!data.prev
    }
  },
  async dockerRegistryHot(page = 1, pageSize = 24) {
    const r = await axios.get(`${base}/api/docker/registry/hot`, { params: { page, page_size: pageSize } })
    const data = r.data as { results: { name: string; namespace?: string; description?: string; star_count?: number; pull_count?: number; is_official?: boolean }[]; next?: boolean; prev?: boolean }
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
