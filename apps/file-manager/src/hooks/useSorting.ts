import { useState, useMemo } from 'react'
import { FileEntry, TrashMetadata, SortKey, SortOrder } from '../types'
import { joinPath } from '../utils'

interface UseSortingProps {
  entries: FileEntry[]
  path: string
  expandedDirs: Set<string>
  dirCache: Record<string, FileEntry[]>
  trashMetadata: TrashMetadata
}

export function useSorting({
  entries,
  path,
  expandedDirs,
  dirCache,
  trashMetadata
}: UseSortingProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showSortMenu, setShowSortMenu] = useState<boolean>(false)
  const [q, setQ] = useState<string>('')

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
                       // @ts-ignore
                       meta = { originalPath: `/${originalName}`, deletionTime: parseInt(parts[0]) }
                   }
               }
           }
        }
        
        // For nested items in Trash, just show their name
        
        result.push({
          ...item,
          name: displayName, // Override name for display
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

  return {
    filtered,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    showSortMenu,
    setShowSortMenu,
    q,
    setQ
  }
}
