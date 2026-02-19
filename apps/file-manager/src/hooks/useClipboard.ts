import { useState } from 'react'
import { api } from '../../../../src/api/client'
import { ClipboardItem } from '../types'
import { joinPath } from '../utils'
import { pushFileTask } from '../../../../src/sdk/desktop'

interface UseClipboardProps {
  path: string
  reloadCurrentDir: () => Promise<void>
  startUpload: (id: string, file: File, dir: string, offset?: number) => Promise<void>
}

export function useClipboard({ path, reloadCurrentDir, startUpload }: UseClipboardProps) {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null)

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
      for (const itemPath of items) {
        const name = itemPath.split('/').pop() || ''
        const from = itemPath
        const to = joinPath(path, name)
        if (from !== to) {
          await api.fsRename(from, to)
        }
      }
      await reloadCurrentDir()
      setClipboard(null) // Move clears clipboard
    } else if (action === 'copy') {
       for (const itemPath of items) {
         const name = itemPath.split('/').pop() || ''
         const from = itemPath
         // Determine new name to avoid collision? Or just overwrite/fail?
         // For now simple copy
         const to = joinPath(path, name)
         if (from === to) {
            // Copy to same dir -> duplicate name
            const parts = name.split('.')
            const ext = parts.length > 1 ? parts.pop() : ''
            const base = parts.join('.')
            const newName = `${base} copy${ext ? '.' + ext : ''}`
            
            // We need to handle directory copy differently? 
            // fsDownloadBlob only works for files usually?
            // If it's a directory, we can't easily copy it with blob download.
            // Check if it's a directory
            // We don't have easy check for source file type if it's not in current dir entries.
            // But we can try download blob.
            try {
               const blob = await api.fsDownloadBlob(from)
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
               const blob = await api.fsDownloadBlob(from)
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

  return {
    clipboard,
    setClipboard,
    handleCopy,
    handleCut,
    handlePaste
  }
}
