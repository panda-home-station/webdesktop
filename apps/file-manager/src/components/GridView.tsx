import React from 'react'

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
            {e.is_dir ? (
              <svg width="80" height="80" viewBox="0 0 24 24">
                <linearGradient id="gf2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#fbbf24" />
                </linearGradient>
                <path fill="url(#gf2)" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                <path fill="#fff" fillOpacity="0.35" d="M5 7h6l2 2H5z" />
              </svg>
            ) : (
              <svg width="80" height="80" viewBox="0 0 24 24">
                <rect x="6" y="4" width="12" height="16" rx="2" fill="#60a5fa" />
                <rect x="8" y="8" width="8" height="2" rx="1" fill="#fff" />
                <rect x="8" y="12" width="8" height="2" rx="1" fill="#fff" />
                <rect x="8" y="16" width="5" height="2" rx="1" fill="#fff" />
              </svg>
            )}
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
