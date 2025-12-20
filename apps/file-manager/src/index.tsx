import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../../src/api/client'
import { pushFileTask, updateFileTask } from '../../../src/sdk/desktop'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import ListView from './components/ListView'
import GridView from './components/GridView'
import FooterCount from './components/FooterCount'

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
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    name: 172,
    modified: 149,
    type: 60,
    size: 85,
    created: 105,
    owner: 120,
  })
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null)
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
  const fmtSize = (bytes: number) => {
    if (bytes === undefined || bytes === null) return '-'
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${Math.round(kb)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`
    const gb = mb / 1024
    return `${gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10} GB`
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
  useEffect(() => {
    try {
      const s = localStorage.getItem('fm:colWidths')
      if (s) {
        const obj = JSON.parse(s)
        if (obj && typeof obj === 'object') {
          setColWidths((prev) => ({ ...prev, ...obj }))
        }
      }
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('fm:colWidths', JSON.stringify(colWidths))
    } catch {}
  }, [colWidths])
  useEffect(() => {
    const total = filtered.length
    const sel = selected.size
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = sel > 0 && sel < total
      headerCheckboxRef.current.checked = total > 0 && sel === total
    }
  }, [selected, filtered])
  const startResize = (key: keyof typeof colWidths, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = colWidths[key]
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const next = Math.max(60, startW + dx)
      setColWidths((cw) => ({ ...cw, [key]: next }))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  
  

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar active={active} onGoto={goto} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: 8, minWidth: 0 }}>
        <Toolbar
          back={back}
          forward={forward}
          refresh={refresh}
          navIndex={navIndex}
          navHist={navHist}
          navigate={navigate}
          crumbs={crumbs}
          q={q}
          setQ={(v) => setQ(v)}
          onUploadFiles={async (files) => {
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
          }}
          onCreateFolder={async () => {
            const name = prompt('新建文件夹名称')
            if (!name) return
            const next = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`
            const r = await api.fsMkdir(next)
            if (r.ok) {
              const rs = await api.fsList(path)
              setEntries(rs.entries)
            }
          }}
          onDownloadSelected={async () => {
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
          }}
          onDeleteSelected={async () => {
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
          }}
          sortKey={sortKey}
          setSortKey={(k) => setSortKey(k)}
          sortOrder={sortOrder}
          setSortOrder={(o) => setSortOrder(o)}
          view={view}
          setView={(v) => setView(v)}
        />
        <style>{`
          #fm-list-container::-webkit-scrollbar { display: none; }
        `}</style>
        <div id="fm-list-container" style={{ flex: 1, overflow: 'auto', padding: 8, color: '#111827', fontSize: 14 }}>
          {view === 'list' ? (<>
            <ListView
              path={path}
              filtered={filtered}
              selected={selected}
              setSelected={(s) => setSelected(new Set(s))}
              clearSelection={clearSelection}
              colWidths={colWidths}
              startResize={startResize}
              headerCheckboxRef={headerCheckboxRef}
              toggleSelect={toggleSelect}
              fmtTime={fmtTime}
              fmtSize={fmtSize}
              onOpenDir={(name) => {
                const next = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`
                setPath(next)
              }}
            />
            
          </>) : (<>
            <GridView
              path={path}
              filtered={filtered}
              selected={selected}
              toggleSelect={toggleSelect}
              onOpenDir={(name) => {
                const next = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`
                setPath(next)
              }}
            />
            
          </>)}
        </div>
        <FooterCount count={filtered.length} />
      </div>
    </div>
  )
}
