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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false)
  const [q, setQ] = useState<string>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [navHist, setNavHist] = useState<string[]>(['/'])
  const [navIndex, setNavIndex] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sortButtonRef = useRef<HTMLButtonElement | null>(null)
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

  // 处理点击外部区域关闭排序菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortButtonRef.current && !sortButtonRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortKey === 'size') {
        comparison = (a.size || 0) - (b.size || 0)
      } else {
        comparison = (a.modified_ts || 0) - (b.modified_ts || 0)
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    const qq = q.trim().toLowerCase()
    return qq ? base.filter(e => e.name.toLowerCase().includes(qq)) : base
  }, [entries, sortKey, sortOrder, q])

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
            <div style={{ position: 'relative' }} ref={sortButtonRef}>
              <button 
                className="puter-button" 
                style={{ height: 28, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}
                onClick={() => setShowSortMenu(!showSortMenu)}
                title="排序"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <g clipPath="url(#clip0_18_14325)">
                    <path d="M6 4a1 1 0 112 0v13.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.338.068l-.076-.068-4-4-.069-.076a1 1 0 011.407-1.406l.076.068L6 17.586V4zm9 7a1 1 0 110 2h-4a1 1 0 110-2h4zm3-4a1 1 0 010 2h-7a1 1 0 110-2h7zm3-4a1 1 0 010 2H11a1 1 0 110-2h10z"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_18_14325">
                      <rect width="24" height="24"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </button>
              
              {showSortMenu && (
                <ul 
                  role="menu" 
                  aria-orientation="vertical" 
                  className="semi-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    minWidth: 120,
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    padding: '4px 0',
                    margin: '4px 0',
                    zIndex: 1000,
                    listStyle: 'none'
                  }}
                >
                  {/* 排序字段选项 */}
                  <li 
                    role="menuitem" 
                    tabIndex={0} 
                    aria-disabled="false" 
                    className={`semi-dropdown-item semi-dropdown-item-withTick ${sortKey === 'name' ? 'semi-dropdown-item-active' : ''}`}
                    onClick={() => setSortKey('name')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#111827'
                    }}
                  >
                    <span 
                      role="img" 
                      aria-label="tick" 
                      className="semi-icon semi-icon-default semi-icon-tick"
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 8,
                        color: sortKey === 'name' ? 'currentColor' : 'transparent'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" focusable="false" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd" d="M21.35 4.27c.68.47.86 1.4.38 2.08l-10 14.5a1.5 1.5 0 0 1-2.33.17l-6.5-7a1.5 1.5 0 0 1 2.2-2.04l5.23 5.63 8.94-12.96a1.5 1.5 0 0 1 2.08-.38Z" fill="currentColor"></path>
                      </svg>
                    </span>
                    文件名
                  </li>
                  <li 
                    role="menuitem" 
                    tabIndex={-1} 
                    aria-disabled="false" 
                    className={`semi-dropdown-item semi-dropdown-item-withTick ${sortKey === 'modified_ts' ? 'semi-dropdown-item-active' : ''}`}
                    onClick={() => setSortKey('modified_ts')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#111827'
                    }}
                  >
                    <span 
                      role="img" 
                      aria-label="tick" 
                      className="semi-icon semi-icon-default semi-icon-tick"
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 8,
                        color: sortKey === 'modified_ts' ? 'currentColor' : 'transparent'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" focusable="false" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd" d="M21.35 4.27c.68.47.86 1.4.38 2.08l-10 14.5a1.5 1.5 0 0 1-2.33.17l-6.5-7a1.5 1.5 0 0 1 2.2-2.04l5.23 5.63 8.94-12.96a1.5 1.5 0 0 1 2.08-.38Z" fill="currentColor"></path>
                      </svg>
                    </span>
                    修改时间
                  </li>
                  <li 
                    role="menuitem" 
                    tabIndex={-1} 
                    aria-disabled="false" 
                    className={`semi-dropdown-item semi-dropdown-item-withTick ${sortKey === 'size' ? 'semi-dropdown-item-active' : ''}`}
                    onClick={() => setSortKey('size')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#111827'
                    }}
                  >
                    <span 
                      role="img" 
                      aria-label="tick" 
                      className="semi-icon semi-icon-default semi-icon-tick"
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 8,
                        color: sortKey === 'size' ? 'currentColor' : 'transparent'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" focusable="false" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd" d="M21.35 4.27c.68.47.86 1.4.38 2.08l-10 14.5a1.5 1.5 0 0 1-2.33.17l-6.5-7a1.5 1.5 0 0 1 2.2-2.04l5.23 5.63 8.94-12.96a1.5 1.5 0 0 1 2.08-.38Z" fill="currentColor"></path>
                      </svg>
                    </span>
                    大小
                  </li>
                  
                  {/* 分割线 */}
                  <div className="semi-dropdown-divider" style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }}></div>
                  
                  {/* 排序顺序选项 */}
                  <li 
                    role="menuitem" 
                    tabIndex={-1} 
                    aria-disabled="false" 
                    className={`semi-dropdown-item semi-dropdown-item-withTick ${sortOrder === 'asc' ? 'semi-dropdown-item-active' : ''}`}
                    onClick={() => setSortOrder('asc')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#111827'
                    }}
                  >
                    <span 
                      role="img" 
                      aria-label="tick" 
                      className="semi-icon semi-icon-default semi-icon-tick"
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 8,
                        color: sortOrder === 'asc' ? 'currentColor' : 'transparent'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" focusable="false" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd" d="M21.35 4.27c.68.47.86 1.4.38 2.08l-10 14.5a1.5 1.5 0 0 1-2.33.17l-6.5-7a1.5 1.5 0 0 1 2.2-2.04l5.23 5.63 8.94-12.96a1.5 1.5 0 0 1 2.08-.38Z" fill="currentColor"></path>
                      </svg>
                    </span>
                    升序
                  </li>
                  <li 
                    role="menuitem" 
                    tabIndex={-1} 
                    aria-disabled="false" 
                    className={`semi-dropdown-item semi-dropdown-item-withTick ${sortOrder === 'desc' ? 'semi-dropdown-item-active' : ''}`}
                    onClick={() => setSortOrder('desc')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: '#111827'
                    }}
                  >
                    <span 
                      role="img" 
                      aria-label="tick" 
                      className="semi-icon semi-icon-default semi-icon-tick"
                      style={{
                        width: 16,
                        height: 16,
                        marginRight: 8,
                        color: sortOrder === 'desc' ? 'currentColor' : 'transparent'
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" focusable="false" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd" d="M21.35 4.27c.68.47.86 1.4.38 2.08l-10 14.5a1.5 1.5 0 0 1-2.33.17l-6.5-7a1.5 1.5 0 0 1 2.2-2.04l5.23 5.63 8.94-12.96a1.5 1.5 0 0 1 2.08-.38Z" fill="currentColor"></path>
                      </svg>
                    </span>
                    降序
                  </li>
                </ul>
              )}
            </div>
            <div title="切换列表视图" className="puter-button" style={{ height: 28, display: 'inline-flex', alignItems: 'center', padding: '0 2px', border: '1px solid var(--button-border)', borderRadius: 8, background: 'var(--button-bg)' }}>
              <div 
                className="relative box-border flex shrink-0 items-center overflow-hidden rounded-full transition-all px-0.5 justify-end cursor-pointer bg-brand w-7.5 h-4 !rounded-[6px] !bg-[var(--semi-color-fill-0)] border border-solid border-[#68778d14] !w-[52px] !h-[28px]"
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  width: 48,
                  height: 24,
                  borderRadius: 6,
                  background: view === 'grid' ? 'var(--button-bg)' : 'var(--semi-color-primary)',
                  justifyContent: 'flex-start',
                  transition: 'background-color 180ms ease'
                }}
                onClick={() => setView(view === 'list' ? 'grid' : 'list')}
                role="switch"
                aria-checked={view === 'list'}
                aria-label="切换显示样式"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setView(view === 'list' ? 'grid' : 'list')
                  }
                }}
              >
                <div className="pointer-events-none absolute left-0 top-0 z-10 size-full box-border flex flex-row items-center justify-center gap-1 px-1" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0 4px', zIndex: 0, pointerEvents: 'none' }}>
                  <div className="flex size-7 items-center justify-center" style={{ display: 'flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', opacity: view === 'list' ? 1 : 0.5 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className="size-4 text-[var(--semi-color-text-1)]">
                      <g clipPath="url(#clip0_18_14350)">
                        <path d="M3.01 17l.102.005a1 1 0 010 1.99L3.01 19H3a1 1 0 110-2h.01zM21 17a1 1 0 110 2H8a1 1 0 110-2h13zM3.01 11l.102.005a1 1 0 010 1.99L3.01 13H3a1 1 0 110-2h.01zM21 11a1 1 0 110 2H8a1 1 0 110-2h13zM3.01 5l.102.005a1 1 0 010 1.99L3.01 7H3a1 1 0 010-2h.01zM21 5a1 1 0 110 2H8a1 1 0 010-2h13z"></path>
                      </g>
                      <defs>
                        <clipPath id="clip0_18_14350">
                          <rect width="24" height="24"></rect>
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <div className="flex size-7 items-center justify-center" style={{ display: 'flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', opacity: view === 'grid' ? 1 : 0.5 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" className="size-4 text-[var(--semi-color-text-1)]">
                      <path fillRule="evenodd" clipRule="evenodd" d="M2 4a2 2 0 012-2h5a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm7 0H4v5h5V4zm4 0a2 2 0 012-2h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2V4zm7 0h-5v5h5V4zM2 15a2 2 0 012-2h5a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5zm7 0H4v5h5v-5zm4 0a2 2 0 012-2h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5zm7 0h-5v5h5v-5z"></path>
                    </svg>
                  </div>
                </div>
                <div 
                  className="flex items-center justify-center rounded-full size-3 !rounded-[6px] !bg-[var(--semi-color-bg-1)] !w-[24px] !h-[24px] bg-[var(--semi-color-bg-1)]"
                  style={{ 
                    filter: 'drop-shadow(rgba(32, 35, 39, 0.12) 0px 0.667px 1.333px)',
                    transform: view === 'list' ? 'translateX(2px)' : 'translateX(22px)',
                    transformOrigin: '50% 50% 0px',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'transform 180ms ease'
                  }}
                ></div>
              </div>
            </div>
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
