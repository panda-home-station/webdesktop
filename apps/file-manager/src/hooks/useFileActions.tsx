import React, { useState } from 'react'
import { Modal } from '../../../../src/components/Modal'
import { api } from '../../../../src/api/client'
import { joinPath, getUniqueName } from '../utils'
import { FileEntry } from '../types'
import { FileTask, pushFileTask } from '../../../../src/sdk/desktop'

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

interface UseFileActionsProps {
  path: string
  entries: FileEntry[]
  reloadCurrentDir: () => Promise<void>
  deleteItems: (names: string[]) => Promise<void>
  emptyTrash: () => Promise<void>
  startUpload: (id: string, file: File, dir: string, loaded?: number) => Promise<void>
}

export function useFileActions({
  path,
  entries,
  reloadCurrentDir,
  deleteItems,
  emptyTrash,
  startUpload
}: UseFileActionsProps) {
  // New Folder State
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderError, setNewFolderError] = useState('')

  // New File State
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileError, setNewFileError] = useState('')

  // Rename State
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameTarget, setRenameTarget] = useState('')
  const [renameNewName, setRenameNewName] = useState('')

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([])

  // Empty Trash State
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false)

  // Handlers
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
         await api.fsMkdir(joinPath(path, newFolderName))
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
        await api.fsRename(renameTarget, to)
        await reloadCurrentDir()
      } catch (e) {
        console.error(e)
        alert('重命名失败')
      }
    }
    setShowRenameModal(false)
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

  const FileActionModals = () => (
    <>
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
    </>
  )

  return {
    handleNewFolder,
    handleNewFile,
    handleRename,
    handleDelete,
    onEmptyTrash,
    FileActionModals,
    renameTarget
  }
}
