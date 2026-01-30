import React from 'react'
import Icon from '@mdi/react'
import { mdiFolderOutline, mdiFileDocumentOutline } from '@mdi/js'

export default function GridView({
  path,
  filtered,
  selected,
  toggleSelect,
  onOpenDir
}: {
  path: string
  filtered: { name: string; is_dir: boolean }[]
  selected: Set<string>
  toggleSelect: (name: string) => void
  onOpenDir: (name: string) => void
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
            onClick={() => toggleSelect(e.name)}
            onDoubleClick={() => {
              if (e.is_dir) {
                onOpenDir(e.name)
              }
            }}
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
                <Icon path={mdiFolderOutline} size={2.8} color="#007AFF" />
              ) : (
                <Icon path={mdiFileDocumentOutline} size={2.8} color="#8E8E93" />
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
