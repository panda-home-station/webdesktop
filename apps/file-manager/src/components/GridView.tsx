import React from 'react'
import { Folder, FileText } from 'lucide-react'

export default function GridView({
  path,
  filtered,
  selected,
  setSelected,
  clearSelection,
  toggleSelect,
  onOpenDir,
  onContextMenu
}: {
  path: string
  filtered: { name: string; is_dir: boolean }[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  clearSelection: () => void
  toggleSelect: (name: string) => void
  onOpenDir: (name: string) => void
  onContextMenu: (e: React.MouseEvent, name: string) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 16, padding: 16 }}>
      {filtered.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#8e8e93', fontSize: 16 }}>
          暂无文件
        </div>
      ) : null}
      {filtered.map(e => {
        const isSelected = selected.has(e.name)
        return (
          <div
            key={`${path}/grid-${e.name}`}
            data-name={e.name}
            className="grid-item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: 12,
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'background-color 0.2s, transform 0.1s',
              background: isSelected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
              position: 'relative'
            }}
            onClick={(ev) => {
               if (ev.metaKey || ev.ctrlKey) {
                 toggleSelect(e.name)
               } else if (ev.shiftKey) {
                 toggleSelect(e.name)
               } else {
                 setSelected(new Set([e.name]))
               }
               ev.stopPropagation()
            }}
            onDoubleClick={() => {
              if (e.is_dir) {
                onOpenDir(e.name)
              }
            }}
            onContextMenu={(ev) => onContextMenu(ev, e.name)}
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
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))'
            }}>
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
