import React from 'react'
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react'

export default function GridView({
  path,
  filtered,
  selected,
  setSelected,
  clearSelection,
  toggleSelect,
  onOpenDir,
  onContextMenu,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  dragOverItem
}: {
  path: string
  filtered: { name: string; is_dir: boolean; path?: string; expanded?: boolean; level?: number }[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  clearSelection: () => void
  toggleSelect: (name: string) => void
  onOpenDir: (name: string) => void
  onContextMenu: (e: React.MouseEvent, name: string) => void
  onToggleExpand?: (name: string) => void
  onDragStart: (e: React.DragEvent, item: { name: string; is_dir: boolean; path?: string }) => void
  onDragOver: (e: React.DragEvent, item: { name: string; is_dir: boolean; path?: string }) => void
  onDrop: (e: React.DragEvent, item: { name: string; is_dir: boolean; path?: string }) => void
  onDragLeave: (e: React.DragEvent) => void
  dragOverItem: string | null
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 16, padding: 16 }}>
      {filtered.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#8e8e93', fontSize: 16 }}>
          暂无文件
        </div>
      ) : null}
      {filtered.map(e => {
        const itemPath = e.path || e.name
        const isSelected = selected.has(itemPath)
        return (
          <div
            key={itemPath}
            data-name={itemPath}
            className="grid-item"
            draggable={true}
            onDragStart={(ev) => onDragStart(ev, e)}
            onDragOver={(ev) => {
              if (e.is_dir) {
                onDragOver(ev, e)
              }
            }}
            onDrop={(ev) => {
              if (e.is_dir) {
                onDrop(ev, e)
              }
            }}
            onDragLeave={(ev) => {
              if (e.is_dir) {
                onDragLeave(ev)
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: 12,
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'background-color 0.2s, transform 0.1s',
              background: (dragOverItem === itemPath && e.is_dir)
                ? 'rgba(0, 122, 255, 0.2)'
                : isSelected 
                  ? 'rgba(0, 122, 255, 0.1)' 
                  : 'transparent',
              position: 'relative'
            }}
            onClick={(ev) => {
               if (ev.metaKey || ev.ctrlKey) {
                 toggleSelect(itemPath)
               } else if (ev.shiftKey) {
                 toggleSelect(itemPath)
               } else {
                 setSelected(new Set([itemPath]))
               }
               ev.stopPropagation()
            }}
            onDoubleClick={() => {
              if (e.is_dir) {
                onOpenDir(e.path || e.name)
              }
            }}
            onContextMenu={(ev) => onContextMenu(ev, itemPath)}
          >
            <style>{`
              .grid-item:hover {
                background-color: ${isSelected ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0,0,0,0.05)'};
              }
              .grid-item:active {
                transform: scale(0.96);
              }
            `}</style>
            <div style={{ 
              height: 64, 
              width: 64, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 8,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))',
              position: 'relative'
            }}>
              {e.is_dir && onToggleExpand && (
                <div
                  onClick={(ev) => {
                    ev.stopPropagation()
                    onToggleExpand(itemPath)
                  }}
                  style={{
                    position: 'absolute',
                    left: -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  onMouseEnter={(ev) => ev.currentTarget.style.backgroundColor = '#f2f2f7'}
                  onMouseLeave={(ev) => ev.currentTarget.style.backgroundColor = 'white'}
                >
                  {e.expanded ? <ChevronDown size={14} color="#8e8e93" /> : <ChevronRight size={14} color="#8e8e93" />}
                </div>
              )}
              {e.is_dir ? (
                <Folder size={64} color="#F59E0B" fill="#FFC107" strokeWidth={1} />
              ) : (
                <FileText size={64} color="#8E8E93" strokeWidth={1} />
              )}
            </div>
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: 13,
                lineHeight: '1.3',
                color: isSelected ? '#007AFF' : '#1c1c1e',
                fontWeight: isSelected ? 500 : 400,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word'
              }}
            >
              {e.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
