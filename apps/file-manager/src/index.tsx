import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
import ContextMenu, { ContextMenuItem } from './components/ContextMenu'
import Modal from './components/Modal'

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; name: string } | null>(null)
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
  
  // New State
  const [clipboard, setClipboard] = useState<{ items: string[], action: 'copy' | 'move', sourcePath: string } | null>(null)
  const [dragSelect, setDragSelect] = useState<{ startX: number, startY: number, curX: number, curY: number } | null>(null)
  const [resizingKey, setResizingKey] = useState<string | null>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  // Modals state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([])
  
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false)
  
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameTarget, setRenameTarget] = useState('')
  const [renameNewName, setRenameNewName] = useState('')
  
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const [showCancelTaskModal, setShowCancelTaskModal] = useState(false)
  const [taskToCancel, setTaskToCancel] = useState<FileTask | null>(null)

  const headerCheckboxRef = useRef<HTMLInputElement | null>(null)
  const abortControllers = useRef<Map<string, AbortController>>(new Map())
  const uploadFilesMap = useRef<Map<string, File>>(new Map())
  const speedStatsRef = useRef<Map<string, { samples: { ts: number; bps: number }[]; lastAvg: number }>>(new Map())
  const SPEED_WINDOW_MS = 6000

  const joinPath = (dir: string, name: string) => (dir.endsWith('/') ? `${dir}${name}` : `${dir}/${name}`)
  const reloadCurrentDir = async () => {
    const rs = await fmApi.fsList(path)
    setEntries(rs.entries)
  }

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
        await reloadCurrentDir()
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

  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    let targetName = name || ''
    if (targetName) {
      if (!selected.has(targetName)) {
        setSelected(new Set([targetName]))
      }
    }
    setContextMenu({ x: e.clientX, y: e.clientY, name: targetName })
  }

  const closeContextMenu = () => setContextMenu(null)

  // Drag Select Logic
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.list-row, .grid-item')) return
    if (path === '/Trash' || path === '/Transfers') return
    
    // Only left click
    if (e.button !== 0) return

    const startX = e.clientX
    const startY = e.clientY
    
    setDragSelect({ startX, startY, curX: startX, curY: startY })
    
    // Initial selection state
    const initialSelected = new Set(e.ctrlKey || e.metaKey || e.shiftKey ? selected : [])
    
    const move = (ev: MouseEvent) => {
      setDragSelect(prev => prev ? { ...prev, curX: ev.clientX, curY: ev.clientY } : null)
      
      const box = {
        left: Math.min(startX, ev.clientX),
        top: Math.min(startY, ev.clientY),
        right: Math.max(startX, ev.clientX),
        bottom: Math.max(startY, ev.clientY)
      }
      
      const nextSelected = new Set(initialSelected)
      
      const items = document.querySelectorAll(view === 'list' ? '.list-row' : '.grid-item')
      items.forEach((el) => {
        const r = el.getBoundingClientRect()
        // Check overlap
        if (r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top) {
          const name = el.getAttribute('data-name')
          if (name) {
             nextSelected.add(name)
          }
        }
      })
      
      setSelected(nextSelected)
    }
    
    const up = (ev: MouseEvent) => {
      setDragSelect(null)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      
      // If no drag happened and clicked on empty space, clear selection
      if (Math.abs(ev.clientX - startX) <= 5 && Math.abs(ev.clientY - startY) <= 5) {
         if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !(e.target as HTMLElement).closest('.list-row, .grid-item')) {
           setSelected(new Set())
         }
      }
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  // Enhanced Operations
  const getTargetItems = (clickedName?: string) => {
    if (clickedName && !selected.has(clickedName)) {
      return [clickedName]
    }
    return Array.from(selected)
  }

  const handleCopy = (names: string[]) => {
    setClipboard({ items: names, action: 'copy', sourcePath: path })
  }

  const handleCut = (names: string[]) => {
    setClipboard({ items: names, action: 'move', sourcePath: path })
  }

  const handlePaste = async () => {
    if (!clipboard) return
    const { items, action, sourcePath } = clipboard
    if (action === 'move') {
      for (const name of items) {
        const from = joinPath(sourcePath, name)
        const to = joinPath(path, name)
        if (from !== to) {
          await fmApi.fsRename(from, to)
        }
      }
      await reloadCurrentDir()
      setClipboard(null) // Move clears clipboard
    } else if (action === 'copy') {
       for (const name of items) {
         const from = joinPath(sourcePath, name)
         // Determine new name to avoid collision? Or just overwrite/fail?
         // For now simple copy
         const to = joinPath(path, name)
         if (from === to) {
            // Copy to same dir -> duplicate name
            const parts = name.split('.')
            const ext = parts.length > 1 ? parts.pop() : ''
            const base = parts.join('.')
            const newName = `${base} copy${ext ? '.' + ext : ''}`
            const toNew = joinPath(path, newName)
            
            // We need to handle directory copy differently? 
            // fsDownloadBlob only works for files usually?
            // If it's a directory, we can't easily copy it with blob download.
            // Check if it's a directory
            const entry = entries.find(e => e.name === name) // This checks current dir, but source might be elsewhere
            // We don't have easy check for source file type if it's not in current dir entries.
            // But we can try download blob.
            try {
               const blob = await fmApi.fsDownloadBlob(from)
               const file = new File([blob], newName, { type: blob.type })
               const id = `copy-${newName}-${Date.now()}`
               pushFileTask({ id, kind: 'upload', name: newName, dir: path, progress: 0, total: blob.size, loaded: 0, bps: 0, status: 'running' })
               await startUpload(id, file, path)
            } catch (e) {
               console.error('Copy failed', e)
               alert(`复制失败: ${name} (可能是文件夹或太大)`)
            }
         } else {
            // Copy to different dir
             try {
               const blob = await fmApi.fsDownloadBlob(from)
               const file = new File([blob], name, { type: blob.type })
               const id = `copy-${name}-${Date.now()}`
               pushFileTask({ id, kind: 'upload', name: name, dir: path, progress: 0, total: blob.size, loaded: 0, bps: 0, status: 'running' })
               await startUpload(id, file, path)
            } catch (e) {
               console.error('Copy failed', e)
               alert(`复制失败: ${name} (可能是文件夹或太大)`)
            }
         }
       }
       await reloadCurrentDir()
       // Copy keeps clipboard
    }
  }

  const handleRename = (name: string) => {
    setRenameTarget(name)
    setRenameNewName(name)
    setShowRenameModal(true)
  }

  const confirmRename = async () => {
    if (renameNewName && renameNewName !== renameTarget) {
      try {
        await fmApi.fsRename(joinPath(path, renameTarget), joinPath(path, renameNewName))
        await reloadCurrentDir()
      } catch (e) {
        console.error(e)
        alert('重命名失败')
      }
    }
    setShowRenameModal(false)
  }

  const handleNewFolder = () => {
    setNewFolderName('新建文件夹')
    setShowNewFolderModal(true)
  }

  const confirmNewFolder = async () => {
    if (newFolderName) {
       try {
         await fmApi.fsMkdir(joinPath(path, newFolderName))
         await reloadCurrentDir()
       } catch (e) {
         console.error(e)
         alert('创建文件夹失败')
       }
       setShowNewFolderModal(false)
    }
  }

  const handleNewFile = () => {
    setNewFileName('New File.txt')
    setShowNewFileModal(true)
  }

  const confirmNewFile = async () => {
    if (newFileName) {
      const name = newFileName
      const file = new File([""], name, { type: "text/plain" })
      const id = `new-${name}-${Date.now()}`
      pushFileTask({ id, kind: 'upload', name, dir: path, progress: 0, total: 0, loaded: 0, bps: 0, status: 'running' })
      setShowNewFileModal(false)
      await startUpload(id, file, path)
    }
  }
  
  const handleDelete = (names: string[]) => {
      setItemsToDelete(names)
      setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
      const names = itemsToDelete
      for (const n of names) {
        const p = joinPath(path, n)
        const id = `del-${n}-${Date.now()}`
        pushFileTask({ id, kind: 'delete', name: n, dir: path, status: 'running' })
        try {
          await api.fsDelete(p)
          updateFileTask(id, { status: 'done' })
        } catch (e) {
          updateFileTask(id, { status: 'error' })
        }
      }
      await reloadCurrentDir()
      clearSelection()
      setShowDeleteModal(false)
  }

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return []
    const { name } = contextMenu
    if (name) {
      // File Context
      return [
        { 
          label: '打开', 
          disabled: selected.size > 1,
          onClick: () => {
            const entry = entries.find(e => e.name === name)
            if (entry?.is_dir) {
               setSelected(new Set())
               navigate(joinPath(path, name))
            } else {
               // Open file
            }
          }
        },
        { 
          label: '下载', 
          onClick: () => {
             const fullPath = joinPath(path, name)
             const url = api.fsDownloadUrl(fullPath)
             window.open(url, '_blank')
          }
        },
        { divider: true },
        { label: '剪切', onClick: () => handleCut(getTargetItems(name)) },
        { label: '复制', onClick: () => handleCopy(getTargetItems(name)) },
        { label: '粘贴', disabled: !clipboard, onClick: handlePaste },
        { divider: true },
        { label: '重命名', disabled: selected.size > 1, onClick: () => handleRename(name) },
        { label: '删除', color: '#ff3b30', onClick: () => handleDelete(getTargetItems(name)) }
      ]
    } else {
      // Background Context
      return [
        { label: '新建文件夹', onClick: handleNewFolder },
        { label: '新建文本文件', onClick: handleNewFile },
        { divider: true },
        { label: '粘贴', disabled: !clipboard, onClick: handlePaste },
        { divider: true },
        { label: '刷新', onClick: reloadCurrentDir }
      ]
    }
  }, [contextMenu, clipboard, selected, path, entries])

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
      await fmApi.fsMkdir(to)
    }
    setSelected(new Set())
    navigate(to)
  }

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

  const startResize = (key: keyof typeof colWidths, nextKey: keyof typeof colWidths | null, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingKey(key as string)
    const startX = e.clientX
    const startW = colWidths[key]
    const startNextW = nextKey ? colWidths[nextKey] : 0
    
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      
      if (nextKey) {
        // Adjust both columns to keep total width constant
        // Current column cannot be smaller than 60
        // Next column cannot be smaller than 60
        
        let validDx = dx
        if (startW + dx < 60) {
          validDx = 60 - startW
        } else if (startNextW - dx < 60) {
          validDx = startNextW - 60
        }
        
        setColWidths((cw) => ({ 
          ...cw, 
          [key]: startW + validDx,
          [nextKey]: startNextW - validDx
        }))
      } else {
        // Fallback for single column resize (should not happen for inner columns)
        const next = Math.max(60, startW + dx)
        setColWidths((cw) => ({ ...cw, [key]: next }))
      }
    }
    const onUp = () => {
      setResizingKey(null)
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
  const handleRemoveTask = (t: FileTask) => {
    if (t.kind === 'upload' && t.status !== 'done') {
      setTaskToCancel(t)
      setShowCancelTaskModal(true)
    } else {
       uploadFilesMap.current.delete(t.id)
       removeFileTask(t.id)
    }
  }

  const confirmCancelTask = async () => {
    if (taskToCancel) {
        const t = taskToCancel
        uploadFilesMap.current.delete(t.id)
        const controller = abortControllers.current.get(t.id)
        if (controller) {
          controller.abort()
        }
        const fullPath = t.dir === '/' ? `/${t.name}` : `${t.dir}/${t.name}`
        try {
            await fmApi.fsDelete(fullPath)
        } catch(e) {}
        if (path === t.dir) {
          refresh()
        }
        removeFileTask(t.id)
        setTaskToCancel(null)
        setShowCancelTaskModal(false)
    }
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
    handleDelete([...selected])
  }

  const onEmptyTrash = () => {
    if (entries.length === 0) return
    setShowEmptyTrashModal(true)
  }

  const confirmEmptyTrash = async () => {
    const names = entries.map(e => e.name)
    for (const n of names) {
      const p = `/Trash/${n}`
      await fmApi.fsDelete(p)
    }
    const rs = await fmApi.fsList(path)
    setEntries(rs.entries)
    clearSelection()
    setShowEmptyTrashModal(false)
  }
  const onRestoreOne = async (name: string) => {
    await fmApi.fsRename(`/Trash/${name}`, `/${name}`)
    await reloadCurrentDir()
  }
  const onDeleteOne = async (name: string) => {
    handleDelete([name])
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
              onCreateFolder={handleNewFolder}
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
              onDeleteSelected={async () => handleDelete([...selected])}
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
            <div 
               id="fm-list-container" 
               ref={listContainerRef}
               style={{ flex: 1, overflow: 'auto', padding: 0, color: '#1c1c1e', fontSize: 14, background: '#ffffff', position: 'relative' }}
               onContextMenu={(e) => handleContextMenu(e, '')}
               onMouseDown={handleContainerMouseDown}
            >
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
                    resizingKey={resizingKey}
                    onOpenDir={(name) => {
                      setSelected(new Set())
                      navigate(joinPath(path, name))
                    }}
                    onContextMenu={handleContextMenu}
                  />
                </>
              ) : (
                <GridView
                  path={path}
                  filtered={filtered}
                  selected={selected}
                  setSelected={(s) => setSelected(new Set(s))}
                  clearSelection={clearSelection}
                  toggleSelect={toggleSelect}
                  onOpenDir={(name) => {
                    setSelected(new Set())
                    navigate(joinPath(path, name))
                  }}
                  onContextMenu={handleContextMenu}
                />
              )}
              {dragSelect && createPortal(
                 <div
                   style={{
                      position: 'fixed',
                      left: Math.min(dragSelect.startX, dragSelect.curX),
                      top: Math.min(dragSelect.startY, dragSelect.curY),
                      width: Math.abs(dragSelect.curX - dragSelect.startX),
                      height: Math.abs(dragSelect.curY - dragSelect.startY),
                      border: '1px solid rgba(0, 122, 255, 0.3)',
                      backgroundColor: 'rgba(0, 122, 255, 0.1)',
                      pointerEvents: 'none',
                      zIndex: 9999
                   }}
                 />,
                 document.body
              )}
            </div>
            <FooterCount count={filtered.length} />
          </>
        )}
      </div>
      {contextMenu && (
         <ContextMenu
           x={contextMenu.x}
           y={contextMenu.y}
           items={contextMenuItems}
           onClose={closeContextMenu}
         />
      )}
      
      {showNewFolderModal && (
        <Modal
          title="新建文件夹"
          onClose={() => setShowNewFolderModal(false)}
          onConfirm={confirmNewFolder}
          confirmText="创建"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#374151' }}>文件夹名称</label>
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmNewFolder()
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: 14,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.select()}
            />
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal
          title="删除文件"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          confirmText="删除"
          danger
        >
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            确定要删除选中的 {itemsToDelete.length} 个项目吗？
            <br />
            <span style={{ fontSize: 13, color: '#6b7280' }}>此操作无法撤销。</span>
          </p>
        </Modal>
      )}

      {showEmptyTrashModal && (
        <Modal
          title="清空回收站"
          onClose={() => setShowEmptyTrashModal(false)}
          onConfirm={confirmEmptyTrash}
          confirmText="清空"
          danger
        >
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            确定要永久删除回收站中的所有项目吗？
            <br />
            <span style={{ fontSize: 13, color: '#6b7280' }}>此操作无法撤销。</span>
          </p>
        </Modal>
      )}

      {showRenameModal && (
        <Modal
          title="重命名"
          onClose={() => setShowRenameModal(false)}
          onConfirm={confirmRename}
          confirmText="确定"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#374151' }}>新名称</label>
            <input
              autoFocus
              value={renameNewName}
              onChange={e => setRenameNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmRename()
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: 14,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.select()}
            />
          </div>
        </Modal>
      )}

      {showNewFileModal && (
        <Modal
          title="新建文本文件"
          onClose={() => setShowNewFileModal(false)}
          onConfirm={confirmNewFile}
          confirmText="创建"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, color: '#374151' }}>文件名称</label>
            <input
              autoFocus
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmNewFile()
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: 14,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.select()}
            />
          </div>
        </Modal>
      )}

      {showCancelTaskModal && (
        <Modal
          title="取消任务"
          onClose={() => setShowCancelTaskModal(false)}
          onConfirm={confirmCancelTask}
          confirmText="取消任务"
          danger
        >
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            确定要取消该任务吗？
            <br />
            <span style={{ fontSize: 13, color: '#6b7280' }}>取消后将删除已上传的部分文件。</span>
          </p>
        </Modal>
      )}
    </div>
  )
}
