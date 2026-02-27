import { useCallback } from 'react'
import { api } from '../../../../src/api/client'
import { FileEntry, TrashMetadata } from '../types'
import { joinPath, getUniqueName } from '../utils'
import { pushFileTask, updateFileTask } from '../../../../src/sdk/desktop'

interface UseTrashOperationsProps {
  trashMetadata: Record<string, TrashMetadata>
  setTrashMetadata: (data: Record<string, TrashMetadata>) => void
  loadTrashMetadata: () => Promise<any>
  saveTrashMetadata: (data: Record<string, TrashMetadata>) => Promise<void>
  reloadCurrentDir: () => Promise<void>
  clearSelection: () => void
  setDirCache: React.Dispatch<React.SetStateAction<Record<string, FileEntry[]>>>
  expandedDirs: Set<string>
  entries: FileEntry[]
  currentPath: string
}

// Helper to ensure parent directories exist
const ensureParentDir = async (targetPath: string) => {
  const parent = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/'
  if (parent === '/' || parent === '') return
  
  const parts = parent.split('/').filter(Boolean)
  let current = ''
  for (const p of parts) {
    current = `${current}/${p}`
    try {
       await api.fsList(current)
    } catch {
       try {
          await api.fsMkdir(current)
       } catch (e) {}
    }
  }
}

// Helper to find a non-conflicting path
const getNonConflictingPath = async (parentDir: string, originalName: string): Promise<string> => {
    try {
        const res = await api.fsList(parentDir)
        const existing = new Set(res.entries.map((e: any) => e.name))
        
        if (!existing.has(originalName)) {
            return parentDir === '/' ? `/${originalName}` : `${parentDir}/${originalName}`
        }
        
        let attempt = 1
        const parts = originalName.split('.')
        let nameBase = originalName
        let nameExt = ''
        if (parts.length > 1 && !originalName.startsWith('.')) {
            nameExt = '.' + parts.pop()
            nameBase = parts.join('.')
        }
        
        let newName = `${nameBase} (${attempt})${nameExt}`
        while (existing.has(newName)) {
            attempt++
            newName = `${nameBase} (${attempt})${nameExt}`
        }
        return parentDir === '/' ? `/${newName}` : `${parentDir}/${newName}`
    } catch (e) {
        console.warn(`Collision check failed for ${parentDir}/${originalName}`, e)
        // Fallback to original path if listing fails
        return parentDir === '/' ? `/${originalName}` : `${parentDir}/${originalName}`
    }
}

export function useTrashOperations({
  trashMetadata,
  setTrashMetadata,
  loadTrashMetadata,
  saveTrashMetadata,
  reloadCurrentDir,
  clearSelection,
  setDirCache,
  expandedDirs,
  entries,
  currentPath
}: UseTrashOperationsProps) {

  const handleDelete = useCallback(async (names: string[]) => {
      let currentMetadata: Record<string, TrashMetadata> = {}
      
      if (currentPath === '/Trash') {
        currentMetadata = { ...trashMetadata }
      }

      const targetParentsToRefresh = new Set<string>()

      for (const n of names) {
        const fullPath = n.startsWith('/') ? n : joinPath(currentPath, n)
        const name = fullPath.split('/').pop() || ''
        if (!name) continue

        const id = `del-${name}-${Date.now()}`
        pushFileTask({ id, kind: 'delete', name, dir: currentPath, status: 'running' })
        try {
          if (currentPath.startsWith('/Trash')) {
             // Permanent delete from Trash
             await api.fsDelete(fullPath)
             if (currentMetadata[name]) {
                 delete currentMetadata[name]
             }
          } else {
             // Delegate move-to-trash to backend
             await api.fsDelete(fullPath)
             const parent = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/'
             if (parent !== currentPath && expandedDirs.has(parent)) {
                 targetParentsToRefresh.add(parent)
             }
          }
          updateFileTask(id, { status: 'done' })

        } catch (e) {
          console.error('Delete operation failed for:', n, e)
          updateFileTask(id, { status: 'error' })
        }
      }
      
      // Keep metadata update only when operating inside Trash
      if (currentPath.startsWith('/Trash')) {
        await saveTrashMetadata(currentMetadata)
      }
      
      await reloadCurrentDir()
      
      // Refresh parent directories for nested items if they are expanded
      for (const p of targetParentsToRefresh) {
          try {
              const res = await api.fsList(p)
              setDirCache(prev => ({ ...prev, [p]: res.entries as FileEntry[] }))
          } catch (e) {
              console.error(`Failed to refresh target parent dir ${p}`, e)
          }
      }
      
      clearSelection()
  }, [trashMetadata, loadTrashMetadata, saveTrashMetadata, reloadCurrentDir, clearSelection, expandedDirs, setDirCache, entries, currentPath])

  const restoreItems = useCallback(async (names: string[]) => {
    const targetParentsToRefresh = new Set<string>()
    
    for (const n of names) {
      const entry = entries.find(e => e.name === n)
      if (!entry) continue
      
      const fileName = entry.original_path ? entry.original_path.split('/').pop() || '' : n.split('/').pop() || ''
      if (!fileName) continue
      
      let originalPath = ''
      if (entry.original_path) {
        originalPath = entry.original_path
      } else if (trashMetadata[fileName] && trashMetadata[fileName].originalPath) {
        originalPath = trashMetadata[fileName].originalPath
      } else {
        originalPath = `/User/admin/${fileName}`
      }
      
      const originalDir = originalPath.substring(0, originalPath.lastIndexOf('/')) || '/'
      const sourcePath = originalDir === '/' ? `/Trash/${fileName}` : `/Trash${originalDir}/${fileName}`
      
      const finalPath = await getNonConflictingPath(
        originalDir,
        fileName
      )
      
      try {
        await ensureParentDir(finalPath)
        await api.fsRename(sourcePath, finalPath)
        const parent = finalPath.substring(0, finalPath.lastIndexOf('/')) || '/'
        targetParentsToRefresh.add(parent)
      } catch (e) {
        console.error(`Failed to restore ${sourcePath} to ${finalPath}`, e)
      }
    }
    
    await reloadCurrentDir()
    for (const p of targetParentsToRefresh) {
      try {
        const res = await api.fsList(p)
        setDirCache(prev => ({ ...prev, [p]: res.entries }))
      } catch (e) {
        console.error(`Failed to refresh target parent dir ${p}`, e)
      }
    }
    clearSelection()
  }, [reloadCurrentDir, clearSelection, setDirCache, currentPath, trashMetadata, entries])

  const emptyTrash = useCallback(async () => {
    if (entries.length === 0) return
    
    const names = entries.map(e => e.name)
    for (const n of names) {
      const p = `/Trash/${n}`
      await api.fsDelete(p)
    }
    try {
        await api.fsDelete('/Trash/.trashinfo')
    } catch {}
    setTrashMetadata({})
    
    if (currentPath.startsWith('/Trash')) {
        await reloadCurrentDir()
    }
    clearSelection()
  }, [saveTrashMetadata, reloadCurrentDir, clearSelection, entries, currentPath, setTrashMetadata])

  return { handleDelete, restoreItems, emptyTrash }
}
