import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import Icon from '@mdi/react'
import {
  mdiUpload,
  mdiDownload,
  mdiFolderOutline,
  mdiFileDocumentOutline,
  mdiAccountGroupOutline,
  mdiCogOutline,
  mdiInboxArrowDownOutline,
  mdiShareVariant,
  mdiLinkVariant,
  mdiHistory,
  mdiStarOutline,
  mdiSwapHorizontal,
  mdiTrashCanOutline,
  mdiPlay,
  mdiPause,
  mdiClose,
  mdiCheckCircleOutline
} from '@mdi/js'
import { api } from '../../../src/api/client'
import { pushFileTask, updateFileTask, getFileTasks, subscribeFileTasks, clearCompletedFileTasks, removeFileTask, FileTask } from '../../../src/sdk/desktop'
import { Sidebar } from '../../../src/components/Sidebar'
import Toolbar from './components/Toolbar'
import ListView from './components/ListView'
import GridView from './components/GridView'
import FooterCount from './components/FooterCount'

export default function FileManager() {
  const [path, setPath] = useState<string>('/')
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
  const [navHist, setNavHist] = useState<string[]>(['/'])
  const [navIndex, setNavIndex] = useState<number>(0)
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
      await api.fsUpload(dir, file, (info) => {
        updateFileTask(id, { progress: info.percent, total: info.total, loaded: info.loaded, bps: info.bps })
      }, controller.signal, offset)
      console.log(`[${new Date().toLocaleTimeString()}] FileManager: upload finished ${file.name}`);
      updateFileTask(id, { progress: 100, status: 'done' })
      uploadFilesMap.current.delete(id)
      if (path === dir) {
        const rs = await api.fsList(path)
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
  
  // Global tasks subscription
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
        const r = await api.fsList(path)
        if (!mounted) return
        setEntries(r.entries)
        console.timeEnd('fm:first-page')
        if (r.has_more && r.next_offset != null) {
          console.time('fm:all-pages')
          let nextOffset = r.next_offset
          let more = r.has_more
          while (mounted && more) {
            const rr = await api.fsListPage(path, nextOffset, 500)
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
  
  

  const renderTransfers = () => {
    const uploads = tasks.filter(t => t.kind === 'upload')
    const downloads = tasks.filter(t => t.kind === 'download')
    const visible = transferTab === 'upload' ? uploads : downloads
    const runningUploads = tasks.filter(t => t.kind === 'upload' && t.status === 'running').length
    const runningDownloads = tasks.filter(t => t.kind === 'download' && t.status === 'running').length
    
    const fmtSpeed = (bps?: number) => {
      const v = typeof bps === 'number' && bps >= 0 ? bps : 0
      return `${fmtSize(v)}/s`
    }
    const getAvgSpeed = (id: string) => {
      const e = speedStatsRef.current.get(id)
      return e && e.lastAvg ? e.lastAvg : 0
    }

    const togglePause = (t: FileTask) => {
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

    const removeTask = async (t: FileTask) => {
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
        await api.fsDelete(fullPath)
        if (path === t.dir) {
          refresh()
        }
      }
      removeFileTask(t.id)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderBottom: '1px solid var(--win-border)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <button
              className="puter-button"
              style={{
                height: 28,
                position: 'relative',
                padding: '0 10px',
                borderRadius: 6,
                background: transferTab === 'upload' ? '#2563eb' : 'var(--button-bg)',
                color: transferTab === 'upload' ? '#fff' : '#111827',
                border: transferTab === 'upload' ? '1px solid #2563eb' : '1px solid var(--button-border)'
              }}
              onClick={() => setTransferTab('upload')}
            >
              上传
              {runningUploads > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {runningUploads}
                </span>
              )}
            </button>
            <button
              className="puter-button"
              style={{
                height: 28,
                position: 'relative',
                padding: '0 10px',
                borderRadius: 6,
                background: transferTab === 'download' ? '#2563eb' : 'var(--button-bg)',
                color: transferTab === 'download' ? '#fff' : '#111827',
                border: transferTab === 'download' ? '1px solid #2563eb' : '1px solid var(--button-border)'
              }}
              onClick={() => setTransferTab('download')}
            >
              下载
              {runningDownloads > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: '#34d399', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {runningDownloads}
                </span>
              )}
            </button>
          </div>
          <button className="puter-button" style={{ height: 28, marginLeft: 'auto' }} onClick={() => clearCompletedFileTasks()}>清除已完成</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {visible.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>{transferTab === 'upload' ? '暂无上传任务' : '暂无下载任务'}</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {visible.map(t => (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '24px 4fr 120px 140px 72px 72px', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--win-border)', borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.kind === 'upload'
                      ? (t.status === 'done'
                        ? <Icon path={mdiCheckCircleOutline} size={0.9} color="#10b981" />
                        : <Icon path={mdiUpload} size={0.9} />)
                      : <Icon path={mdiDownload} size={0.9} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 60%' }}>{t.name}</span>
                    <span style={{ marginLeft: 16, fontSize: 12, lineHeight: 1.2, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 40%' }}>存储目录: {t.dir}</span>
                  </div>
                  {!(t.kind === 'upload' && t.status === 'done') ? (
                    <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, t.progress ?? (t.status === 'done' ? 100 : 0)))}%`, height: '100%', background: '#60a5fa' }} />
                    </div>
                  ) : <div />}
                  <div style={{ fontSize: 13, lineHeight: 1.2, color: 'var(--muted)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.status === 'running' ? (
                      <>
                        <span>{fmtSize(t.loaded || 0)} / {fmtSize(t.total || 0)}</span>
                        <span style={{ marginLeft: 8 }}>{fmtSpeed(getAvgSpeed(t.id))}</span>
                      </>
                    ) : null}
                  </div>
                  <div style={{ textAlign: 'right', color: t.status === 'error' ? '#ef4444' : '#111827', fontSize: 13, lineHeight: 1.2 }}>
                    {t.status === 'error'
                      ? '失败'
                      : t.status === 'paused'
                        ? '暂停'
                        : (t.kind === 'upload' && t.status === 'done')
                          ? ''
                          : `${Math.min(100, Math.max(0, t.progress ?? 0))}%`}
                  </div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {(t.kind === 'upload' && t.status === 'done') && (
                      <button
                        className="puter-icon-button"
                        style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => navigate(t.dir)}
                        title="打开文件目录"
                      >
                        <Icon path={mdiFolderOutline} size={0.8} color="#2563eb" />
                      </button>
                    )}
                    {t.status !== 'done' && (
                      <button 
                        className="puter-icon-button"
                        style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => togglePause(t)}
                        title={t.status === 'running' ? '暂停' : '继续'}
                      >
                        <Icon path={t.status === 'running' ? mdiPause : mdiPlay} size={0.8} color="#6b7280" />
                      </button>
                    )}
                    <button 
                      className="puter-icon-button"
                      style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => removeTask(t)}
                      title="删除任务"
                    >
                      <Icon path={mdiClose} size={0.8} color="#6b7280" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTrash = () => {
    const onRestoreSelected = async () => {
      const names = [...selected]
      for (const n of names) {
        const from = `/Trash/${n}`
        const to = `/${n}`
        await api.fsRename(from, to)
      }
      const rs = await api.fsList(path)
      setEntries(rs.entries)
      clearSelection()
    }
    const onDeleteSelected = async () => {
      const names = [...selected]
      for (const n of names) {
        const p = `/Trash/${n}`
        await api.fsDelete(p)
      }
      const rs = await api.fsList(path)
      setEntries(rs.entries)
      clearSelection()
    }
    const onEmptyTrash = async () => {
      const names = entries.map(e => e.name)
      for (const n of names) {
        const p = `/Trash/${n}`
        await api.fsDelete(p)
      }
      const rs = await api.fsList(path)
      setEntries(rs.entries)
      clearSelection()
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderBottom: '1px solid var(--win-border)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>回收站</h3>
          <button className="puter-button" style={{ height: 28 }} onClick={onRestoreSelected} disabled={selected.size === 0}>还原所选</button>
          <button className="puter-button" style={{ height: 28 }} onClick={onDeleteSelected} disabled={selected.size === 0}>删除所选</button>
          <button className="puter-button" style={{ height: 28, marginLeft: 'auto' }} onClick={onEmptyTrash}>清空回收站</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {entries.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>回收站为空</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {entries.map(e => {
                const checked = selected.has(e.name)
                return (
                  <div
                    key={`trash-${e.name}`}
                    style={{ display: 'grid', gridTemplateColumns: '24px 1fr 120px 120px', alignItems: 'center', gap: 12, padding: '8px 10px', border: '1px solid var(--win-border)', borderRadius: 8, background: checked ? 'rgba(0,0,0,0.06)' : '#fff', cursor: 'pointer' }}
                    onClick={() => toggleSelect(e.name)}
                  >
                    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {e.is_dir ? <Icon path={mdiFolderOutline} size={0.9} /> : <Icon path={mdiFileDocumentOutline} size={0.9} />}
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>大小：{e.is_dir ? '-' : fmtSize(e.size)} · 修改：{fmtTime(e.modified_ts)}</div>
                    </div>
                    <button className="puter-button" style={{ height: 28 }} onClick={async (ev) => { ev.stopPropagation(); await api.fsRename(`/Trash/${e.name}`, `/${e.name}`); const rs = await api.fsList(path); setEntries(rs.entries) }}>还原</button>
                    <button className="puter-button" style={{ height: 28 }} onClick={async (ev) => { ev.stopPropagation(); await api.fsDelete(`/Trash/${e.name}`); const rs = await api.fsList(path); setEntries(rs.entries) }}>删除</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const sections = useMemo(() => {
    const runningCount = tasks.filter(t => t.status === 'running').length
    return [
    {
      title: '文件',
      items: [
        { id: 'home', label: '我的文件', icon: <Icon path={mdiFolderOutline} size={1} /> },
        { id: 'team', label: '团队文件', icon: <Icon path={mdiAccountGroupOutline} size={1} /> },
        { id: 'appdata', label: '应用文件', icon: <Icon path={mdiCogOutline} size={1} /> },
      ]
    },
    {
      title: '共享',
      items: [
        { id: 'shared-with-me', label: '他人共享', icon: <Icon path={mdiInboxArrowDownOutline} size={1} /> },
        { id: 'my-shares', label: '我的共享', icon: <Icon path={mdiShareVariant} size={1} /> },
        { id: 'public-links', label: '外链分享', icon: <Icon path={mdiLinkVariant} size={1} /> },
      ]
    },
    {
      title: '快捷',
      items: [
        { id: 'recent', label: '最近访问', icon: <Icon path={mdiHistory} size={1} /> },
        { id: 'favorites', label: '我的收藏', icon: <Icon path={mdiStarOutline} size={1} /> },
      ]
    },
    {
      title: '系统',
      items: [
        { id: 'transfers', label: '传输任务', icon: <Icon path={mdiSwapHorizontal} size={1} />, badge: runningCount > 0 ? runningCount : undefined },
        { id: 'trash', label: '回收站', icon: <Icon path={mdiTrashCanOutline} size={1} /> },
      ]
    }
  ]
  }, [tasks])

  return (
    <div style={{ display: 'flex', height: '100%' }} className="noselect">
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: 8, minWidth: 0 }}>
        {path === '/Transfers' ? (
          renderTransfers()
        ) : path === '/Trash' ? (
          renderTrash()
        ) : (
          <>
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
                  pushFileTask({ id, kind: 'upload', name: f.name, dir: path, progress: 0, total: f.size, loaded: 0, bps: 0, status: 'running' })
                  uploadFilesMap.current.set(id, f)
                  await startUpload(id, f, path)
                }
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
                const url = api.fsDownloadUrl(fullPath)
                window.open(url, '_blank')
                const id = `dl-${first}-${Date.now()}`
                pushFileTask({ id, kind: 'download', name: first, dir: path, progress: 100, status: 'done' })
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
                      const next = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`
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
                      const next = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`
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
