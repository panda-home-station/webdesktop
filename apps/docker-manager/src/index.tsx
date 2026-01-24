import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../../src/api/client'
import { Sidebar } from '../../../src/components/Sidebar'
import Icon from '@mdi/react'
import { mdiViewGridOutline, mdiCubeOutline, mdiTableColumn, mdiImageFilterNone, mdiDatabase, mdiCogOutline, mdiMagnify } from '@mdi/js'

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

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cs, ims] = await Promise.all([
        api.dockerListContainers(),
        api.dockerListImages()
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
    await api.dockerStart(id)
    await loadAll()
  }
  const onStop = async (id: string) => {
    await api.dockerStop(id)
    await loadAll()
  }
  const onRestart = async (id: string) => {
    await api.dockerRestart(id)
    await loadAll()
  }
  const onRemove = async (id: string) => {
    if (!confirm('确认删除该容器？这将强制删除。')) return
    await api.dockerRemove(id)
    await loadAll()
  }
  const onPull = async () => {
    if (!pullName) return
    setPulling(true)
    try {
      await api.dockerPull(pullName, pullTag || undefined)
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
      <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
        <div style={{ padding: 20 }}>
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
              <div style={{ color: '#6b7280' }}>这里用于管理 Docker Compose 项目（后续功能）。</div>
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
                    className="puter-input"
                    style={{ width: 220, height: 30, padding: '0 8px', boxSizing: 'border-box' }}
                  />
                  <button className="puter-button" title="搜索" style={{ width: 36, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon path={mdiMagnify} size={0.9} />
                  </button>
                  <button className="puter-button" title="设置" style={{ width: 36, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon path={mdiCogOutline} size={0.9} />
                  </button>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
