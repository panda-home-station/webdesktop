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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
      {filtered.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center', color: '#6b7280' }}>暂无文件</div>
      ) : null}
      {filtered.map(e => (
        <div
          key={`${path}/grid-${e.name}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
            paddingTop: 18,
            paddingLeft: 8,
            paddingRight: 8,
            paddingBottom: 0,
            border: '1px solid transparent',
            borderRadius: 8,
            overflow: 'hidden',
            cursor: 'pointer',
            background: selected.has(e.name) ? 'rgba(0,0,0,0.06)' : '#fff'
          }}
          onClick={() => toggleSelect(e.name)}
          onDoubleClick={() => {
            if (e.is_dir) {
              onOpenDir(e.name)
            }
          }}
        >
          <div style={{ height: 80, width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            {e.is_dir ? <Icon path={mdiFolderOutline} size={3} /> : <Icon path={mdiFileDocumentOutline} size={3} />}
          </div>
          <div
            style={{
              marginTop: 8,
              maxWidth: 80,
              textAlign: 'center',
              fontSize: 12,
              lineHeight: '16px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-all'
            }}
          >
            {e.name}
          </div>
        </div>
      ))}
    </div>
  )
}
