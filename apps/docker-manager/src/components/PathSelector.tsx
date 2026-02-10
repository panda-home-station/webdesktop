import React, { useState, useEffect } from 'react'
import { Modal } from '../../../../src/components/Modal'
import { podmanApi } from '../api'
import { iOSButtonStyle } from '../utils'
import Icon from '@mdi/react'
import { mdiFolder, mdiFile, mdiArrowLeft, mdiChevronRight } from '@mdi/js'

interface PathSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (path: string) => void
  initialPath?: string
  onlyDir?: boolean
}

export function PathSelector({ open, onClose, onSelect, initialPath = '/', onlyDir = false }: PathSelectorProps) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [entries, setEntries] = useState<{ name: string, is_dir: boolean }[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPath(currentPath)
    }
  }, [currentPath, open])

  const loadPath = async (path: string) => {
    setLoading(true)
    try {
      const res = await podmanApi.fsList(path)
      setEntries(res.entries || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEntryClick = (entry: { name: string, is_dir: boolean }) => {
    if (entry.is_dir) {
      const nextPath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`
      setCurrentPath(nextPath)
      setSelected(null) // Clear selection when navigating
    } else if (!onlyDir) {
      setSelected(entry.name)
    }
  }

  const handleUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.length ? `/${parts.join('/')}` : '/')
    setSelected(null)
  }

  const handleConfirm = () => {
    if (onlyDir) {
      onSelect(currentPath)
    } else {
      if (selected) {
        onSelect(currentPath === '/' ? `/${selected}` : `${currentPath}/${selected}`)
      } else {
        // If nothing selected but onlyDir is false, maybe select current dir?
        // Usually we want a file, but if user wants to select a dir as a volume, they might just navigate to it.
        // But for volumes we usually mount directories.
        // Let's assume for volumes we want to select the CURRENT directory if no file is selected.
        onSelect(currentPath)
      }
    }
    onClose()
  }

  // Breadcrumbs
  const parts = currentPath.split('/').filter(Boolean)
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="选择路径"
      width={600}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ ...iOSButtonStyle('default'), background: 'transparent' }}>取消</button>
          <button onClick={handleConfirm} style={iOSButtonStyle('primary')}>
            确定 {onlyDir ? `(选定当前目录)` : (selected ? `(选定 ${selected})` : `(选定当前目录)`)}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid #f2f2f7', marginBottom: 12 }}>
        <button 
          onClick={handleUp} 
          disabled={currentPath === '/'}
          style={{ 
            border: 'none', 
            background: 'none', 
            cursor: currentPath === '/' ? 'default' : 'pointer',
            opacity: currentPath === '/' ? 0.3 : 1
          }}
        >
          <Icon path={mdiArrowLeft} size={1} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentPath}
        </div>
      </div>

      <div style={{ height: 300, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20, color: '#8e8e93' }}>加载中...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {entries.sort((a, b) => (b.is_dir ? 1 : 0) - (a.is_dir ? 1 : 0)).map(e => (
              <div
                key={e.name}
                onClick={() => handleEntryClick(e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: selected === e.name ? '#e5f1fb' : 'transparent'
                }}
              >
                <Icon 
                  path={e.is_dir ? mdiFolder : mdiFile} 
                  size={1} 
                  color={e.is_dir ? '#007aff' : '#8e8e93'} 
                />
                <span style={{ flex: 1, fontSize: 14 }}>{e.name}</span>
                {e.is_dir && <Icon path={mdiChevronRight} size={0.8} color="#c7c7cc" />}
              </div>
            ))}
            {entries.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#8e8e93', fontSize: 14 }}>空目录</div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
