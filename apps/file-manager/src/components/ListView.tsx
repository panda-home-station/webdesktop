import React from 'react'
import Icon from '@mdi/react'
import { mdiCogOutline } from '@mdi/js'

export default function ListView({
  path,
  filtered,
  selected,
  setSelected,
  clearSelection,
  colWidths,
  startResize,
  headerCheckboxRef,
  toggleSelect,
  fmtTime,
  fmtSize,
  onOpenDir
}: {
  path: string
  filtered: { name: string; is_dir: boolean; size: number; modified_ts: number }[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  clearSelection: () => void
  colWidths: Record<string, number>
  startResize: (key: keyof typeof colWidths, e: React.MouseEvent) => void
  headerCheckboxRef: React.RefObject<HTMLInputElement>
  toggleSelect: (name: string) => void
  fmtTime: (ts: number) => string
  fmtSize: (n: number) => string
  onOpenDir: (name: string) => void
}) {
  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderTop: '2px solid #d1d5db', borderBottom: '2px solid #d1d5db', height: 36 }}>
          <th style={{ textAlign: 'left', width: colWidths.name, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(new Set(filtered.map(f => f.name)))
                    } else {
                      clearSelection()
                    }
                  }}
                />
                <span>文件名</span>
              </label>
            </div>
            <div style={{ position: 'absolute', right: 0, top: 8, width: 1, height: 20, background: '#e5e7eb' }} />
            <div onMouseDown={(e) => startResize('name', e)} style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
          </th>
          <th style={{ textAlign: 'left', width: colWidths.modified, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>修改时间</div>
            <div style={{ position: 'absolute', right: 0, top: 8, width: 1, height: 20, background: '#e5e7eb' }} />
            <div onMouseDown={(e) => startResize('modified', e)} style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
          </th>
          <th style={{ textAlign: 'left', width: colWidths.type, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>类型</div>
            <div style={{ position: 'absolute', right: 0, top: 8, width: 1, height: 20, background: '#e5e7eb' }} />
            <div onMouseDown={(e) => startResize('type', e)} style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
          </th>
          <th style={{ textAlign: 'left', width: colWidths.size, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>大小</div>
            <div style={{ position: 'absolute', right: 0, top: 8, width: 1, height: 20, background: '#e5e7eb' }} />
            <div onMouseDown={(e) => startResize('size', e)} style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
          </th>
          <th style={{ textAlign: 'left', width: colWidths.created, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>创建时间</div>
            <div style={{ position: 'absolute', right: 0, top: 8, width: 1, height: 20, background: '#e5e7eb' }} />
            <div onMouseDown={(e) => startResize('created', e)} style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
          </th>
          <th style={{ textAlign: 'left', width: colWidths.owner, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8 }}>
              <span>所有者</span>
              <button className="puter-button" title="字段设置" style={{ height: 24, width: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <Icon path={mdiCogOutline} size={0.8} />
              </button>
            </div>
            <div onMouseDown={(e) => startResize('owner', e)} style={{ position: 'absolute', right: 0, top: 0, width: 6, height: '100%', cursor: 'col-resize' }} />
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>暂无文件</td>
          </tr>
        ) : null}
        {filtered.map((e) => (
          <tr
            key={`${path}/${e.name}`}
            style={{ background: selected.has(e.name) ? 'rgba(0,0,0,0.06)' : undefined, cursor: 'pointer', borderBottom: '1px solid #e5e7eb', height: 36 }}
            onClick={() => toggleSelect(e.name)}
            onDoubleClick={() => {
              if (e.is_dir) {
                onOpenDir(e.name)
              }
            }}
          >
            <td style={{ width: colWidths.name, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', paddingLeft: 24 }}>
              <span style={{ color: e.is_dir ? '#2563eb' : '#111827' }}>{e.name}</span>
            </td>
            <td style={{ width: colWidths.modified, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', paddingLeft: 8 }}>{fmtTime(e.modified_ts)}</td>
            <td style={{ width: colWidths.type, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', paddingLeft: 8 }}>{e.is_dir ? '目录' : '文件'}</td>
            <td style={{ width: colWidths.size, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', paddingLeft: 8 }}>{e.is_dir ? '-' : fmtSize(e.size)}</td>
            <td style={{ width: colWidths.created, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', paddingLeft: 8 }}>{'-'}</td>
            <td style={{ width: colWidths.owner, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', paddingLeft: 8 }}>{'-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
