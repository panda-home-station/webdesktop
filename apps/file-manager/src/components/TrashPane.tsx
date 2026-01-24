import React from 'react'
import Icon from '@mdi/react'
import { mdiFolderOutline, mdiFileDocumentOutline } from '@mdi/js'

type Entry = { name: string; is_dir: boolean; size: number; modified_ts: number }

type Props = {
  entries: Entry[]
  selected: Set<string>
  toggleSelect: (name: string) => void
  fmtTime: (ts: number) => string
  fmtSize: (n: number) => string
  onRestoreSelected: () => Promise<void>
  onDeleteSelected: () => Promise<void>
  onEmptyTrash: () => Promise<void>
  onRestoreOne: (name: string) => Promise<void>
  onDeleteOne: (name: string) => Promise<void>
}

export default function TrashPane({
  entries,
  selected,
  toggleSelect,
  fmtTime,
  fmtSize,
  onRestoreSelected,
  onDeleteSelected,
  onEmptyTrash,
  onRestoreOne,
  onDeleteOne
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12 }}>
        <button
          className="puter-button pressable"
          onClick={onRestoreSelected}
          disabled={selected.size === 0}
        >
          还原所选
        </button>
        <button
          className="puter-button pressable"
          onClick={onDeleteSelected}
          disabled={selected.size === 0}
        >
          删除所选
        </button>
        <button
          className="puter-button pressable"
          style={{ marginLeft: 'auto' }}
          onClick={onEmptyTrash}
        >
          清空回收站
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12, borderTop: '1px solid #e5e7eb' }}>
        {entries.length === 0 ? null : (
          <div style={{ display: 'grid', gap: 6 }}>
            {entries.map(e => {
              const checked = selected.has(e.name)
              return (
                <div
                  key={`trash-${e.name}`}
                  style={{ display: 'grid', gridTemplateColumns: '24px 1fr 120px 120px', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--win-border)', borderRadius: 8, background: checked ? 'rgba(0,0,0,0.06)' : '#fff', cursor: 'pointer' }}
                  onClick={() => toggleSelect(e.name)}
                >
                  <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {e.is_dir ? <Icon path={mdiFolderOutline} size={0.9} /> : <Icon path={mdiFileDocumentOutline} size={0.9} />}
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>大小：{e.is_dir ? '-' : fmtSize(e.size)} · 修改：{fmtTime(e.modified_ts)}</div>
                  </div>
                  <button className="puter-button" style={{ height: 28 }} onClick={async (ev) => { ev.stopPropagation(); await onRestoreOne(e.name) }}>还原</button>
                  <button className="puter-button" style={{ height: 28 }} onClick={async (ev) => { ev.stopPropagation(); await onDeleteOne(e.name) }}>删除</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
