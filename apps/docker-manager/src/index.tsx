import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Sidebar } from '../../../src/components/Sidebar'
import Icon from '@mdi/react'
import { mdiViewGridOutline, mdiCubeOutline, mdiTableColumn, mdiImageFilterNone, mdiDatabase, mdiCogOutline, mdiMagnify, mdiOpenInNew } from '@mdi/js'

type Container = {
  id: string
  names: string[]
  image: string
  state: string
  status?: string
  created: number
  ports: [number, number | null, string | null][]
}

type Image = {
  id: string
  repo_tags: string[]
  size: number
  created: number
}

const TABS = [
  { id: 'overview', label: '概览', icon: <Icon path={mdiViewGridOutline} size={1} /> },
  { id: 'containers', label: '容器', icon: <Icon path={mdiCubeOutline} size={1} /> },
  { id: 'compose', label: 'compose', icon: <Icon path={mdiTableColumn} size={1} /> },
  { id: 'local-images', label: '本地镜像', icon: <Icon path={mdiImageFilterNone} size={1} /> },
  { id: 'registry', label: '镜像仓库', icon: <Icon path={mdiDatabase} size={1} /> }
]

export default function DockerManager() {
  const [active, setActive] = useState('overview')
  const [containers, setContainers] = useState<Container[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [pullName, setPullName] = useState('')
  const [pullTag, setPullTag] = useState('latest')
  const [registryQ, setRegistryQ] = useState('')
  const [registryItems, setRegistryItems] = useState<any[]>([])
  const [registryLoading, setRegistryLoading] = useState(false)
  const [hotItems, setHotItems] = useState<any[]>([])
  const [didSearch, setDidSearch] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mirrors, setMirrors] = useState<{ id: string; name: string; host: string; enabled: boolean }[]>([])
  const [newName, setNewName] = useState('')
  const [newHost, setNewHost] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const podmanApi = {
    async listContainers() {
      const token = localStorage.getItem('authToken') || ''
      const r = await axios.get('/api/podman/containers', { params: token ? { token } : {} })
      return r.data as Container[]
    },
    async listImages() {
      const token = localStorage.getItem('authToken') || ''
      const r = await axios.get('/api/podman/images', { params: token ? { token } : {} })
      return r.data as Image[]
    },
    async start(id: string) {
      const token = localStorage.getItem('authToken') || ''
      await axios.post('/api/podman/container/start', { id }, { params: token ? { token } : {} })
    },
    async stop(id: string) {
      const token = localStorage.getItem('authToken') || ''
      await axios.post('/api/podman/container/stop', { id }, { params: token ? { token } : {} })
    },
    async restart(id: string) {
      const token = localStorage.getItem('authToken') || ''
      await axios.post('/api/podman/container/restart', { id }, { params: token ? { token } : {} })
    },
    async remove(id: string) {
      const token = localStorage.getItem('authToken') || ''
      await axios.post('/api/podman/container/remove', { id }, { params: token ? { token } : {} })
    },
    async pull(image: string, tag?: string) {
      const token = localStorage.getItem('authToken') || ''
      await axios.post('/api/podman/image/pull', { image, tag }, { params: token ? { token } : {} })
    },
    async mirrorsGet() {
      const token = localStorage.getItem('authToken') || ''
      const r = await axios.get('/api/podman/mirrors', { params: token ? { token } : {} })
      return (Array.isArray(r.data) ? r.data : []) as { id: string; name: string; host: string; enabled: boolean }[]
    },
    async mirrorsSet(items: { id: string; name: string; host: string; enabled: boolean }[]) {
      const token = localStorage.getItem('authToken') || ''
      await axios.post('/api/podman/mirrors', items, { params: token ? { token } : {} })
    },
    async registrySearch(q: string, page = 1, pageSize = 24) {
      const token = localStorage.getItem('authToken') || ''
      const r = await axios.get('/api/podman/registry/search', { params: { q, page, page_size: pageSize, ...(token ? { token } : {}) } })
      const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
      return {
        items: Array.isArray(data.results) ? data.results : [],
        hasNext: !!data.next,
        hasPrev: !!data.prev
      }
    },
    async registryHot(page = 1, pageSize = 24) {
      const token = localStorage.getItem('authToken') || ''
      const r = await axios.get('/api/podman/registry/hot', { params: { page, page_size: pageSize, ...(token ? { token } : {}) } })
      const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
      return {
        items: Array.isArray(data.results) ? data.results : [],
        hasNext: !!data.next,
        hasPrev: !!data.prev
      }
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cs, ims] = await Promise.all([
        podmanApi.listContainers(),
        podmanApi.listImages()
      ])
      setContainers(cs)
      setImages(ims)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll().catch(console.error)
  }, [])
  const onSearchRegistry = async () => {
    const q = registryQ.trim()
    if (!q) {
      setDidSearch(false)
      setRegistryItems([])
      setPage(1)
      return
    }
    setDidSearch(true)
    setPage(1)
    setRegistryLoading(true)
    try {
      const { items, hasNext, hasPrev } = await podmanApi.registrySearch(q, 1)
      setRegistryItems(items as any[])
      setHasNext(hasNext)
      setHasPrev(hasPrev)
    } finally {
      setRegistryLoading(false)
    }
  }
  useEffect(() => {
    if (active === 'registry') {
      setDidSearch(false)
      setPage(1)
    }
  }, [active])
  useEffect(() => {
    if (active === 'registry' && !didSearch) {
      setRegistryLoading(true)
      podmanApi.registryHot(page)
        .then(({ items, hasNext, hasPrev }) => {
          setHotItems(items as any[])
          setHasNext(hasNext)
          setHasPrev(hasPrev)
        })
        .finally(() => setRegistryLoading(false))
    }
  }, [active, didSearch, page])
  const openSettings = async () => {
    setSettingsOpen(true)
    setSettingsLoading(true)
    try {
      const items = await podmanApi.mirrorsGet()
      setMirrors(Array.isArray(items) ? items : [])
    } catch {
      setMirrors([])
    } finally {
      setSettingsLoading(false)
    }
  }
  const saveSettings = async () => {
    setSettingsSaving(true)
    try {
      await podmanApi.mirrorsSet(mirrors)
      setSettingsOpen(false)
    } finally {
      setSettingsSaving(false)
    }
  }
  const onAddMirror = () => {
    const id = Math.random().toString(36).slice(2)
    setMirrors(prev => [...prev, { id, name: '', host: '', enabled: true }])
  }
  const onRemoveMirror = (id: string) => {
    setMirrors(prev => prev.filter(m => m.id !== id))
  }
  const onToggleMirror = (id: string) => {
    setMirrors(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  }
  const onUpdateMirror = (id: string, patch: Partial<{ name: string; host: string }>) => {
    setMirrors(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
  }
  const onPagePrev = async () => {
    if (page <= 1 || registryLoading) return
    const newPage = page - 1
    setRegistryLoading(true)
    try {
      if (didSearch) {
        const { items, hasNext, hasPrev } = await podmanApi.registrySearch(registryQ.trim(), newPage)
        setRegistryItems(items as any[])
        setHasNext(hasNext)
        setHasPrev(hasPrev)
      } else {
        const { items, hasNext, hasPrev } = await podmanApi.registryHot(newPage)
        setHotItems(items as any[])
        setHasNext(hasNext)
        setHasPrev(hasPrev)
      }
      setPage(newPage)
    } finally {
      setRegistryLoading(false)
    }
  }
  const onPageNext = async () => {
    if (!hasNext || registryLoading) return
    const newPage = page + 1
    setRegistryLoading(true)
    try {
      if (didSearch) {
        const { items, hasNext, hasPrev } = await podmanApi.registrySearch(registryQ.trim(), newPage)
        setRegistryItems(items as any[])
        setHasNext(hasNext)
        setHasPrev(hasPrev)
      } else {
        const { items, hasNext, hasPrev } = await podmanApi.registryHot(newPage)
        setHotItems(items as any[])
        setHasNext(hasNext)
        setHasPrev(hasPrev)
      }
      setPage(newPage)
    } finally {
      setRegistryLoading(false)
    }
  }
  const pullFromRegistry = async (ref: string) => {
    if (!ref) return
    setPulling(true)
    try {
      await podmanApi.pull(ref)
      await loadAll()
      setActive('local-images')
    } finally {
      setPulling(false)
    }
  }

  const fmtSize = (n: number) => {
    if (n < 1024) return `${n} B`
    const units = ['KB', 'MB', 'GB', 'TB']
    let v = n
    let i = 0
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024
      i++
    }
    return `${v.toFixed(1)} ${units[i]}`
  }

  const onStart = async (id: string) => {
    await podmanApi.start(id)
    await loadAll()
  }
  const onStop = async (id: string) => {
    await podmanApi.stop(id)
    await loadAll()
  }
  const onRestart = async (id: string) => {
    await podmanApi.restart(id)
    await loadAll()
  }
  const onRemove = async (id: string) => {
    if (!confirm('确认删除该容器？这将强制删除。')) return
    await podmanApi.remove(id)
    await loadAll()
  }
  const onPull = async () => {
    if (!pullName) return
    setPulling(true)
    try {
      await podmanApi.pull(pullName, pullTag || undefined)
      await loadAll()
      setPullName('')
      setPullTag('latest')
    } finally {
      setPulling(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'system-ui, sans-serif', color: '#1f2937' }} className="noselect">
      <Sidebar
        width={220}
        items={TABS}
        activeId={active}
        onSelect={setActive}
      />
      <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 0 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {active === 'overview' ? (
            <>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>概览</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#f9fafb' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>运行中的容器</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{containers.filter(c => c.state === 'running').length}</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#f9fafb' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>容器总数</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{containers.length}</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#f9fafb' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>本地镜像</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{images.length}</div>
                </div>
              </div>
              {loading && <div style={{ marginTop: 12, color: '#6b7280' }}>加载中…</div>}
            </>
          ) : active === 'containers' ? (
            <>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>容器</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {containers.map(c => (
                  <div key={c.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{(c.names && c.names[0]) || c.id.slice(0, 12)}</div>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>{c.image}</div>
                      </div>
                      <div style={{ fontSize: 12, color: c.state === 'running' ? '#10b981' : '#ef4444' }}>
                        {c.state}{c.status ? ` · ${c.status}` : ''}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="puter-button" onClick={() => onStart(c.id)} disabled={c.state === 'running'}>启动</button>
                      <button className="puter-button" onClick={() => onStop(c.id)} disabled={c.state !== 'running'}>停止</button>
                      <button className="puter-button" onClick={() => onRestart(c.id)} disabled={c.state !== 'running'}>重启</button>
                      <button className="puter-button danger" onClick={() => onRemove(c.id)}>删除</button>
                    </div>
                    {c.ports?.length ? (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                        端口：{c.ports.map(([priv, pub, typ], i) => (
                          <span key={i} style={{ marginRight: 8 }}>{typ || 'tcp'} {pub ? `${pub}→${priv}` : `${priv}`}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              {containers.length === 0 && (
                <div style={{ color: '#6b7280' }}>没有容器</div>
              )}
            </>
          ) : active === 'compose' ? (
            <>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>compose</h2>
              <div style={{ color: '#6b7280' }}>这里用于管理 Podman Compose 项目（后续功能）。</div>
            </>
          ) : active === 'local-images' ? (
            <>
              <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 600 }}>本地镜像</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {images.map(img => (
                  <div key={img.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#f9fafb' }}>
                    <div style={{ fontWeight: 600 }}>{(img.repo_tags && img.repo_tags[0]) || img.id.slice(0, 12)}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>
                      大小 {fmtSize(img.size)}
                    </div>
                  </div>
                ))}
              </div>
              {images.length === 0 && (
                <div style={{ color: '#6b7280' }}>没有本地镜像</div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 16px 0' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>镜像仓库</h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input
                    placeholder="搜索镜像"
                    value={registryQ}
                    onChange={e => setRegistryQ(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') onSearchRegistry()
                    }}
                    className="puter-input"
                    style={{ width: 220, height: 30, padding: '0 8px', boxSizing: 'border-box' }}
                  />
                  <button className="puter-button" title="搜索" style={{ width: 36, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={onSearchRegistry} disabled={registryLoading}>
                    <Icon path={mdiMagnify} size={0.9} />
                  </button>
                  <button className="puter-button" title="设置" style={{ width: 36, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={openSettings}>
                    <Icon path={mdiCogOutline} size={0.9} />
                  </button>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {registryLoading && <div style={{ color: '#6b7280' }}>加载中…</div>}
                  {!registryLoading && (didSearch ? registryItems.length > 0 : hotItems.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      {(didSearch ? registryItems : hotItems).map((it: any, idx: number) => {
                        const name = it?.name || ''
                        const ns = it?.namespace || ''
                        const stars = typeof it?.star_count === 'number' ? it.star_count : 0
                        const pulls = typeof it?.pull_count === 'number' ? it.pull_count : 0
                        const official = !!it?.is_official
                        const ref = official ? name : (ns && name ? `${ns}/${name}` : name)
                        return (
                          <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>{ref}</span>
                              {official && <span style={{ fontSize: 12, color: '#10b981' }}>官方</span>}
                              <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>⭐ {stars} · ⬇️ {pulls}</span>
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                              <button className="puter-button" onClick={() => pullFromRegistry(ref)} disabled={pulling} style={{ padding: '4px 10px', height: 28 }}>下载</button>
                              <button
                                className="puter-button"
                                title="打开镜像页面"
                                onClick={() => {
                                  const href = official
                                    ? `https://hub.docker.com/_/${name}`
                                    : (ns ? `https://hub.docker.com/r/${ns}/${name}` : `https://hub.docker.com/_/${name}`)
                                  window.open(href, '_blank')
                                }}
                                style={{ padding: '4px 10px', height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Icon path={mdiOpenInNew} size={0.8} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {!registryLoading && (didSearch ? registryItems.length === 0 : hotItems.length === 0) && (
                    <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 40 }}>
                      {'镜像加载失败或连接超时'}
                    </div>
                  )}
                </div>
              </div>
              {settingsOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 460, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>镜像仓库设置</div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 8 }}>镜像加速源</div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 80px', gap: 8, alignItems: 'center', fontSize: 13, color: '#6b7280' }}>
                          <div style={{ fontWeight: 600, color: '#374151' }}>名称</div>
                          <div style={{ fontWeight: 600, color: '#374151' }}>镜像域名</div>
                          <div></div>
                        </div>
                        {mirrors.map(m => (
                          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 80px', gap: 8, alignItems: 'center', marginTop: 6 }}>
                            <input className="puter-input" value={m.name} onChange={e => onUpdateMirror(m.id, { name: e.target.value })} placeholder="名称（可选）" style={{ height: 28, padding: '0 8px' }} />
                            <input className="puter-input" value={m.host} onChange={e => onUpdateMirror(m.id, { host: e.target.value })} placeholder="镜像域名，如 mirror.example.com" style={{ height: 28, padding: '0 8px' }} />
                            <button className="puter-button danger" onClick={() => onRemoveMirror(m.id)} style={{ height: 28 }}>删除</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="puter-button" onClick={onAddMirror} style={{ height: 30 }}>添加</button>
                      </div>
                    </div>
                    <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="puter-button" onClick={() => setSettingsOpen(false)} disabled={settingsSaving}>取消</button>
                      <button className="puter-button" onClick={saveSettings} disabled={settingsSaving}>保存</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      {active === 'registry' && (
        <div style={{ height: 36, display: 'flex', alignItems: 'center', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 14 }}>第 {page} 页</span>
          <button className="puter-button" onClick={onPagePrev} disabled={!hasPrev || page <= 1 || registryLoading} style={{ marginLeft: 8, padding: '4px 10px', height: 28, display: 'inline-flex', alignItems: 'center' }}>上一页</button>
          <button className="puter-button" onClick={onPageNext} disabled={!hasNext || registryLoading} style={{ marginLeft: 8, padding: '4px 10px', height: 28, display: 'inline-flex', alignItems: 'center' }}>下一页</button>
        </div>
      )}
      </div>
    </div>
  )
}
