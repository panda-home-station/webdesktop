import React, { useEffect } from 'react'
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
  resizingKey,
  onOpenDir,
  onContextMenu
}: {
  path: string
  filtered: { name: string; is_dir: boolean; size: number; modified_ts: number }[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  clearSelection: () => void
  colWidths: Record<string, number>
  startResize: (key: keyof typeof colWidths, nextKey: keyof typeof colWidths | null, e: React.MouseEvent) => void
  headerCheckboxRef: React.RefObject<HTMLInputElement>
  toggleSelect: (name: string) => void
  fmtTime: (ts: number) => string
  fmtSize: (n: number) => string
  resizingKey: string | null
  onOpenDir: (name: string) => void
  onContextMenu: (e: React.MouseEvent, name: string) => void
}) {
  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0)
  
  const isAllSelected = filtered.length > 0 && filtered.every(f => selected.has(f.name))
  const isIndeterminate = !isAllSelected && filtered.some(f => selected.has(f.name))

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate, headerCheckboxRef])

  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
      <thead>
        <tr style={{ height: 44, color: '#8e8e93', fontSize: 13, fontWeight: 500 }}>
          <th style={{ textAlign: 'left', width: colWidths.name, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingLeft: 8, paddingBottom: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={isAllSelected}
                  style={{
                    appearance: 'none',
                    width: 16,
                    height: 16,
                    border: '1px solid #c7c7cc',
                    borderRadius: 4,
                    display: 'grid',
                    placeContent: 'center',
                    margin: 0,
                    backgroundColor: isAllSelected ? '#007aff' : 'transparent',
                    borderColor: isAllSelected ? '#007aff' : '#c7c7cc'
                  }}
                  onChange={(e) => {
                    // Prevent default checkbox behavior to fully control state
                    // e.preventDefault() 
                    // Note: onChange is late, onClick is better for prevention but we use logic here
                    if (isAllSelected) {
                      clearSelection()
                    } else {
                      setSelected(new Set(filtered.map(f => f.name)))
                    }
                  }}
                  onClick={(e) => {
                      e.stopPropagation()
                  }}
                />
                名称
              </label>
              <div
                style={{ position: 'absolute', right: -6, top: 0, bottom: 0, width: 13, cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                onMouseDown={(e) => startResize('name', 'modified', e)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ 
                  width: resizingKey === 'name' ? 2 : 1, 
                  height: resizingKey === 'name' ? '100%' : 16, 
                  backgroundColor: resizingKey === 'name' ? '#007aff' : '#d1d1d6',
                  transition: 'all 0.2s'
                }}></div>
              </div>
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.modified, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingLeft: 8 }}>
            修改日期
            <div
              style={{ position: 'absolute', right: -6, top: 0, bottom: 0, width: 13, cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
              onMouseDown={(e) => startResize('modified', 'type', e)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: resizingKey === 'modified' ? 2 : 1, 
                height: resizingKey === 'modified' ? '100%' : 16, 
                backgroundColor: resizingKey === 'modified' ? '#007aff' : '#d1d1d6',
                transition: 'all 0.2s'
              }}></div>
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.type, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingLeft: 8 }}>
            类型
            <div
              style={{ position: 'absolute', right: -6, top: 0, bottom: 0, width: 13, cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
              onMouseDown={(e) => startResize('type', null, e)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: resizingKey === 'type' ? 2 : 1, 
                height: resizingKey === 'type' ? '100%' : 16, 
                backgroundColor: resizingKey === 'type' ? '#007aff' : '#d1d1d6',
                transition: 'all 0.2s'
              }}></div>
            </div>
          </th>
          <th style={{ textAlign: 'left', paddingRight: 20, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingLeft: 8, whiteSpace: 'nowrap' }}>
            大小
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
            <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7' }}>
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
                    flexShrink: 0,
                    backgroundColor: selected.has(e.name) ? '#007aff' : 'transparent',
                    borderColor: selected.has(e.name) ? '#007aff' : '#c7c7cc'
                  }}
                />
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {e.is_dir ? (
                    <Folder size={20} fill="#007aff" stroke="none" />
                  ) : (
                    <FileText size={20} color="#8e8e93" strokeWidth={1.5} />
                  )}
                </div>
                <span style={{ fontSize: 13, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
              </div>
            </td>
            <td style={{ fontSize: 13, color: '#8e8e93', borderBottom: '1px solid #f2f2f7', paddingLeft: 8 }}>{fmtTime(e.modified_ts)}</td>
            <td style={{ fontSize: 13, color: '#8e8e93', borderBottom: '1px solid #f2f2f7', paddingLeft: 8 }}>{e.is_dir ? '文件夹' : '文件'}</td>
            <td style={{ fontSize: 13, color: '#8e8e93', textAlign: 'left', paddingRight: 20, borderBottom: '1px solid #f2f2f7', paddingLeft: 8, whiteSpace: 'nowrap' }}>{e.is_dir ? '--' : fmtSize(e.size)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
