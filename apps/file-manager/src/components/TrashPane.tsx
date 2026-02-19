import React, { useRef, useEffect } from 'react'
import { Folder, FileText, Trash2, RotateCcw, Ban, CheckSquare } from 'lucide-react'
import TrashListView from './TrashListView'
import { FileEntry, TrashMetadata } from '../types'

type Props = {
  entries: FileEntry[]
  filtered: FileEntry[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  clearSelection: () => void
  toggleSelect: (name: string) => void
  fmtTime: (ts: number) => string
  fmtSize: (n: number) => string
  onRestoreSelected: () => Promise<void>
  onDeleteSelected: () => Promise<void>
  onEmptyTrash: () => Promise<void>
  onRestoreOne: (name: string) => Promise<void>
  onDeleteOne: (name: string) => Promise<void>
  
  // ListView props
  colWidths: Record<string, number>
  startResize: (key: string, nextKey: string | null, e: React.MouseEvent) => void
  headerCheckboxRef: React.RefObject<HTMLInputElement>
  resizingKey: string | null
  onContextMenu: (e: React.MouseEvent, name: string) => void
  onOpenDir: (name: string) => void
  onToggleExpand?: (name: string) => void
  trashMetadata: Record<string, TrashMetadata>
}

export default function TrashPane({
  entries,
  filtered,
  selected,
  setSelected,
  clearSelection,
  toggleSelect,
  fmtTime,
  fmtSize,
  onRestoreSelected,
  onDeleteSelected,
  onEmptyTrash,
  onRestoreOne,
  onDeleteOne,
  colWidths,
  startResize,
  headerCheckboxRef,
  resizingKey,
  onContextMenu,
  onOpenDir,
  onToggleExpand,
  trashMetadata
}: Props) {
  
  if (entries.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#9ca3af',
        gap: 16
      }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          background: '#f3f4f6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Trash2 size={40} strokeWidth={1.5} color="#d1d5db" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>回收站是空的</div>
        <div style={{ fontSize: 13 }}>删除的文件会显示在这里</div>
      </div>
    )
  }

  const containerRef = useRef<HTMLDivElement>(null)

  const handleResize = (key: string, nextKey: string | null, e: React.MouseEvent) => {
    startResize(key, nextKey, e, {
      containerRef,
      fixedCols: ['name', 'originalPath', 'size']
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        padding: '0 12px', 
        height: 48,
        boxSizing: 'border-box',
        borderBottom: '1px solid #f2f2f7' 
      }}>
        <button
          className="trash-action-btn primary"
          onClick={onRestoreSelected}
          disabled={selected.size === 0}
        >
          <RotateCcw size={16} />
          还原所选
        </button>
        <button
          className="trash-action-btn danger"
          onClick={onDeleteSelected}
          disabled={selected.size === 0}
        >
          <Ban size={16} />
          彻底删除
        </button>
        
        <div style={{ flex: 1 }} />
        
        <button
          className="trash-action-btn danger-outline"
          onClick={onEmptyTrash}
        >
          <Trash2 size={16} />
          清空回收站
        </button>
      </div>

      <div ref={containerRef} style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <TrashListView
          filtered={filtered}
          selected={selected}
          setSelected={setSelected}
          clearSelection={clearSelection}
          toggleSelect={toggleSelect}
          fmtTime={fmtTime}
          fmtSize={fmtSize}
          onOpenDir={(name) => {
            // Disable double click enter in Trash
          }}
          onContextMenu={onContextMenu}
          trashMetadata={trashMetadata}
          onToggleExpand={onToggleExpand}
          colWidths={colWidths}
          startResize={handleResize}
          headerCheckboxRef={headerCheckboxRef}
          resizingKey={resizingKey}
        />
      </div>

      <style>{`
        .trash-action-btn {
          display: flex;
          alignItems: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .trash-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .trash-action-btn.primary {
          background: #ebf5ff;
          color: #007aff;
        }
        .trash-action-btn.primary:hover:not(:disabled) {
          background: #dbeafe;
        }
        .trash-action-btn.danger {
          background: #fee2e2;
          color: #ef4444;
        }
        .trash-action-btn.danger:hover:not(:disabled) {
          background: #fecaca;
        }
        .trash-action-btn.danger-outline {
          border: 1px solid #fee2e2;
          color: #ef4444;
        }
        .trash-action-btn.danger-outline:hover {
          background: #fee2e2;
        }
      `}</style>
    </div>
  )
}
