import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../../src/api/client'
import { pushFileTask, updateFileTask } from '../../../src/sdk/desktop'

export default function FileManager() {
  const [path, setPath] = useState<string>('/')
  const [entries, setEntries] = useState<
    { name: string; is_dir: boolean; size: number; modified_ts: number }[]
  >([])
  const [loading, setLoading] = useState<boolean>(false)
  const [active, setActive] = useState<string>('home')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [sortKey, setSortKey] = useState<'name' | 'size' | 'modified_ts'>('name')
  const [q, setQ] = useState<string>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [navHist, setNavHist] = useState<string[]>(['/'])
  const [navIndex, setNavIndex] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const r = await api.fsList(path)
        if (!mounted) return
        setEntries(r.entries)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [path])
  const navigate = (to: string) => {
    const target = to || '/'
    setSelected(new Set())
    if (navHist[navIndex] !== target) {
      const nextHist = [...navHist.slice(0, navIndex + 1), target]
      setNavHist(nextHist)
      setNavIndex(nextHist.length - 1)
    }
    setPath(target)
  }

  const up = useMemo(() => {
    if (path === '/' || path === '') return '/'
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }, [path])

  const crumbs = useMemo(() => {
    const parts = path.split('/').filter(Boolean)
    const acc: { label: string; to: string }[] = [{ label: '根目录', to: '/' }]
    let cur = ''
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : `/${p}`
      acc.push({ label: p, to: cur })
    }
    return acc
  }, [path])

  const fmtTime = (ts: number) => {
    if (!ts) return '-'
    return new Date(ts * 1000).toLocaleString()
  }

  const goto = async (to: string, key: string) => {
    setActive(key)
    if (to !== '/') {
      await api.fsMkdir(to)
    }
    setSelected(new Set())
    if (navHist[navIndex] !== to) {
      const nextHist = [...navHist.slice(0, navIndex + 1), to]
      setNavHist(nextHist)
      setNavIndex(nextHist.length - 1)
    }
    setPath(to)
  }
  const showUploads = () => {}

  const back = () => {
    if (navIndex > 0) {
      const i = navIndex - 1
      setNavIndex(i)
      setPath(navHist[i])
      setSelected(new Set())
    }
  }
  const forward = () => {
    if (navIndex < navHist.length - 1) {
      const i = navIndex + 1
      setNavIndex(i)
      setPath(navHist[i])
      setSelected(new Set())
    }
  }
  const refresh = async () => {
    const r = await api.fsList(path)
    setEntries(r.entries)
  }

  const filtered = useMemo(() => {
    const base = [...entries]
    base.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'size') return (a.size || 0) - (b.size || 0)
      return (a.modified_ts || 0) - (b.modified_ts || 0)
    })
    const qq = q.trim().toLowerCase()
    return qq ? base.filter(e => e.name.toLowerCase().includes(qq)) : base
  }, [entries, sortKey, q])

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set([...prev])
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  const clearSelection = () => setSelected(new Set())
  
  const NavItem = ({ id, icon, label, onClick }: { id: string; icon?: React.ReactNode; label: string; onClick: () => void }) => {
    const isActive = active === id
    return (
      <div
        onClick={() => {
          onClick()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 6,
          cursor: 'pointer',
          background: isActive ? '#eff6ff' : 'transparent',
          color: isActive ? '#2563eb' : '#374151',
          fontWeight: isActive ? 500 : 400,
          marginBottom: 2,
          fontSize: 14,
          transition: 'all 0.2s'
        }}
      >
        {icon && (
          <span style={{ 
            fontSize: 16, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 20,
            opacity: isActive ? 1 : 0.7
          }}>
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div
        style={{
          width: 220,
          borderRight: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, padding: 8, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>文件</div>
          <NavItem id="home" icon="📁" label="我的文件" onClick={() => goto('/', 'home')} />
          <NavItem id="team" icon="👥" label="团队文件" onClick={() => goto('/Team', 'team')} />
          <NavItem id="appdata" icon="⚙️" label="应用文件" onClick={() => goto('/AppData', 'appdata')} />

          <div style={{ height: 8 }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>共享</div>
          <NavItem id="shared-with-me" icon="📨" label="他人共享" onClick={() => goto('/SharedWithMe', 'shared-with-me')} />
          <NavItem id="my-shares" icon="📤" label="我的共享" onClick={() => goto('/MyShares', 'my-shares')} />
          <NavItem id="public-links" icon="🔗" label="外链分享" onClick={() => goto('/PublicLinks', 'public-links')} />

          <div style={{ height: 8 }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>快捷</div>
          <NavItem id="recent" icon="🕒" label="最近访问" onClick={() => goto('/Recent', 'recent')} />
          <NavItem id="favorites" icon="⭐" label="我的收藏" onClick={() => goto('/Favorites', 'favorites')} />

          <div style={{ height: 8 }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '8px 12px' }}>系统</div>
          <NavItem id="trash" icon="🗑️" label="回收站" onClick={() => goto('/Trash', 'trash')} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid var(--win-border)', color: '#111827' }}>
          <div className="button-group">
            <button
              className="puter-button"
              style={{ height: 28, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={back}
              disabled={navIndex === 0}
              title="后退"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="puter-button"
              style={{ height: 28, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={forward}
              disabled={navIndex >= navHist.length - 1}
              title="前进"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <button
            className="puter-button"
            style={{ height: 28, width: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={refresh}
            title="刷新"
          >            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 6v-3l4 4-4 4V8a4 4 0 1 0 4 4h2a6 6 0 1 1-6-6z" fill="currentColor" />
            </svg>
          </button>
          <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                minWidth: 0,
                height: 28,
                padding: '0 6px',
                borderRadius: 8,
                border: '1px solid var(--button-border)',
                background: 'var(--button-bg)'
              }}
            >
              <button
                className="puter-button"
                style={{ height: 28, width: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}
                onClick={() => navigate('/')}
                title="主文件夹"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
                </svg>
              </button>
              {crumbs.slice(1).map((c, i) => (
                <React.Fragment key={`crumb-${i}-${c.to}`}>
                  <span style={{ color: 'var(--muted)', padding: i === 0 ? '0 2px' : '0 6px' }}>{'/'}</span>
                  <button
                    className="puter-button"
                    style={{ height: 28, padding: i === 0 ? '0 6px' : '0 8px', whiteSpace: 'nowrap', maxWidth: '30%', overflow: 'hidden', textOverflow: 'ellipsis', background: 'transparent', border: 'none' }}
                    onClick={() => navigate(c.to)}
                    title={c.label}
                  >
                    {c.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜索"
            style={{ width: 180, height: 28, padding: '0 8px', borderRadius: 8, border: '1px solid var(--button-border)', background: 'var(--button-bg)', color: '#111827' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid var(--win-border)', color: '#111827' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={async (e) => {
              const files = e.target.files
              if (!files || files.length === 0) return
              for (const f of Array.from(files)) {
                const id = `${f.name}-${Date.now()}`
                pushFileTask({ id, kind: 'upload', name: f.name, dir: path, progress: 0, total: f.size, status: 'running' })
                try {
                  await api.fsUpload(path, f, (info) => {
                    updateFileTask(id, { progress: info.percent, total: info.total })
                  })
                  updateFileTask(id, { progress: 100, status: 'done' })
                } catch {
                  updateFileTask(id, { status: 'error' })
                }
              }
              const rs = await api.fsList(path)
              setEntries(rs.entries)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
          />
          <button
            className="puter-button"
            style={{ height: 28 }}
            onClick={() => fileInputRef.current?.click()}
          >
            上传
          </button>
          <button
            className="puter-button"
            style={{ height: 28 }}
            onClick={async () => {
              const name = prompt('新建文件夹名称')
              if (!name) return
              const next = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`
              const r = await api.fsMkdir(next)
              if (r.ok) {
                const rs = await api.fsList(path)
                setEntries(rs.entries)
              }
            }}
          >
            新建文件夹
          </button>
          <button className="puter-button" style={{ height: 28 }} disabled={selected.size === 0 || [...selected].every(n => entries.find(e => e.name === n)?.is_dir)} onClick={async () => {
            const names = [...selected].filter(n => !entries.find(e => e.name === n)?.is_dir)
            if (names.length === 0) return
            const first = names[0]
            const fullPath = path.endsWith('/') ? `${path}${first}` : `${path}/${first}`
            try {
              const blob = await api.fsDownloadBlob(fullPath)
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = first
              a.style.display = 'none'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            } catch {
              alert('下载失败，请稍后重试')
            }
          }}>下载</button>
          <button className="puter-button" style={{ height: 28 }} onClick={async () => {
            const names = [...selected]
            for (const n of names) {
              const p = path.endsWith('/') ? `${path}${n}` : `${path}/${n}`
              const id = `del-${n}-${Date.now()}`
              pushFileTask({ id, kind: 'delete', name: n, dir: path, status: 'running' })
              await api.fsDelete(p)
              updateFileTask(id, { status: 'done' })
            }
            const rs = await api.fsList(path)
            setEntries(rs.entries)
            clearSelection()
          }}>删除</button>
          <button className="puter-button" style={{ height: 28 }} onClick={() => alert('更多功能即将上线')}>更多</button>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <label>排序</label>
            <select value={sortKey} onChange={e => setSortKey(e.target.value as any)} style={{ height: 28 }}>
              <option value="name">名称</option>
              <option value="size">大小</option>
              <option value="modified_ts">时间</option>
            </select>
            <button className="puter-button" style={{ height: 28 }} onClick={() => setView('list')}>列显示</button>
            <button className="puter-button" style={{ height: 28 }} onClick={() => setView('grid')}>大图标显示</button>
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 8, color: '#111827' }}>
          {loading ? (
            <div>加载中…</div>
          ) : view === 'list' ? (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>名称</th>
                  <th style={{ textAlign: 'left' }}>类型</th>
                  <th style={{ textAlign: 'right' }}>大小</th>
                  <th style={{ textAlign: 'right' }}>修改时间</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={`${path}/${e.name}`}
                    style={{ background: selected.has(e.name) ? 'rgba(0,0,0,0.06)' : undefined, cursor: 'pointer' }}
                    onClick={() => toggleSelect(e.name)}
                    onDoubleClick={() => {
                      if (e.is_dir) {
                        const next = path.endsWith('/') ? `${path}${e.name}` : `${path}/${e.name}`
                        setPath(next)
                      }
                    }}
                  >
                    <td>
                      <span style={{ color: e.is_dir ? '#2563eb' : '#111827' }}>{e.name}</span>
                    </td>
                    <td>{e.is_dir ? '目录' : '文件'}</td>
                    <td style={{ textAlign: 'right' }}>{e.is_dir ? '-' : e.size}</td>
                    <td style={{ textAlign: 'right' }}>{fmtTime(e.modified_ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {filtered.map(e => (
                <div
                  key={`${path}/grid-${e.name}`}
                  style={{
                    border: '1px solid var(--win-border)',
                    borderRadius: 10,
                    padding: 10,
                    cursor: 'pointer',
                    background: selected.has(e.name) ? 'rgba(0,0,0,0.06)' : '#fff'
                  }}
                  onClick={() => toggleSelect(e.name)}
                  onDoubleClick={() => {
                    if (e.is_dir) {
                      const next = path.endsWith('/') ? `${path}${e.name}` : `${path}/${e.name}`
                      setPath(next)
                    }
                  }}
                >
                  <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {e.is_dir ? (
                      <svg width="48" height="48" viewBox="0 0 24 24">
                        <linearGradient id="gf2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#f59e0b" />
                          <stop offset="1" stopColor="#fbbf24" />
                        </linearGradient>
                        <path fill="url(#gf2)" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                        <path fill="#fff" fillOpacity="0.35" d="M5 7h6l2 2H5z" />
                      </svg>
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="12" height="16" rx="2" fill="#60a5fa" />
                        <rect x="8" y="8" width="8" height="2" rx="1" fill="#fff" />
                        <rect x="8" y="12" width="8" height="2" rx="1" fill="#fff" />
                        <rect x="8" y="16" width="5" height="2" rx="1" fill="#fff" />
                      </svg>
                    )}
                  </div>
                  <div style={{ marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{e.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
