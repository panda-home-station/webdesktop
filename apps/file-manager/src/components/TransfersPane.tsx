import React, { useState, useEffect, useRef } from 'react'
import { Upload, Download, Folder, CheckCircle, Pause, Play, X, FileText, Trash2, Home } from 'lucide-react'
import type { FileTask } from '../../../src/sdk/desktop'

type Props = {
  tasks: FileTask[]
  transferTab: 'upload' | 'download'
  setTransferTab: (t: 'upload' | 'download') => void
  fmtSize: (n: number) => string
  getAvgSpeed: (id: string) => number
  onTogglePause: (t: FileTask) => void
  onRemoveTask: (t: FileTask) => void
  onClearCompleted: () => void
  navigate: (to: string) => void
}

export default function TransfersPane({
  tasks,
  transferTab,
  setTransferTab,
  fmtSize,
  getAvgSpeed,
  onTogglePause,
  onRemoveTask,
  onClearCompleted,
  navigate
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [menu, setMenu] = useState<{ x: number; y: number; task: FileTask } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const uploads = tasks.filter(t => t.kind === 'upload')
  const downloads = tasks.filter(t => t.kind === 'download')
  const visible = transferTab === 'upload' ? uploads : downloads
  const runningUploads = tasks.filter(t => t.kind === 'upload' && t.status === 'running').length
  const runningDownloads = tasks.filter(t => t.kind === 'download' && t.status === 'running').length
  const fmtSpeed = (bps?: number) => {
    const v = typeof bps === 'number' && bps >= 0 ? bps : 0
    return `${fmtSize(v)}/s`
  }

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (menu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null)
      }
    }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [menu])

  const handleContextMenu = (e: React.MouseEvent, task: FileTask) => {
    e.preventDefault()
    e.stopPropagation()
    // Select the item if not already selected (similar to standard OS behavior)
    if (!selectedIds.has(task.id)) {
      setSelectedIds(new Set([task.id]))
    }
    setMenu({ x: e.clientX, y: e.clientY, task })
  }

  const handleSelect = (e: React.MouseEvent, id: string) => {
    // Basic selection logic
    const newSet = new Set(e.ctrlKey || e.metaKey ? selectedIds : [])
    if (newSet.has(id)) {
       if (e.ctrlKey || e.metaKey) newSet.delete(id)
       else newSet.add(id) 
    } else {
       newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleBackgroundClick = () => {
    setSelectedIds(new Set())
    setMenu(null)
  }

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7' }} 
      onClick={handleBackgroundClick}
    >
      {/* Header / Segmented Control */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ display: 'inline-flex', background: 'rgba(118, 118, 128, 0.12)', borderRadius: 9, padding: 2 }}>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '6px 24px', borderRadius: 7,
              background: transferTab === 'upload' ? '#fff' : 'transparent',
              boxShadow: transferTab === 'upload' ? '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' : 'none',
              color: '#000', fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onClick={(e) => { e.stopPropagation(); setTransferTab('upload'); }}
          >
            上传
            {runningUploads > 0 && (
              <span style={{ minWidth: 16, height: 16, borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', marginLeft: 4 }}>
                {runningUploads}
              </span>
            )}
          </button>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '6px 24px', borderRadius: 7,
              background: transferTab === 'download' ? '#fff' : 'transparent',
              boxShadow: transferTab === 'download' ? '0 3px 8px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.04)' : 'none',
              color: '#000', fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onClick={(e) => { e.stopPropagation(); setTransferTab('download'); }}
          >
            下载
            {runningDownloads > 0 && (
              <span style={{ minWidth: 16, height: 16, borderRadius: 8, background: '#34d399', color: '#fff', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', marginLeft: 4 }}>
                {runningDownloads}
              </span>
            )}
          </button>
        </div>
        <button
          style={{ marginLeft: 'auto', fontSize: 13, color: '#007aff', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          onClick={(e) => { e.stopPropagation(); onClearCompleted(); }}
        >
          清除已完成
        </button>
      </div>

      {/* Task List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {visible.length === 0 ? (
           <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8e8e93', gap: 12 }}>
             <div style={{ width: 64, height: 64, borderRadius: 32, background: '#e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {transferTab === 'upload' ? <Upload size={32} color="#aeaeb2" /> : <Download size={32} color="#aeaeb2" />}
             </div>
             <span style={{ fontSize: 15, fontWeight: 500 }}>暂无{transferTab === 'upload' ? '上传' : '下载'}任务</span>
           </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visible.map(t => {
              const isSelected = selectedIds.has(t.id)
              return (
                <div 
                  key={t.id} 
                  onClick={(e) => { e.stopPropagation(); handleSelect(e, t.id); }}
                  onContextMenu={(e) => handleContextMenu(e, t)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px', 
                    background: isSelected ? '#e4efff' : '#fff', 
                    borderRadius: 10,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    border: isSelected ? '1px solid #007aff' : '1px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    userSelect: 'none',
                    overflow: 'hidden'
                  }}
                >
                  {/* Progress Bar Background */}
                  {!(t.kind === 'upload' && t.status === 'done') && (
                    <div style={{ 
                      position: 'absolute', bottom: 0, left: 0, height: 2,
                      width: `${Math.min(100, Math.max(0, t.progress ?? (t.status === 'done' ? 100 : 0)))}%`, 
                      background: t.status === 'error' ? '#ff3b30' : t.status === 'paused' ? '#ffcc00' : '#007aff',
                      transition: 'width 0.3s ease',
                      opacity: 0.5
                    }} />
                  )}

                  <div style={{ 
                    width: 32, height: 32, borderRadius: 8, 
                    background: t.kind === 'upload' ? '#eef2ff' : '#ecfdf5', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {t.kind === 'upload'
                      ? (t.status === 'done'
                        ? <CheckCircle size={18} color="#10b981" strokeWidth={2} />
                        : <Upload size={18} color="#4f46e5" strokeWidth={2} />)
                      : <Download size={18} color="#059669" strokeWidth={2} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#aeaeb2', minWidth: 0, overflow: 'hidden', flexShrink: 1 }}>
                      <Home size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                      {t.dir.split('/').filter(Boolean).map((part, i) => (
                        <React.Fragment key={i}>
                          <span style={{ margin: '0 4px', color: '#aeaeb2' }}>/</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {part}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                    </div>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {t.status === 'running' && (
                        <span style={{ fontSize: 12, color: '#8e8e93', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtSpeed(getAvgSpeed(t.id))}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: '#aeaeb2', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {fmtSize(t.loaded || 0)}/{fmtSize(t.total || 0)}
                      </span>
                      <span style={{ 
                        fontSize: 12, fontWeight: 500,
                        color: t.status === 'error' ? '#ff3b30' : t.status === 'done' ? '#34c759' : '#007aff',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.status === 'error' ? '失败' : t.status === 'paused' ? '暂停' : t.status === 'done' ? '完成' : '进行中'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      title="打开所在位置"
                      onClick={(e) => { e.stopPropagation(); navigate(t.dir); }}
                      style={{ 
                        border: 'none', background: 'transparent', padding: 6, borderRadius: 6, 
                        cursor: 'pointer', color: '#007aff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Folder size={16} />
                    </button>
                    <button
                      title="移除记录"
                      onClick={(e) => { e.stopPropagation(); onRemoveTask(t); }}
                      style={{ 
                        border: 'none', background: 'transparent', padding: 6, borderRadius: 6, 
                        cursor: 'pointer', color: '#8e8e93', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#ff3b30'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8e8e93'; }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {menu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }}>
          <div 
            ref={menuRef}
            style={{ 
              position: 'absolute', left: menu.x, top: menu.y,
              minWidth: 180, padding: 6, borderRadius: 12,
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', gap: 2
            }}
            onClick={(e) => e.stopPropagation()}
          >
             {menu.task.status === 'running' && (
               <button
                 className="menu-item"
                 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#1c1c1e', textAlign: 'left' }}
                 onClick={() => { onTogglePause(menu.task); setMenu(null); }}
               >
                 <Pause size={16} /> 暂停任务
               </button>
             )}
             {(menu.task.status === 'paused' || menu.task.status === 'error') && (
               <button
                 className="menu-item"
                 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#1c1c1e', textAlign: 'left' }}
                 onClick={() => { onTogglePause(menu.task); setMenu(null); }}
               >
                 <Play size={16} /> 继续任务
               </button>
             )}
             {menu.task.status === 'done' && (
               <button
                 className="menu-item"
                 style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#1c1c1e', textAlign: 'left' }}
                 onClick={() => { navigate(menu.task.dir); setMenu(null); }}
               >
                 <Folder size={16} /> 打开所在目录
               </button>
             )}
             <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '4px 0' }} />
             <button
               className="menu-item"
               style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#ff3b30', textAlign: 'left' }}
               onClick={() => { onRemoveTask(menu.task); setMenu(null); }}
             >
               <Trash2 size={16} /> {menu.task.status === 'done' ? '移除记录' : '取消任务'}
             </button>
          </div>
        </div>
      )}
      <style>{`
        .menu-item:hover { background: rgba(0,0,0,0.05) !important; }
      `}</style>
    </div>
  )
}
