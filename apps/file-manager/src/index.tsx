import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Folder,
  Home,
  Package,
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
import { Modal } from '../../../src/components/Modal'

import { api } from '../../../src/api/client'
import { useNavigation } from './hooks/useNavigation'
import { useSelection } from './hooks/useSelection'
import { useTrash } from './hooks/useTrash'
import { useTrashOperations } from './hooks/useTrashOperations'
import { useDragSelection } from './hooks/useDragSelection'
import { useFileDragAndDrop } from './hooks/useFileDragAndDrop'
import { useFileUpload } from './hooks/useFileUpload'
import { useClipboard } from './hooks/useClipboard'
import { joinPath, fmtTime, fmtSize, getUniqueName, filterSystemEntries } from './utils'
import { FileEntry, TrashMetadata, ClipboardItem, DragSelection, SortKey, SortOrder, ViewMode, ColumnWidths } from './types'

const btnCancelStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: 'white',
  color: '#374151',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer'
}

const btnConfirmStyle = (danger?: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  background: danger ? '#ef4444' : '#2563eb',
  color: 'white',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer'
})
 
const fmApi = api

export default function FileManager({ initialPath }: { initialPath?: string }) {
  const { path, setPath, navHist, navIndex, navigate, back, forward, crumbs } = useNavigation(initialPath || '/')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [tasks, setTasks] = useState<FileTask[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [active, setActive] = useState<string>('home')
  const [view, setView] = useState<ViewMode>('list')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; name: string } | null>(null)
  const [q, setQ] = useState<string>('')
  const { selected, setSelected, toggleSelect, clearSelection, selectAll, isSelected } = useSelection()
  const { dragSelect, handleContainerMouseDown } = useDragSelection({ path, view, selected, setSelected })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)
  const sortButtonRef = useRef<HTMLButtonElement | null>(null)
  const [transferTab, setTransferTab] = useState<'upload' | 'download'>('upload')
  const [colWidths, setColWidths] = useState<ColumnWidths>({
    name: 172,
    modified: 149,
    type: 60,
    size: 85,
    created: 105,
    owner: 120,
    originalPath: 200,
  })

  const reloadCurrentDir = async () => {
    const rs = await fmApi.fsList(path)
    let entries = rs.entries as FileEntry[]
    entries = filterSystemEntries(entries, path) as FileEntry[]
    setEntries(entries)
  }

  const {
    startUpload,
    handleUploadFiles,
    getAvgSpeed,
    uploadFilesMap
  } = useFileUpload({ path, reloadCurrentDir, setTasks })
  
  const {
    clipboard,
    setClipboard,
    handleCopy,
    handleCut,
    handlePaste
  } = useClipboard({ path, reloadCurrentDir, startUpload })

  // New State
  const [resizingKey, setResizingKey] = useState<string | null>(null)
  
  // Expandable dirs state
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [dirCache, setDirCache] = useState<Record<string, FileEntry[]>>({})

  const listContainerRef = useRef<HTMLDivElement>(null)

  // Modals state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([])
  const { trashMetadata, setTrashMetadata, loadTrashMetadata, saveTrashMetadata } = useTrash()
  
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false)
  
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameTarget, setRenameTarget] = useState('')
  const [renameNewName, setRenameNewName] = useState('')
  
  const {
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useFileDragAndDrop({ path, renameTarget, reloadCurrentDir })
  
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const [showCancelTaskModal, setShowCancelTaskModal] = useState(false)
  const [taskToCancel, setTaskToCancel] = useState<FileTask | null>(null)

  const { handleDelete: deleteItems, restoreItems, emptyTrash } = useTrashOperations({
    trashMetadata,
    setTrashMetadata,
    loadTrashMetadata,
    saveTrashMetadata,
    reloadCurrentDir,
    clearSelection,
    setDirCache,
    expandedDirs,
    entries,
    currentPath: path
  })


  useEffect(() => {
    setEntries([])
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
        let entries = r.entries as FileEntry[]
        entries = filterSystemEntries(entries, path) as FileEntry[]

        if (path.startsWith('/Trash')) {
           loadTrashMetadata()
        }
        setEntries(entries)
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
                let appended = rr.entries.filter(e => !seen.has(e.name)) as FileEntry[]
                appended = filterSystemEntries(appended, path) as FileEntry[]
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

  // Sync current entries to dirCache
  useEffect(() => {
    if (!loading) {
      setDirCache(prev => {
        if (prev[path] === entries) return prev
        return { ...prev, [path]: entries }
      })
    }
  }, [entries, path, loading])

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



  // Enhanced Operations
  const getTargetItems = (clickedName?: string) => {
    if (clickedName && !selected.has(clickedName)) {
      return [clickedName]
    }
    return Array.from(selected)
  }



  const handleRename = (name: string) => {
    setRenameTarget(name)
    setRenameNewName(name.split('/').pop() || name)
    setShowRenameModal(true)
  }

  const confirmRename = async () => {
    const currentName = renameTarget.split('/').pop() || renameTarget
    if (renameNewName && renameNewName !== currentName) {
      try {
        const parent = renameTarget.substring(0, renameTarget.lastIndexOf('/')) || '/'
        const p = parent === '' ? '/' : parent // Handle case where renameTarget was /foo
        const to = p === '/' ? `/${renameNewName}` : `${p}/${renameNewName}`
        await fmApi.fsRename(renameTarget, to)
        await reloadCurrentDir()
      } catch (e) {
        console.error(e)
        alert('重命名失败')
      }
    }
    setShowRenameModal(false)
  }

  const [newFolderError, setNewFolderError] = useState('')
  const [newFileError, setNewFileError] = useState('')

  const handleNewFolder = () => {
    setNewFolderName(getUniqueName('新建文件夹', new Set(entries.map(e => e.name))))
    setNewFolderError('')
    setShowNewFolderModal(true)
  }

  const confirmNewFolder = async () => {
    if (newFolderName) {
      if (entries.some(e => e.name === newFolderName)) {
        setNewFolderError('该文件夹名称已存在，请使用其他名称')
        return
      }

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
    setNewFileName(getUniqueName('新建文本文件.txt', new Set(entries.map(e => e.name)), true))
    setNewFileError('')
    setShowNewFileModal(true)
  }

  const confirmNewFile = async () => {
    if (newFileName) {
      if (entries.some(e => e.name === newFileName)) {
        setNewFileError('该文件名称已存在，请使用其他名称')
        return
      }
      const name = newFileName
      const file = new File([""], name, { type: "text/plain" })
      const id = `new-${name}-${Date.now()}`
      pushFileTask({ id, kind: 'upload', name, dir: path, progress: 0, total: 0, loaded: 0, bps: 0, status: 'running' })
      setShowNewFileModal(false)
      await startUpload(id, file, path)
    }
  }
  
  const handleDelete = async (names: string[]) => {
      setItemsToDelete(names)
      setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
      await deleteItems(itemsToDelete)
      setShowDeleteModal(false)
  }



  const onEmptyTrash = () => {
    if (entries.length === 0) return
    setShowEmptyTrashModal(true)
  }

  const confirmEmptyTrash = async () => {
    await emptyTrash()
    setShowEmptyTrashModal(false)
  }

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return []
    const { name } = contextMenu

    if (path.startsWith('/Trash')) {
      if (name) {
         return [
            { label: '还原', onClick: () => onRestoreOne(name) },
            { label: '彻底删除', color: '#ff3b30', onClick: () => onDeleteOne(name) }
         ]
      } else {
         return [
            { label: '清空回收站', color: '#ff3b30', onClick: onEmptyTrash },
            { divider: true },
            { label: '刷新', onClick: reloadCurrentDir }
         ]
      }
   }

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
        { label: '上传文件', onClick: () => fileInputRef.current?.click() },
        { label: '新建文件夹', onClick: handleNewFolder },
        { label: '新建文本文件', onClick: handleNewFile },
        { divider: true },
        { label: '粘贴', disabled: !clipboard, onClick: handlePaste },
        { divider: true },
        { label: '刷新', onClick: reloadCurrentDir }
      ]
    }
  }, [contextMenu, clipboard, selected, path, entries])

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

  const toggleExpand = async (entryName: string) => {
    const fullPath = entryName.startsWith('/') ? entryName : joinPath(path, entryName)
    const next = new Set(expandedDirs)
    if (next.has(fullPath)) {
      next.delete(fullPath)
    } else {
      next.add(fullPath)
      if (!dirCache[fullPath]) {
        try {
          const res = await fmApi.fsList(fullPath)
          setDirCache(prev => ({ ...prev, [fullPath]: res.entries }))
        } catch (e) {
          console.error("Failed to list dir", fullPath, e)
        }
      }
    }
    setExpandedDirs(next)
  }

  const filtered = useMemo(() => {
    const sortFn = (a: { name: string; size: number; modified_ts: number }, b: { name: string; size: number; modified_ts: number }) => {
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortKey === 'size') {
        comparison = (a.size || 0) - (b.size || 0)
      } else {
        comparison = (a.modified_ts || 0) - (b.modified_ts || 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    }

    const qq = q.trim().toLowerCase()
    if (qq) {
      const base = [...entries].sort(sortFn)
      return base.filter(e => e.name.toLowerCase().includes(qq)).map(e => ({...e, level: 0, path: joinPath(path, e.name)}))
    }

    // Sort entries for Trash: group by name, then deletion time?
    // Actually, we just need to map them to display names.
    // We should parse the timestamp from the name for root items.
    const result: any[] = []
    
    const process = (items: typeof entries, parentPath: string, level: number) => {
      const sorted = [...items].sort(sortFn)
      for (const item of sorted) {
        let fullPath = joinPath(parentPath, item.name)
        let isExpanded = expandedDirs.has(fullPath)
        
        // For Trash Root Items, we want to display the original name
        let displayName = item.name
        let meta = trashMetadata[item.name]
        let isDir = item.is_dir
        let size = item.size
        
        if (path === '/Trash' && level === 0) {
           if (meta) {
               displayName = meta.name || item.name
               // New format: /Trash/timestamp/originalName
               // Override path to point to content
               fullPath = joinPath(fullPath, meta.name || item.name)
               // Check expanded state for the inner path
               isExpanded = expandedDirs.has(fullPath)
               // Override properties from metadata
               isDir = meta.is_dir !== undefined ? meta.is_dir : item.is_dir
               size = meta.size !== undefined ? meta.size : item.size
           } else {
               // Fallback for old items (timestamp_name)
               const parts = item.name.split('_')
               if (parts.length > 1 && /^\d+$/.test(parts[0])) {
                   const originalName = parts.slice(1).join('_')
                   displayName = originalName
                   if (!meta) {
                       // Mock metadata if missing
                       meta = { originalPath: `/${originalName}`, deletionTime: parseInt(parts[0]) }
                   }
               }
           }
        }
        
        // For nested items in Trash, just show their name
        
        result.push({
          ...item,
          name: item.name, // Keep original name (UUID for trash)
          displayName: displayName, // Pass display name separately if needed
          realName: item.name, // Keep real name for logic
          is_dir: isDir,
          size: size,
          level,
          expanded: isExpanded,
          path: fullPath
        })
        
        if (isDir && isExpanded && dirCache[fullPath]) {
          process(dirCache[fullPath], fullPath, level + 1)
        }
      }
    }
    
    process(entries, path, 0)
    return result
  }, [entries, sortKey, sortOrder, q, expandedDirs, dirCache, path, trashMetadata])

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

  const startResize = (
    key: keyof typeof colWidths, 
    nextKey: keyof typeof colWidths | null, 
    e: React.MouseEvent,
    options: {
      containerRef?: React.RefObject<HTMLDivElement> | null,
      fixedCols?: string[],
      minFluidWidth?: number
    } = {}
  ) => {
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
        let next = Math.max(60, startW + dx)

        // Constraint to window boundary
        const container = options.containerRef?.current || listContainerRef.current
        if (container) {
          const containerWidth = container.clientWidth
          // Default to ListView fixed cols if not provided
          const fixedCols = options.fixedCols || ['name', 'modified', 'type']
          const otherFixedCols = fixedCols.filter(k => k !== key)
          const usedByOthers = otherFixedCols.reduce((acc, k) => acc + (colWidths[k] || 0), 0)
          const minFluidWidth = options.minFluidWidth || 80 // Reserved for fluid column
          const maxAvailable = containerWidth - usedByOthers - minFluidWidth
          
          if (next > maxAvailable) {
            next = Math.max(60, maxAvailable)
          }
        }

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

  const handleTrashDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverItem(null)
    try {
      const dataStr = e.dataTransfer.getData('application/json')
      if (!dataStr) return
      const data = JSON.parse(dataStr)
      if (data.path) {
        handleDelete([data.path])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const sections = useMemo(() => {
    const runningCount = tasks.filter(t => (t.kind === 'upload' || t.kind === 'download') && (t.status === 'running' || t.status === 'pending')).length
    return [
    {
      title: '文件',
      items: [
        { 
          id: 'home', 
          label: '我的文件', 
          icon: <Home size={20} strokeWidth={1.5} />,
          onDragOver: (e: React.DragEvent) => handleDragOver(e, { name: 'Home', is_dir: true, path: '/' }),
          onDrop: (e: React.DragEvent) => handleDrop(e, { name: 'Home', is_dir: true, path: '/' }),
          onDragLeave: handleDragLeave,
          highlighted: dragOverItem === '/'
        },
        { 
          id: 'team', 
          label: '团队文件', 
          icon: <Users size={20} strokeWidth={1.5} />,
          onDragOver: (e: React.DragEvent) => handleDragOver(e, { name: 'Team', is_dir: true, path: '/Team' }),
          onDrop: (e: React.DragEvent) => handleDrop(e, { name: 'Team', is_dir: true, path: '/Team' }),
          onDragLeave: handleDragLeave,
          highlighted: dragOverItem === '/Team'
        },
        { 
          id: 'appdata', 
          label: '应用文件', 
          icon: <Package size={20} strokeWidth={1.5} />,
          onDragOver: (e: React.DragEvent) => handleDragOver(e, { name: 'AppData', is_dir: true, path: '/AppData' }),
          onDrop: (e: React.DragEvent) => handleDrop(e, { name: 'AppData', is_dir: true, path: '/AppData' }),
          onDragLeave: handleDragLeave,
          highlighted: dragOverItem === '/AppData'
        },
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
        { 
          id: 'trash', 
          label: '回收站', 
          icon: <Trash2 size={20} strokeWidth={1.5} />,
          onDragOver: (e: React.DragEvent) => handleDragOver(e, { name: 'Trash', is_dir: true, path: '/Trash' }),
          onDrop: handleTrashDrop,
          onDragLeave: handleDragLeave,
          highlighted: dragOverItem === '/Trash'
        },
      ]
    }
  ]
  }, [tasks, path, dragOverItem])

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
        ) : path.startsWith('/Trash') ? (
          <TrashPane
            loading={loading}
            entries={entries}
            filtered={filtered}
            selected={selected}
            setSelected={setSelected}
            clearSelection={clearSelection}
            toggleSelect={toggleSelect}
            fmtTime={fmtTime}
            fmtSize={fmtSize}
            onRestoreSelected={() => restoreItems([...selected])}
            onDeleteSelected={() => handleDelete([...selected])}
            onEmptyTrash={onEmptyTrash}
            onRestoreOne={(name) => restoreItems([name])}
            onDeleteOne={(name) => handleDelete([name])}
            colWidths={colWidths}
            startResize={startResize}
            headerCheckboxRef={headerCheckboxRef}
            resizingKey={resizingKey}
            onContextMenu={handleContextMenu}
            onOpenDir={(name) => {
               // Do nothing on double click in Trash
            }}
            trashMetadata={trashMetadata}
            onToggleExpand={toggleExpand}
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
              onUploadFiles={handleUploadFiles}
              onCreateFolder={handleNewFolder}
              onDownloadSelected={async () => {
                const names = [...selected].filter(n => !filtered.find(f => (f.path || f.name) === n)?.is_dir)
                if (names.length === 0) return
                const first = names[0]
                const fullPath = first
                const url = api.fsDownloadUrl(fullPath)
                window.open(url, '_blank')
                const name = first.split('/').pop() || first
                const parent = first.substring(0, first.lastIndexOf('/')) || '/'
                const id = `dl-${name}-${Date.now()}`
                pushFileTask({ id, kind: 'download', name: name, dir: parent, progress: 100, status: 'done' })
              }}
              onDeleteSelected={async () => handleDelete([...selected])}
              sortKey={sortKey}
              setSortKey={(k) => setSortKey(k)}
              sortOrder={sortOrder}
              setSortOrder={(o) => setSortOrder(o)}
              view={view}
              setView={(v) => setView(v)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={handleDragLeave}
              dragOverItem={dragOverItem}
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
               onDragOver={(e) => handleDragOver(e, null)}
               onDrop={(e) => handleDrop(e, null)}
            >
              {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div className="fm-spinner" />
                  <style>{`
                    .fm-spinner {
                      width: 24px;
                      height: 24px;
                      border: 3px solid #e5e5ea;
                      border-top-color: #007aff;
                      border-radius: 50%;
                      animation: fm-spin 0.8s linear infinite;
                    }
                    @keyframes fm-spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : view === 'list' ? (
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
                      const target = name.startsWith('/') ? name : joinPath(path, name)
                      navigate(target)
                    }}
                    onContextMenu={handleContextMenu}
                    onToggleExpand={toggleExpand}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                    dragOverItem={dragOverItem}
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
                    const target = name.startsWith('/') ? name : joinPath(path, name)
                    navigate(target)
                  }}
                  onContextMenu={handleContextMenu}
                  onToggleExpand={toggleExpand}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                  dragOverItem={dragOverItem}
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
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          handleUploadFiles(e.target.files)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
      />

      <Modal
        open={showNewFolderModal}
        title="新建文件夹"
        onClose={() => setShowNewFolderModal(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowNewFolderModal(false)} style={btnCancelStyle}>取消</button>
            <button onClick={confirmNewFolder} style={btnConfirmStyle()}>创建</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, color: '#374151' }}>文件夹名称</label>
          <input
            autoFocus
            value={newFolderName}
            onChange={e => {
              setNewFolderName(e.target.value)
              setNewFolderError('')
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmNewFolder()
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${newFolderError ? '#ef4444' : '#d1d5db'}`,
              fontSize: 14,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.target.select()}
          />
          {newFolderError && (
            <div style={{ fontSize: 12, color: '#ef4444' }}>{newFolderError}</div>
          )}
        </div>
      </Modal>

      <Modal
        open={showDeleteModal}
        title="删除文件"
        onClose={() => setShowDeleteModal(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowDeleteModal(false)} style={btnCancelStyle}>取消</button>
            <button onClick={confirmDelete} style={btnConfirmStyle(true)}>删除</button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
          {path === '/Trash' ? (
            <>
              确定要删除选中的 {itemsToDelete.length} 个项目吗？
              <br />
              <span style={{ fontSize: 13, color: '#6b7280' }}>此操作无法撤销。</span>
            </>
          ) : (
            <>
              确定要将选中的 {itemsToDelete.length} 个项目放入回收站吗？
              <br />
              <span style={{ fontSize: 13, color: '#6b7280' }}>回收站中的项目将在 30 天后自动删除。</span>
            </>
          )}
        </p>
      </Modal>

      <Modal
        open={showEmptyTrashModal}
        title="清空回收站"
        onClose={() => setShowEmptyTrashModal(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowEmptyTrashModal(false)} style={btnCancelStyle}>取消</button>
            <button onClick={confirmEmptyTrash} style={btnConfirmStyle(true)}>清空</button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
          确定要永久删除回收站中的所有项目吗？
          <br />
          <span style={{ fontSize: 13, color: '#6b7280' }}>此操作无法撤销。</span>
        </p>
      </Modal>

      <Modal
        open={showRenameModal}
        title="重命名"
        onClose={() => setShowRenameModal(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowRenameModal(false)} style={btnCancelStyle}>取消</button>
            <button onClick={confirmRename} style={btnConfirmStyle()}>确定</button>
          </div>
        }
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

      <Modal
        open={showNewFileModal}
        title="新建文本文件"
        onClose={() => setShowNewFileModal(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowNewFileModal(false)} style={btnCancelStyle}>取消</button>
            <button onClick={confirmNewFile} style={btnConfirmStyle()}>创建</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, color: '#374151' }}>文件名称</label>
          <input
            autoFocus
            value={newFileName}
            onChange={e => {
              setNewFileName(e.target.value)
              setNewFileError('')
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmNewFile()
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${newFileError ? '#ef4444' : '#d1d5db'}`,
              fontSize: 14,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
            onFocus={e => e.target.select()}
          />
          {newFileError && (
            <div style={{ fontSize: 12, color: '#ef4444' }}>{newFileError}</div>
          )}
        </div>
      </Modal>

      <Modal
        open={showCancelTaskModal}
        title="取消任务"
        onClose={() => setShowCancelTaskModal(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowCancelTaskModal(false)} style={btnCancelStyle}>取消</button>
            <button onClick={confirmCancelTask} style={btnConfirmStyle(true)}>取消任务</button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
          确定要取消该任务吗？
          <br />
          <span style={{ fontSize: 13, color: '#6b7280' }}>取消后将删除已上传的部分文件。</span>
        </p>
      </Modal>
    </div>
  )
}

