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

  const handleDelete = useCallback(async (names: string[]) => {
      let currentMetadata: Record<string, TrashMetadata> = {}
      
      if (currentPath !== '/Trash') {
         try {
             await api.fsMkdir('/Trash')
         } catch (e) {}
         
         try {
             const loaded = await loadTrashMetadata()
             currentMetadata = loaded || {}
         } catch (e) {
             console.error("Failed to load trash metadata", e)
         }
      } else {
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
             // n is the UUID (filename in Trash) or name if nested?
             // In Trash view, entries are flattened. name is the UUID.
             await api.fsDelete(fullPath)
             if (currentMetadata[name]) {
                 delete currentMetadata[name]
             }
          } else {
             // Move to Trash
             const from = fullPath
             
             // Generate UUID for the trash item
             const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
             const to = `/Trash/${uuid}`
             
             await api.fsRename(from, to)
             
             // Find entry to get metadata
             const entry = entries.find(e => e.name === name)
             
             currentMetadata[uuid] = {
                 originalPath: from,
                 deletionTime: Date.now(),
                 name: name,
                 is_dir: entry ? entry.is_dir : false,
                 size: entry ? entry.size : 0
             }
          }
          updateFileTask(id, { status: 'done' })
          
          if (currentPath !== '/Trash') {
            const parent = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/'
            if (parent !== currentPath && expandedDirs.has(parent)) {
                targetParentsToRefresh.add(parent)
            }
          }

        } catch (e) {
          console.error('Delete operation failed for:', n, e)
          updateFileTask(id, { status: 'error' })
        }
      }
      
      await saveTrashMetadata(currentMetadata)
      
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
    let currentMetadata: Record<string, TrashMetadata> = {}
    try {
        if (currentPath.startsWith('/Trash')) {
            const loaded = await loadTrashMetadata()
            currentMetadata = loaded || {}
        } else {
            currentMetadata = { ...trashMetadata }
        }
    } catch (e) {
        console.error('Failed to load trash metadata', e)
        currentMetadata = { ...trashMetadata }
    }

    const targetParentsToRefresh = new Set<string>()

    for (const n of names) {
        const name = n.startsWith('/') ? n.split('/').pop() || '' : n
        
        const meta = currentMetadata[name]
        if (!meta) {
            console.warn(`No metadata found for ${name}`)
            continue
        }

        const sourcePath = `/Trash/${name}`
        const originalPath = meta.originalPath
        
        await ensureParentDir(originalPath)

        let finalPath = originalPath
        try {
            const parent = originalPath.substring(0, originalPath.lastIndexOf('/')) || '/'
            const baseName = originalPath.split('/').pop() || ''
            
            const res = await api.fsList(parent)
            const existing = new Set(res.entries.map(e => e.name))
            
            if (existing.has(baseName)) {
                let attempt = 1
                const parts = baseName.split('.')
                let nameBase = baseName
                let nameExt = ''
                if (parts.length > 1 && !baseName.startsWith('.')) {
                    nameExt = '.' + parts.pop()
                    nameBase = parts.join('.')
                }
                
                let newName = `${nameBase} (${attempt})${nameExt}`
                while (existing.has(newName)) {
                    attempt++
                    newName = `${nameBase} (${attempt})${nameExt}`
                }
                finalPath = parent === '/' ? `/${newName}` : `${parent}/${newName}`
            }
        } catch (e) {
            console.warn(`Collision check failed for ${originalPath}`, e)
        }

        try {
            await api.fsRename(sourcePath, finalPath)
            if (currentMetadata[name]) {
                delete currentMetadata[name]
            }
            
            const parent = finalPath.substring(0, finalPath.lastIndexOf('/')) || '/'
            targetParentsToRefresh.add(parent)
        } catch (e) {
            console.error(`Failed to restore ${sourcePath} to ${finalPath}`, e)
        }
    }
    
    await saveTrashMetadata(currentMetadata)
    await reloadCurrentDir()
    
    for (const p of targetParentsToRefresh) {
        try {
            const res = await api.fsList(p)
            setDirCache(prev => ({ ...prev, [p]: res.entries as FileEntry[] }))
        } catch (e) {
            console.error(`Failed to refresh target parent dir ${p}`, e)
        }
    }
    
    clearSelection()
  }, [trashMetadata, loadTrashMetadata, saveTrashMetadata, reloadCurrentDir, clearSelection, setDirCache, currentPath])

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
    
    // We are in trash view if calling emptyTrash, usually.
    // If not, we should probably check path.
    // But usually empty trash button is only available in Trash view.
    // Assuming we are in trash view or want to empty it anyway.
    
    // reloadCurrentDir will clear entries if we are in Trash
    if (currentPath.startsWith('/Trash')) {
        await reloadCurrentDir()
    } else {
        // If we are outside trash, just clear metadata
    }
    clearSelection()
  }, [saveTrashMetadata, reloadCurrentDir, clearSelection, entries, currentPath, setTrashMetadata])

  return { handleDelete, restoreItems, emptyTrash }
}
