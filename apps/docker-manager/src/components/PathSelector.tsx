import React, { useState, useEffect } from 'react'
import { Modal } from '../../../../src/components/Modal'
import { podmanApi } from '../api'
import { iOSButtonStyle } from '../utils'
import Icon from '@mdi/react'
import { mdiFolder, mdiFile, mdiArrowLeft, mdiChevronRight, mdiHome, mdiApps, mdiDatabase } from '@mdi/js'
import { Volume } from '../types'

interface PathSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (path: string) => void
  initialPath?: string
  onlyDir?: boolean
}

type Tab = 'home' | 'appdata' | 'volume'

export function PathSelector({ open, onClose, onSelect, initialPath = '/', onlyDir = false }: PathSelectorProps) {
  const getInitialTab = (): Tab => {
    if (initialPath && !initialPath.startsWith('/') && initialPath !== '') return 'volume'
    if (initialPath && initialPath.startsWith('/AppData')) return 'appdata'
    return 'home'
  }

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab())
  const [currentPath, setCurrentPath] = useState(initialPath && initialPath.startsWith('/') ? initialPath : '/')
  const [entries, setEntries] = useState<{ name: string, is_dir: boolean }[]>([])
  const [volumes, setVolumes] = useState<Volume[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(initialPath && !initialPath.startsWith('/') ? initialPath : null)

  useEffect(() => {
    if (open) {
      if (activeTab === 'volume') {
        loadVolumes()
      } else {
        loadPath(currentPath)
      }
    }
  }, [currentPath, open, activeTab])

  const loadVolumes = async () => {
    setLoading(true)
    try {
      const res = await podmanApi.listVolumes()
      setVolumes(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setSelected(null)
    if (tab === 'home') {
      setCurrentPath('/')
    } else if (tab === 'appdata') {
      setCurrentPath('/AppData')
    }
  }

  const handleEntryClick = (entry: { name: string, is_dir: boolean }) => {
    if (entry.is_dir) {
      const nextPath = currentPath === '/' ? `/${entry.name}` : `${currentPath}/${entry.name}`
      setCurrentPath(nextPath)
      setSelected(null)
    } else if (!onlyDir) {
      setSelected(entry.name)
    }
  }

  const handleVolumeClick = (vol: Volume) => {
    setSelected(vol.name)
  }

  const handleUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.length ? `/${parts.join('/')}` : '/')
    setSelected(null)
  }

  const handleConfirm = () => {
    if (activeTab === 'volume') {
      if (selected) {
        onSelect(selected)
        onClose()
      }
      return
    }

    // FS mode
    if (onlyDir) {
      onSelect(currentPath)
    } else {
      if (selected) {
        onSelect(currentPath === '/' ? `/${selected}` : `${currentPath}/${selected}`)
      } else {
        // If nothing selected but onlyDir is false, select current dir as volume source
        onSelect(currentPath)
      }
    }
    onClose()
  }

  const tabs: { id: Tab, label: string, icon: string }[] = [
    { id: 'home', label: '我的文件', icon: mdiHome },
    { id: 'appdata', label: '应用文件', icon: mdiApps },
    { id: 'volume', label: '存储卷', icon: mdiDatabase },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="选择路径"
      width={700}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ ...iOSButtonStyle('default'), background: 'transparent' }}>取消</button>
          <button onClick={handleConfirm} style={iOSButtonStyle('primary')} disabled={activeTab === 'volume' && !selected}>
            确定 {activeTab !== 'volume' && onlyDir ? `(选定当前目录)` : (selected ? `(选定 ${selected})` : `(选定当前目录)`)}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', height: 400, gap: 20 }}>
        {/* Sidebar */}
        <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid #e5e5ea', paddingRight: 10 }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: activeTab === tab.id ? '#e5e5ea' : 'transparent',
                color: activeTab === tab.id ? '#000' : '#666',
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 500 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Icon path={tab.icon} size={0.8} />
              {tab.label}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab !== 'volume' && (
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
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20, color: '#8e8e93' }}>加载中...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'volume' ? (
                  // Volume List
                  volumes.map(v => (
                    <div
                      key={v.name}
                      onClick={() => handleVolumeClick(v)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: selected === v.name ? '#e5f1fb' : 'transparent'
                      }}
                    >
                      <Icon path={mdiDatabase} size={1} color="#5856d6" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14 }}>{v.name}</div>
                        <div style={{ fontSize: 12, color: '#8e8e93' }}>{v.driver}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  // File List
                  <>
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
                  </>
                )}
                
                {activeTab === 'volume' && volumes.length === 0 && !loading && (
                   <div style={{ padding: 20, textAlign: 'center', color: '#8e8e93', fontSize: 14 }}>无 Volume</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
