import React, { useRef, useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Home,
  ArrowUpDown,
  Check,
  List,
  LayoutGrid,
  Upload,
  FolderPlus,
  Download,
  Trash2,
  Search,
  LucideIcon
} from 'lucide-react'

function usePress() {
  const [pressed, setPressed] = useState(false)
  return {
    pressed,
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
  }
}

function IconButton({ onClick, icon: Icon, title, disabled, active }: { onClick: () => void; icon: LucideIcon; title: string; disabled?: boolean; active?: boolean }) {
  const { pressed, onMouseDown, onMouseUp, onMouseLeave } = usePress()
  return (
    <button
      style={{
        height: 32,
        width: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        borderRadius: 8,
        border: 'none',
        background: active ? '#e5e5ea' : (pressed ? 'rgba(0,0,0,0.06)' : 'transparent'),
        color: disabled ? '#d1d5db' : (active ? '#007AFF' : '#505050'),
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.1s, color 0.1s',
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      title={title}
    >
      <Icon size={18} strokeWidth={1.5} />
    </button>
  )
}

export default function Toolbar({
  back,
  forward,
  refresh,
  navIndex,
  navHist,
  navigate,
  crumbs,
  q,
  setQ,
  onUploadFiles,
  onCreateFolder,
  onDownloadSelected,
  onDeleteSelected,
  sortKey,
  setSortKey,
  sortOrder,
  setSortOrder,
  view,
  setView
}: {
  back: () => void
  forward: () => void
  refresh: () => void
  navIndex: number
  navHist: string[]
  navigate: (to: string) => void
  crumbs: { label: string; to: string }[]
  q: string
  setQ: (v: string) => void
  onUploadFiles: (files: FileList) => void
  onCreateFolder: () => void
  onDownloadSelected: () => void
  onDeleteSelected: () => void
  sortKey: 'name' | 'size' | 'modified_ts'
  setSortKey: (k: 'name' | 'size' | 'modified_ts') => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (o: 'asc' | 'desc') => void
  view: 'list' | 'grid'
  setView: (v: 'list' | 'grid') => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sortButtonRef = useRef<HTMLButtonElement | null>(null)
  const [showSortMenu, setShowSortMenu] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortButtonRef.current && !sortButtonRef.current.contains(event.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f2f2f7', background: '#fff', height: 48, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={back} icon={ChevronLeft} title="后退" disabled={navIndex === 0} />
        <IconButton onClick={forward} icon={ChevronRight} title="前进" disabled={navIndex >= navHist.length - 1} />
        <IconButton onClick={refresh} icon={RotateCw} title="刷新" />
      </div>

      <div style={{ width: 1, height: 20, background: '#e5e5ea', margin: '0 4px' }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f2f2f7', borderRadius: 8, padding: '2px 8px', height: 32, maxWidth: '100%', overflow: 'hidden' }}>
           <button style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
             <Home size={16} color="#6b7280" strokeWidth={1.5} />
           </button>
           {crumbs.slice(1).map((c, i) => (
              <React.Fragment key={`crumb-${i}-${c.to}`}>
                <span style={{ color: '#9ca3af', margin: '0 4px', fontSize: 12 }}>/</span>
                <button 
                  style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 13, color: '#1f2937', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  onClick={() => navigate(c.to)}
                >
                  {c.label}
                </button>
              </React.Fragment>
           ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => { const files = e.target.files; if (files && files.length) onUploadFiles(files); if (fileInputRef.current) fileInputRef.current.value = '' }} />
        
        <IconButton onClick={() => fileInputRef.current?.click()} icon={Upload} title="上传" />
        <IconButton onClick={onCreateFolder} icon={FolderPlus} title="新建文件夹" />
        <IconButton onClick={onDownloadSelected} icon={Download} title="下载" />
        <IconButton onClick={onDeleteSelected} icon={Trash2} title="删除" />
        
        <div style={{ width: 1, height: 20, background: '#e5e5ea', margin: '0 4px' }} />
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="#9ca3af" strokeWidth={1.5} style={{ position: 'absolute', left: 8, pointerEvents: 'none' }} />
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="搜索" 
            style={{ 
              width: 140, 
              height: 32, 
              padding: '0 8px 0 28px', 
              borderRadius: 8, 
              border: 'none', 
              background: '#f2f2f7', 
              color: '#1c1c1e',
              fontSize: 13,
              outline: 'none',
              transition: 'width 0.2s'
            }} 
            onFocus={(e) => e.target.style.width = '200px'}
            onBlur={(e) => e.target.style.width = '140px'}
          />
        </div>

        <div style={{ width: 1, height: 20, background: '#e5e5ea', margin: '0 4px' }} />

        <div style={{ position: 'relative' }}>
          <button
            ref={sortButtonRef}
            style={{
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 8px',
              border: 'none',
              background: showSortMenu ? '#e5e5ea' : 'transparent',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#1c1c1e'
            }}
            onClick={() => setShowSortMenu(!showSortMenu)}
            title="排序"
          >
            <ArrowUpDown size={18} strokeWidth={1.5} />
          </button>
          {showSortMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid #e5e5ea', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 140, padding: 4 }}>
              <div style={{ fontSize: 12, color: '#8e8e93', padding: '4px 8px', fontWeight: 500 }}>排序依据</div>
              {[
                { k: 'name', label: '名称' },
                { k: 'size', label: '大小' },
                { k: 'modified_ts', label: '修改时间' }
              ].map(opt => (
                <button
                  key={opt.k}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: 13, color: sortKey === opt.k ? '#007AFF' : '#1c1c1e' }}
                  onClick={() => {
                    setSortKey(opt.k as any)
                    setShowSortMenu(false)
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f2f2f7'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{opt.label}</span>
                  {sortKey === opt.k && <Check size={14} strokeWidth={1.5} />}
                </button>
              ))}
              <div style={{ height: 1, background: '#e5e5ea', margin: '4px 0' }} />
              <div style={{ fontSize: 12, color: '#8e8e93', padding: '4px 8px', fontWeight: 500 }}>顺序</div>
              {[
                { k: 'asc', label: '升序' },
                { k: 'desc', label: '降序' }
              ].map(opt => (
                <button
                  key={opt.k}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRadius: 6, fontSize: 13, color: sortOrder === opt.k ? '#007AFF' : '#1c1c1e' }}
                  onClick={() => {
                    setSortOrder(opt.k as any)
                    setShowSortMenu(false)
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f2f2f7'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{opt.label}</span>
                  {sortOrder === opt.k && <Check size={14} strokeWidth={1.5} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', background: '#f2f2f7', borderRadius: 8, padding: 2 }}>
          <IconButton 
            onClick={() => setView('list')} 
            icon={List} 
            title="列表视图" 
            active={view === 'list'}
          />
          <IconButton 
            onClick={() => setView('grid')} 
            icon={LayoutGrid} 
            title="网格视图" 
            active={view === 'grid'}
          />
        </div>
      </div>
    </div>
  )
}