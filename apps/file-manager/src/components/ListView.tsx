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
  onOpenDir,
  onContextMenu
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
  onContextMenu: (e: React.MouseEvent, name: string) => void
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
                  style={{
                    appearance: 'none',
                    width: 16,
                    height: 16,
                    border: '1px solid #c7c7cc',
                    borderRadius: 4,
                    display: 'grid',
                    placeContent: 'center',
                    margin: 0
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(new Set(filtered.map(f => f.name)))
                    } else {
                      clearSelection()
                    }
                  }}
                />
                名称
              </label>
              <div
                style={{ position: 'absolute', right: 0, top: 12, bottom: 12, width: 1, cursor: 'col-resize' }}
                onMouseDown={(e) => startResize('name', e)}
              />
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.modified, position: 'relative', borderBottom: '1px solid #e5e5ea' }}>
            修改日期
            <div
              style={{ position: 'absolute', right: 0, top: 12, bottom: 12, width: 1, cursor: 'col-resize' }}
              onMouseDown={(e) => startResize('modified', e)}
            />
          </th>
          <th style={{ textAlign: 'left', width: colWidths.type, position: 'relative', borderBottom: '1px solid #e5e5ea' }}>
            类型
            <div
              style={{ position: 'absolute', right: 0, top: 12, bottom: 12, width: 1, cursor: 'col-resize' }}
              onMouseDown={(e) => startResize('type', e)}
            />
          </th>
          <th style={{ textAlign: 'right', width: colWidths.size, paddingRight: 20, position: 'relative', borderBottom: '1px solid #e5e5ea' }}>
            大小
            <div
              style={{ position: 'absolute', right: 0, top: 12, bottom: 12, width: 1, cursor: 'col-resize' }}
              onMouseDown={(e) => startResize('size', e)}
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((e) => (
          <tr
            key={e.name}
            data-name={e.name}
            className={`list-row ${selected.has(e.name) ? 'selected' : ''}`}
            style={{
              height: 44,
              cursor: 'default',
              transition: 'background-color 0.1s',
              backgroundColor: selected.has(e.name) ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
            }}
            onClick={(ev) => {
               // If control/cmd key is pressed, toggle. Otherwise set selected.
               // But usually file managers allow simple click to select one.
               if (ev.metaKey || ev.ctrlKey) {
                 toggleSelect(e.name)
               } else if (ev.shiftKey) {
                 // Shift select logic could be added here, but simple for now
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
            <td style={{ paddingLeft: 16, borderBottom: '1px solid #f2f2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="checkbox"
                  checked={selected.has(e.name)}
                  onChange={() => toggleSelect(e.name)}
                  onClick={(ev) => ev.stopPropagation()}
                  style={{
                    appearance: 'none',
                    width: 16,
                    height: 16,
                    border: '1px solid #c7c7cc',
                    borderRadius: 4,
                    display: 'grid',
                    placeContent: 'center',
                    margin: 0,
                    backgroundColor: selected.has(e.name) ? '#007aff' : 'transparent',
                    borderColor: selected.has(e.name) ? '#007aff' : '#c7c7cc'
                  }}
                />
                {e.is_dir ? (
                  <Folder size={20} fill="#007aff" stroke="none" />
                ) : (
                  <FileText size={20} color="#8e8e93" strokeWidth={1.5} />
                )}
                <span style={{ fontSize: 13, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
              </div>
            </td>
            <td style={{ fontSize: 13, color: '#8e8e93', borderBottom: '1px solid #f2f2f7' }}>{fmtTime(e.modified_ts)}</td>
            <td style={{ fontSize: 13, color: '#8e8e93', borderBottom: '1px solid #f2f2f7' }}>{e.is_dir ? '文件夹' : '文件'}</td>
            <td style={{ fontSize: 13, color: '#8e8e93', textAlign: 'right', paddingRight: 20, borderBottom: '1px solid #f2f2f7' }}>{e.is_dir ? '--' : fmtSize(e.size)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
