import React, { useEffect } from 'react'
import { Folder, FileText } from 'lucide-react'

type TrashMetadata = {
  originalPath: string
  deletionTime: number
}

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
  trashMetadata,
  colWidths,
  startResize,
  headerCheckboxRef,
  resizingKey
}: {
  filtered: { name: string; is_dir: boolean; size: number; modified_ts: number }[]
  selected: Set<string>
  setSelected: (s: Set<string>) => void
  clearSelection: () => void
  toggleSelect: (name: string) => void
  fmtTime: (ts: number) => string
  fmtSize: (n: number) => string
  onOpenDir: (name: string) => void
  onContextMenu: (e: React.MouseEvent, name: string) => void
  trashMetadata: Record<string, TrashMetadata>
  colWidths: Record<string, number>
  startResize: (key: string, nextKey: string | null, e: React.MouseEvent) => void
  headerCheckboxRef: React.RefObject<HTMLInputElement>
  resizingKey: string | null
}) {
  const isAllSelected = filtered.length > 0 && filtered.every(f => selected.has(f.name))
  const isIndeterminate = !isAllSelected && filtered.some(f => selected.has(f.name))

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate, headerCheckboxRef])

  // Calculate remaining time
  const getRemainingTime = (deletionTime: number) => {
    if (!deletionTime) return '-'
    const now = Date.now()
    const diff = now - deletionTime
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const remaining = 30 - days
    if (remaining <= 0) return '即将删除'
    return `${remaining}天`
  }

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
          <th style={{ textAlign: 'left', paddingRight: 20, borderBottom: '1px solid #e5e5ea', paddingLeft: 8 }}>
            删除时间
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((e) => {
          const meta = trashMetadata[e.name] || {}
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
                      <Folder size={20} fill="#FFC107" stroke="none" />
                    ) : (
                      <FileText size={20} color="#8e8e93" strokeWidth={1.5} />
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                </div>
              </td>
              <td style={{ fontSize: 13, color: '#8e8e93', borderBottom: '1px solid #f2f2f7', paddingLeft: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {meta.originalPath || '-'}
              </td>
              <td style={{ fontSize: 13, color: '#8e8e93', borderBottom: '1px solid #f2f2f7', paddingLeft: 8 }}>
                {fmtSize(e.size)}
              </td>
              <td style={{ fontSize: 13, color: '#8e8e93', borderBottom: '1px solid #f2f2f7', paddingLeft: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span>{meta.deletionTime ? new Date(meta.deletionTime).toLocaleString() : '-'}</span>
                   {meta.deletionTime && <span style={{ fontSize: 11, color: '#ff3b30' }}>剩 {getRemainingTime(meta.deletionTime)}</span>}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
