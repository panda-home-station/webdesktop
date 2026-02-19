import React, { useEffect } from 'react'
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react'

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
  onContextMenu,
  onToggleExpand
}: {
  path: string
  filtered: { name: string; is_dir: boolean; size: number; modified_ts: number; level?: number; expanded?: boolean; path?: string }[]
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
  onToggleExpand?: (name: string) => void
}) {
  const totalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0)
  
  const isAllSelected = filtered.length > 0 && filtered.every(f => selected.has(f.path || f.name))
  const isIndeterminate = !isAllSelected && filtered.some(f => selected.has(f.path || f.name))

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
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
                  onChange={() => {
                    // Handled by onClick to ensure correct toggle logic based on current state
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isAllSelected) {
                      clearSelection()
                    } else {
                      setSelected(new Set(filtered.map(f => f.path || f.name)))
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
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
            key={e.path || e.name}
            data-name={e.path || e.name}
            className={`list-row ${selected.has(e.path || e.name) ? 'selected' : ''}`}
            style={{
              height: 44,
              cursor: 'default',
              transition: 'background-color 0.1s',
              backgroundColor: selected.has(e.path || e.name) ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
            }}
            onClick={(ev) => {
               // If control/cmd key is pressed, toggle. Otherwise set selected.
               // But usually file managers allow simple click to select one.
               if (ev.metaKey || ev.ctrlKey) {
                 toggleSelect(e.path || e.name)
               } else if (ev.shiftKey) {
                 // Shift select logic could be added here, but simple for now
                 toggleSelect(e.path || e.name)
               } else {
                 setSelected(new Set([e.path || e.name]))
               }
               ev.stopPropagation()
            }}
            onDoubleClick={() => {
              if (e.is_dir) {
                onOpenDir(e.path || e.name)
              }
            }}
            onContextMenu={(ev) => onContextMenu(ev, e.path || e.name)}
          >
            <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: (e.level || 0) * 22, flexShrink: 0 }} />
                {e.is_dir && onToggleExpand ? (
                  <div 
                    onClick={(ev) => {
                      ev.stopPropagation()
                      onToggleExpand(e.path || e.name)
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      flexShrink: 0,
                      marginRight: 6,
                    }}
                    onMouseEnter={(ev) => ev.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(ev) => ev.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {e.expanded ? <ChevronDown size={14} color="#8e8e93" /> : <ChevronRight size={14} color="#8e8e93" />}
                  </div>
                ) : <div style={{ width: 16, flexShrink: 0, marginRight: 6 }} />}
                
                <div style={{ display: 'flex', flexShrink: 0, marginRight: 6 }}>
                  {e.is_dir ? (
                    <Folder size={20} fill="#FFC107" stroke="none" />
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
