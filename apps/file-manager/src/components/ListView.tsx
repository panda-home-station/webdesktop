import React from 'react'
import { Folder, FileText } from 'lucide-react'

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
  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0)
  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
      <thead>
        <tr style={{ height: 44, color: '#8e8e93', fontSize: 13, fontWeight: 500 }}>
          <th style={{ textAlign: 'left', width: colWidths.name, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingLeft: 16, paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  style={{ accentColor: '#007AFF', width: 16, height: 16 }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(new Set(filtered.map(f => f.name)))
                    } else {
                      clearSelection()
                    }
                  }}
                />
                <span>名称</span>
              </label>
            </div>
            <div onMouseDown={(e) => startResize('name', e)} style={{ position: 'absolute', right: 0, top: 0, width: 10, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 }}>
              <div style={{ width: 1, height: 20, backgroundColor: '#d1d1d6' }} />
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.modified, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8, height: '100%' }}>修改时间</div>
            <div onMouseDown={(e) => startResize('modified', e)} style={{ position: 'absolute', right: 0, top: 0, width: 10, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 }}>
              <div style={{ width: 1, height: 20, backgroundColor: '#d1d1d6' }} />
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.type, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8, height: '100%' }}>类型</div>
            <div onMouseDown={(e) => startResize('type', e)} style={{ position: 'absolute', right: 0, top: 0, width: 10, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 }}>
              <div style={{ width: 1, height: 20, backgroundColor: '#d1d1d6' }} />
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.size, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8, height: '100%' }}>大小</div>
            <div onMouseDown={(e) => startResize('size', e)} style={{ position: 'absolute', right: 0, top: 0, width: 10, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 }}>
              <div style={{ width: 1, height: 20, backgroundColor: '#d1d1d6' }} />
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.created, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8, height: '100%' }}>创建时间</div>
            <div onMouseDown={(e) => startResize('created', e)} style={{ position: 'absolute', right: 0, top: 0, width: 10, height: '100%', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1 }}>
              <div style={{ width: 1, height: 20, backgroundColor: '#d1d1d6' }} />
            </div>
          </th>
          <th style={{ textAlign: 'left', position: 'relative', borderBottom: '1px solid #e5e5ea', paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8, height: '100%' }}>
              <span>所有者</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#8e8e93', fontSize: 16 }}>暂无文件</td>
          </tr>
        ) : null}
        {filtered.map((e, idx) => {
          const isSelected = selected.has(e.name)
          return (
            <tr
              key={`${path}/${e.name}`}
              className="list-row"
              style={{
                background: isSelected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                cursor: 'pointer',
                height: 48,
                transition: 'background-color 0.1s'
              }}
              onClick={() => toggleSelect(e.name)}
              onDoubleClick={() => {
                if (e.is_dir) {
                  onOpenDir(e.name)
                }
              }}
            >
              <td style={{ paddingLeft: 16, borderBottom: '1px solid #f2f2f7', color: isSelected ? '#007AFF' : '#333333', fontWeight: isSelected ? 500 : 400, verticalAlign: 'middle' }}>
                 <style>{`
                  .list-row:hover {
                    background-color: ${isSelected ? 'rgba(0, 122, 255, 0.15)' : 'rgba(0,0,0,0.03)'};
                  }
                 `}</style>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                   {/* Reusing checkbox logic implicitly via row click, but if needed we can add explicit checkbox or rely on highlight */}
                   <div style={{ minWidth: 24, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {e.is_dir ? <Folder size={20} color="#007AFF" strokeWidth={1.5} /> : <FileText size={20} color="#8E8E93" strokeWidth={1.5} />}
                   </div>
                   <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                 </div>
              </td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7', color: '#8e8e93', fontSize: 13, verticalAlign: 'middle' }}>{fmtTime(e.modified_ts)}</td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7', color: '#8e8e93', fontSize: 13, verticalAlign: 'middle' }}>{e.is_dir ? '文件夹' : '文件'}</td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7', color: '#8e8e93', fontSize: 13, verticalAlign: 'middle' }}>{e.is_dir ? '-' : fmtSize(e.size)}</td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7', color: '#8e8e93', fontSize: 13, verticalAlign: 'middle' }}>-</td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7', color: '#8e8e93', fontSize: 13, verticalAlign: 'middle' }}>me</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
