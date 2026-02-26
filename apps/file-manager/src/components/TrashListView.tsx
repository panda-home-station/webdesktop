import React, { useEffect } from 'react'
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react'
import { FileEntry } from '../types'

export default function TrashListView({
  filtered,
  selected,
  setSelected,
  clearSelection,
  toggleSelect,
  fmtTime,
  fmtSize,
  onOpenDir,
  onContextMenu,
  currentPath,
  colWidths,
  startResize,
  headerCheckboxRef,
  resizingKey,
  onToggleExpand,
}: {
  filtered: FileEntry[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  clearSelection: () => void
  toggleSelect: (name: string) => void
  fmtTime: (ts: number) => string
  fmtSize: (n: number) => string
  onOpenDir: (name: string) => void
  onContextMenu: (e: React.MouseEvent, name: string) => void
  currentPath: string
  colWidths: Record<string, number>
  startResize: (key: string, nextKey: string | null, e: React.MouseEvent) => void
  headerCheckboxRef: React.RefObject<HTMLInputElement>
  resizingKey: string | null
  onToggleExpand?: (name: string) => void
}) {
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => {}}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isAllSelected) {
                      clearSelection()
                    } else {
                      setSelected(new Set(filtered.map(f => f.name)))
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
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
                />
                名称
              </label>
              <div
                style={{ position: 'absolute', right: -6, top: 0, bottom: 0, width: 13, cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                onMouseDown={(e) => startResize('name', 'originalPath', e)}
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
          <th style={{ textAlign: 'left', width: colWidths.originalPath, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingLeft: 8 }}>
            原目录
            <div
              style={{ position: 'absolute', right: -6, top: 0, bottom: 0, width: 13, cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
              onMouseDown={(e) => startResize('originalPath', 'size', e)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: resizingKey === 'originalPath' ? 2 : 1, 
                height: resizingKey === 'originalPath' ? '100%' : 16, 
                backgroundColor: resizingKey === 'originalPath' ? '#007aff' : '#d1d1d6',
                transition: 'all 0.2s'
              }}></div>
            </div>
          </th>
          <th style={{ textAlign: 'left', width: colWidths.size, position: 'relative', borderBottom: '1px solid #e5e5ea', paddingLeft: 8 }}>
            大小
            <div
              style={{ position: 'absolute', right: -6, top: 0, bottom: 0, width: 13, cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
              onMouseDown={(e) => startResize('size', null, e)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ 
                width: resizingKey === 'size' ? 2 : 1, 
                height: resizingKey === 'size' ? '100%' : 16, 
                backgroundColor: resizingKey === 'size' ? '#007aff' : '#d1d1d6',
                transition: 'all 0.2s'
              }}></div>
            </div>
          </th>
          <th style={{ textAlign: 'left', paddingRight: 20, borderBottom: '1px solid #e5e5ea', paddingLeft: 8, whiteSpace: 'nowrap' }}>
            删除时间
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((e) => {
          const displayName = e.name
          const isDir = e.is_dir
          return (
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
                 const id = e.name
                 if (ev.metaKey || ev.ctrlKey) {
                   toggleSelect(id)
                 } else if (ev.shiftKey) {
                   toggleSelect(id)
                 } else {
                   setSelected(new Set([id]))
                 }
                 ev.stopPropagation()
              }}
              onContextMenu={(ev) => onContextMenu(ev, e.name)}
            >
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: (e.level || 0) * 22, flexShrink: 0 }} />
                  {isDir && onToggleExpand ? (
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
                      {(e as any).expanded ? <ChevronDown size={14} color="#8e8e93" /> : <ChevronRight size={14} color="#8e8e93" />}
                    </div>
                  ) : <div style={{ width: 16, flexShrink: 0, marginRight: 6 }} />}
                  {isDir ? (
                    <Folder size={20} color="#007aff" fill="#007aff" fillOpacity={0.2} strokeWidth={1.5} style={{ marginRight: 8 }} />
                  ) : (
                    <FileText size={20} color="#8e8e93" strokeWidth={1.5} style={{ marginRight: 8 }} />
                  )}
                  <span style={{ fontSize: 14, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </span>
                </div>
              </td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7' }}>
                <div style={{ fontSize: 13, color: '#8e8e93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentPath.startsWith('/Trash') ? (currentPath.slice('/Trash'.length) || '/') : '-'}
                </div>
              </td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7' }}>
                <div style={{ fontSize: 13, color: '#8e8e93' }}>
                  {isDir ? '--' : fmtSize(e.size || 0)}
                </div>
              </td>
              <td style={{ paddingLeft: 8, borderBottom: '1px solid #f2f2f7' }}>
                <div style={{ fontSize: 13, color: '#8e8e93' }}>
                  {fmtTime(e.modified_ts || 0)}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
