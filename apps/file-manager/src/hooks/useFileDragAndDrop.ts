import { useState } from 'react'
import { api } from '../../../../src/api/client'
import { joinPath } from '../utils'

interface UseFileDragAndDropProps {
  path: string
  renameTarget: string
  reloadCurrentDir: () => Promise<void>
}

export function useFileDragAndDrop({ path, renameTarget, reloadCurrentDir }: UseFileDragAndDropProps) {
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, item: { name: string, is_dir: boolean, path?: string }) => {
    if (renameTarget) {
      e.preventDefault()
      return
    }
    const itemPath = item.path || joinPath(path, item.name)
    e.dataTransfer.setData('application/json', JSON.stringify({
      path: itemPath,
      name: item.name,
      is_dir: item.is_dir
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, targetItem: { name: string, is_dir: boolean, path?: string } | null) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    if (targetItem && targetItem.is_dir) {
      const targetPath = targetItem.path || joinPath(path, targetItem.name)
      setDragOverItem(targetPath)
    } else {
      setDragOverItem(path)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverItem(null)
  }

  const handleDrop = async (e: React.DragEvent, targetItem: { name: string, is_dir: boolean, path?: string } | null) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverItem(null)

    try {
      const dataStr = e.dataTransfer.getData('application/json')
      if (!dataStr) return
      
      const data = JSON.parse(dataStr)
      const sourcePath = data.path
      const sourceName = data.name
      
      let targetPath = path
      if (targetItem) {
         if (targetItem.is_dir) {
           targetPath = targetItem.path || joinPath(path, targetItem.name)
         } else {
           // If dropped on a file, treat as dropping on the current directory (background)
           return
         }
      }

      const sourceParent = sourcePath.substring(0, sourcePath.lastIndexOf('/')) || '/'
      
      // Validation
      if (sourcePath === targetPath) return
      if (data.is_dir && targetPath.startsWith(sourcePath + '/')) return
      if (targetPath === sourceParent) return

      const newPath = targetPath.endsWith('/') ? `${targetPath}${sourceName}` : `${targetPath}/${sourceName}`
      
      await api.fsRename(sourcePath, newPath)
      await reloadCurrentDir()
      
    } catch (err) {
      console.error('Drop failed', err)
    }
  }

  return {
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
