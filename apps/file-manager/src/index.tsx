import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import {
  Folder,
  Users,
  Settings,
  Inbox,
  Share2,
  Link,
  History,
  Star,
  ArrowLeftRight,
  Trash2,
  FileText
} from 'lucide-react'

import { pushFileTask, updateFileTask, getFileTasks, subscribeFileTasks, clearCompletedFileTasks, removeFileTask, FileTask } from '../../../src/sdk/desktop'
import { Sidebar } from '../../../src/components/Sidebar'
import Toolbar from './components/Toolbar'
import ListView from './components/ListView'
import GridView from './components/GridView'
import FooterCount from './components/FooterCount'
import TransfersPane from './components/TransfersPane'
import TrashPane from './components/TrashPane'

import { api } from '../../../src/api/client'
 
const fmApi = api

function useNavigation(initialPath: string = '/') {
  const [path, setPath] = useState<string>(initialPath)
  const [navHist, setNavHist] = useState<string[]>([initialPath])
  const [navIndex, setNavIndex] = useState<number>(0)
  const navigate = (to: string) => {
    const target = to || '/'
    if (navHist[navIndex] !== target) {
      const nextHist = [...navHist.slice(0, navIndex + 1), target]
      setNavHist(nextHist)
      setNavIndex(nextHist.length - 1)
    }
    setPath(target)
  }
  const back = () => {
    if (navIndex > 0) {
      const i = navIndex - 1
      setNavIndex(i)
      setPath(navHist[i])
    }
  }
  const forward = () => {
    if (navIndex < navHist.length - 1) {
      const i = navIndex + 1
      setNavIndex(i)
      setPath(navHist[i])
    }
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
  return { path, setPath, navHist, navIndex, navigate, back, forward, up, crumbs }
}

export default function FileManager({ initialPath }: { initialPath?: string }) {
  const { path, setPath, navHist, navIndex, navigate, back, forward, crumbs } = useNavigation(initialPath || '/')
  const [entries, setEntries] = useState<
    { name: string; is_dir: boolean; size: number; modified_ts: number }[]
  >([])
  const [tasks, setTasks] = useState<FileTask[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [active, setActive] = useState<string>('home')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [sortKey, setSortKey] = useState<'name' | 'size' | 'modified_ts'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false)
  const [q, setQ] = useState<string>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sortButtonRef = useRef<HTMLButtonElement | null>(null)
  const [transferTab, setTransferTab] = useState<'upload' | 'download'>('upload')
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    name: 172,
    modified: 149,
    type: 60,
    size: 85,
    created: 105,
    owner: 120,
  })
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null)
  const abortControllers = useRef<Map<string, AbortController>>(new Map())
  const uploadFilesMap = useRef<Map<string, File>>(new Map())
  const speedStatsRef = useRef<Map<string, { samples: { ts: number; bps: number }[]; lastAvg: number }>>(new Map())
  const SPEED_WINDOW_MS = 6000

  const startUpload = async (id: string, file: File, dir: string, offset: number = 0) => {
    const controller = new AbortController()
    abortControllers.current.set(id, controller)
    updateFileTask(id, { status: 'running' })
    console.log(`[${new Date().toLocaleTimeString()}] FileManager: startUpload ${file.name}`);
    try {
      await fmApi.fsUpload(dir, file, (info) => {
        updateFileTask(id, { progress: info.percent, total: info.total, loaded: info.loaded, bps: info.bps })
      }, controller.signal)
      console.log(`[${new Date().toLocaleTimeString()}] FileManager: upload finished ${file.name}`);
      updateFileTask(id, { progress: 100, status: 'done' })
      uploadFilesMap.current.delete(id)
      if (path === dir) {
        const rs = await fmApi.fsList(path)
        setEntries(rs.entries)
      }
    } catch (e: any) {
      if (e && (e.name === 'Canceled' || e.code === 'ERR_CANCELED')) {
        // ignore
      } else {
        updateFileTask(id, { status: 'error' })
      }
    } finally {
      abortControllers.current.delete(id)
    }
  }
  useEffect(() => {
    setTasks(getFileTasks())
    const unsub = subscribeFileTasks((ts) => {
      const now = Date.now()
      for (const t of ts) {
        if (t.status === 'running') {
          const entry = speedStatsRef.current.get(t.id) || { samples: [], lastAvg: 0 }
          if (t.bps != null) {
            entry.samples.push({ ts: now, bps: t.bps })
          }
          entry.samples = entry.samples.filter(s => now - s.ts <= SPEED_WINDOW_MS)
          if (entry.samples.length > 0) {
            let sum = 0
            for (const s of entry.samples) sum += s.bps
            entry.lastAvg = sum / entry.samples.length
          }
          speedStatsRef.current.set(t.id, entry)
        } else {
          const entry = speedStatsRef.current.get(t.id)
          if (entry) {
            entry.samples = []
            speedStatsRef.current.set(t.id, entry)
          }
        }
      }
      setTasks(ts)
    })
    return () => unsub()
  }, [])
  const getAvgSpeed = (id: string) => {
    const e = speedStatsRef.current.get(id)
    return e && e.lastAvg ? e.lastAvg : 0
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        if (path === '/Transfers') {
          // Tasks are handled by global subscription
          return
        }
        console.time('fm:first-page')
        const r = await fmApi.fsList(path)
        if (!mounted) return
        setEntries(r.entries)
        console.timeEnd('fm:first-page')
        if (r.has_more && r.next_offset != null) {
          console.time('fm:all-pages')
          let nextOffset = r.next_offset
          let more = r.has_more
          while (mounted && more) {
            const rr = await fmApi.fsListPage(path, nextOffset, 500)
            if (!mounted) break
            if (rr.entries && rr.entries.length > 0) {
              setEntries(prev => {
                const seen = new Set(prev.map(e => e.name))
                const appended = rr.entries.filter(e => !seen.has(e.name))
                return appended.length > 0 ? [...prev, ...appended] : prev
              })
            }
            more = !!rr.has_more
            nextOffset = rr.next_offset ?? (nextOffset + (rr.entries?.length ?? 0))
            await new Promise(res => setTimeout(res, 0))
          }
          console.timeEnd('fm:all-pages')
        }
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
  const joinPath = (dir: string, name: string) => (dir.endsWith('/') ? `${dir}${name}` : `${dir}/${name}`)
  const reloadCurrentDir = async () => {
    const rs = await fmApi.fsList(path)
    setEntries(rs.entries)
  }
  

  const goto = async (to: string, key: string) => {
    setActive(key)
    const reserved = new Set<string>([
      '/AppData',
      '/Favorites',
      '/MyShares',
      '/PublicLinks',
      '/Recent',
      '/SharedWithMe',
      '/Team',
      '/Trash',
      '/Transfers',
    ])
    if (to !== '/' && !reserved.has(to)) {
      await fmApi.fsMkdir(to)
    }
    setSelected(new Set())
    navigate(to)
  }
  const showUploads = () => {}

 
  const refresh = async () => {
    await reloadCurrentDir()
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
      const next = Math.max(100, startW + dx)
      setColWidths((cw) => ({ ...cw, [key]: next }))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  
  
  const handleTogglePause = (t: FileTask) => {
    if (t.status === 'running') {
      const controller = abortControllers.current.get(t.id)
      if (controller) {
        controller.abort()
      }
      updateFileTask(t.id, { status: 'paused' })
    } else {
      const file = uploadFilesMap.current.get(t.id)
      if (file) {
        startUpload(t.id, file, t.dir, t.loaded || 0)
      } else {
        alert('无法恢复任务：文件对象丢失')
      }
    }
  }
  const handleRemoveTask = async (t: FileTask) => {
    uploadFilesMap.current.delete(t.id)
    if (t.kind === 'upload' && t.status !== 'done') {
      if (!window.confirm('确定要取消该任务吗？取消后将删除已上传的部分文件。')) {
        return
      }
      const controller = abortControllers.current.get(t.id)
      if (controller) {
        controller.abort()
      }
      const fullPath = t.dir === '/' ? `/${t.name}` : `${t.dir}/${t.name}`
      await fmApi.fsDelete(fullPath)
      if (path === t.dir) {
        refresh()
      }
    }
    removeFileTask(t.id)
  }
  const onRestoreSelected = async () => {
    const names = [...selected]
    for (const n of names) {
      const from = `/Trash/${n}`
      const to = `/${n}`
      await fmApi.fsRename(from, to)
    }
      const rs = await fmApi.fsList(path)
    setEntries(rs.entries)
    clearSelection()
  }
  const onDeleteSelected = async () => {
    const names = [...selected]
    for (const n of names) {
      const p = `/Trash/${n}`
      await fmApi.fsDelete(p)
    }
    const rs = await fmApi.fsList(path)
    setEntries(rs.entries)
    clearSelection()
  }
  const onEmptyTrash = async () => {
    const names = entries.map(e => e.name)
    for (const n of names) {
      const p = `/Trash/${n}`
      await fmApi.fsDelete(p)
    }
    const rs = await fmApi.fsList(path)
    setEntries(rs.entries)
    clearSelection()
  }
  const onRestoreOne = async (name: string) => {
    await fmApi.fsRename(`/Trash/${name}`, `/${name}`)
    await reloadCurrentDir()
  }
  const onDeleteOne = async (name: string) => {
    await fmApi.fsDelete(`/Trash/${name}`)
    await reloadCurrentDir()
  }
  



  const sections = useMemo(() => {
    const runningCount = tasks.filter(t => t.status === 'running').length
    return [
    {
      title: '文件',
      items: [
        { id: 'home', label: '我的文件', icon: <Folder size={20} strokeWidth={1.5} /> },
        { id: 'team', label: '团队文件', icon: <Users size={20} strokeWidth={1.5} /> },
        { id: 'appdata', label: '应用文件', icon: <Settings size={20} strokeWidth={1.5} /> },
      ]
    },
    {
      title: '共享',
      items: [
        { id: 'shared-with-me', label: '他人共享', icon: <Inbox size={20} strokeWidth={1.5} /> },
        { id: 'my-shares', label: '我的共享', icon: <Share2 size={20} strokeWidth={1.5} /> },
        { id: 'public-links', label: '外链分享', icon: <Link size={20} strokeWidth={1.5} /> },
      ]
    },
    {
      title: '快捷',
      items: [
        { id: 'recent', label: '最近访问', icon: <History size={20} strokeWidth={1.5} /> },
        { id: 'favorites', label: '我的收藏', icon: <Star size={20} strokeWidth={1.5} /> },
      ]
    },
    {
      title: '系统',
      items: [
        { id: 'transfers', label: '传输任务', icon: <ArrowLeftRight size={20} strokeWidth={1.5} />, badge: runningCount > 0 ? runningCount : undefined },
        { id: 'trash', label: '回收站', icon: <Trash2 size={20} strokeWidth={1.5} /> },
      ]
    }
  ]
  }, [tasks])

  return (
    <div style={{ display: 'flex', height: '100%' }} className="noselect">
      <style>{`
        .pressable {
          height: 28px;
          padding: 0 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #fbfbfc 0%, #f3f4f6 100%);
          color: #111827;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 0 rgba(255,255,255,0.75) inset, 0 1px 2px rgba(0,0,0,0.08);
          transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }
        .pressable:active {
          background: linear-gradient(180deg, #edeef1 0%, #e5e7eb 100%);
          border: 1px solid #cbd5e1;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.14);
        }
      `}</style>
      <Sidebar
        width={220}
        sections={sections}
        activeId={active}
        onSelect={(id) => {
          const toMap: Record<string, string> = {
            home: '/',
            team: '/Team',
            appdata: '/AppData',
            'shared-with-me': '/SharedWithMe',
            'my-shares': '/MyShares',
            'public-links': '/PublicLinks',
            recent: '/Recent',
            favorites: '/Favorites',
            transfers: '/Transfers',
            trash: '/Trash',
          }
          const to = toMap[id] ?? '/'
          goto(to, id)
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        {path === '/Transfers' ? (
          <TransfersPane
            tasks={tasks}
            transferTab={transferTab}
            setTransferTab={setTransferTab}
            fmtSize={fmtSize}
            getAvgSpeed={getAvgSpeed}
            onTogglePause={handleTogglePause}
            onRemoveTask={handleRemoveTask}
            onClearCompleted={clearCompletedFileTasks}
            navigate={navigate}
          />
        ) : path === '/Trash' ? (
          <TrashPane
            entries={entries}
            selected={selected}
            toggleSelect={toggleSelect}
            fmtTime={fmtTime}
            fmtSize={fmtSize}
            onRestoreSelected={onRestoreSelected}
            onDeleteSelected={onDeleteSelected}
            onEmptyTrash={onEmptyTrash}
            onRestoreOne={onRestoreOne}
            onDeleteOne={onDeleteOne}
          />
        ) : (
          <>
            <Toolbar
              back={() => { setSelected(new Set()); back() }}
              forward={() => { setSelected(new Set()); forward() }}
              refresh={refresh}
              navIndex={navIndex}
              navHist={navHist}
              navigate={(to) => { setSelected(new Set()); navigate(to) }}
              crumbs={crumbs}
              q={q}
              setQ={(v) => setQ(v)}
              onUploadFiles={async (files) => {
                for (const f of Array.from(files)) {
                  const id = `${f.name}-${Date.now()}`
                  pushFileTask({ id, kind: 'upload', name: f.name, dir: path, progress: 0, total: f.size, loaded: 0, bps: 0, status: 'running' })
                  uploadFilesMap.current.set(id, f)
                  await startUpload(id, f, path)
                }
              }}
              onCreateFolder={async () => {
                const name = prompt('新建文件夹名称')
                if (!name) return
                const next = joinPath(path, name)
                const r = await api.fsMkdir(next)
                if (r.ok) {
                  await reloadCurrentDir()
                }
              }}
              onDownloadSelected={async () => {
                const names = [...selected].filter(n => !entries.find(e => e.name === n)?.is_dir)
                if (names.length === 0) return
                const first = names[0]
                const fullPath = joinPath(path, first)
                const url = api.fsDownloadUrl(fullPath)
                window.open(url, '_blank')
                const id = `dl-${first}-${Date.now()}`
                pushFileTask({ id, kind: 'download', name: first, dir: path, progress: 100, status: 'done' })
              }}
              onDeleteSelected={async () => {
                const names = [...selected]
                for (const n of names) {
                  const p = joinPath(path, n)
                  const id = `del-${n}-${Date.now()}`
                  pushFileTask({ id, kind: 'delete', name: n, dir: path, status: 'running' })
                  await api.fsDelete(p)
                  updateFileTask(id, { status: 'done' })
                }
                await reloadCurrentDir()
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
            <div id="fm-list-container" style={{ flex: 1, overflow: 'auto', padding: 0, color: '#1c1c1e', fontSize: 14, background: '#ffffff' }}>
              {view === 'list' ? (
                <>
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
                      const next = joinPath(path, name)
                      setPath(next)
                    }}
                  />
                </>
              ) : (
                <>
                  <GridView
                    path={path}
                    filtered={filtered}
                    selected={selected}
                    toggleSelect={toggleSelect}
                    onOpenDir={(name) => {
                      const next = joinPath(path, name)
                      setPath(next)
                    }}
                  />
                </>
              )}
            </div>
            <FooterCount count={filtered.length} />
          </>
        )}
      </div>
    </div>
  )
}
