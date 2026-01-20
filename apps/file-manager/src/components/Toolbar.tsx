import React, { useRef, useEffect, useState } from 'react'
import Icon from '@mdi/react'
import {
  mdiArrowLeft,
  mdiArrowRight,
  mdiRefresh,
  mdiHome,
  mdiSort,
  mdiCheckBold,
  mdiViewList,
  mdiViewGridOutline
} from '@mdi/js'

function usePress() {
  const [pressed, setPressed] = useState(false)
  return {
    pressed,
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
  }
}

export default function Toolbar({
  back,
  forward,
  refresh,
  navIndex,
  navHist,
  navigate,
  crumbs,
  q,
  setQ,
  onUploadFiles,
  onCreateFolder,
  onDownloadSelected,
  onDeleteSelected,
  sortKey,
  setSortKey,
  sortOrder,
  setSortOrder,
  view,
  setView
}: {
  back: () => void
  forward: () => void
  refresh: () => void
  navIndex: number
  navHist: string[]
  navigate: (to: string) => void
  crumbs: { label: string; to: string }[]
  q: string
  setQ: (v: string) => void
  onUploadFiles: (files: FileList) => void
  onCreateFolder: () => void
  onDownloadSelected: () => void
  onDeleteSelected: () => void
  sortKey: 'name' | 'size' | 'modified_ts'
  setSortKey: (k: 'name' | 'size' | 'modified_ts') => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (o: 'asc' | 'desc') => void
  view: 'list' | 'grid'
  setView: (v: 'list' | 'grid') => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sortButtonRef = useRef<HTMLButtonElement | null>(null)
  const [showSortMenu, setShowSortMenu] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortButtonRef.current && !sortButtonRef.current.contains(event.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid var(--win-border)', color: '#111827' }}>
        <div className="button-group">
          <button className="puter-button" style={{ height: 28, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={back} disabled={navIndex === 0} title="后退">
            <Icon path={mdiArrowLeft} size={0.9} />
          </button>
          <button className="puter-button" style={{ height: 28, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={forward} disabled={navIndex >= navHist.length - 1} title="前进">
            <Icon path={mdiArrowRight} size={0.9} />
          </button>
        </div>
        <button className="puter-button" style={{ height: 28, width: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={refresh} title="刷新">
          <Icon path={mdiRefresh} size={1} />
        </button>
        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, width: '100%', minWidth: 0, height: 28, padding: '0 6px', borderRadius: 8, border: '1px solid var(--button-border)', background: 'var(--button-bg)' }}>
            <button className="puter-button" style={{ height: 28, width: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }} onClick={() => navigate('/')} title="主文件夹">
              <Icon path={mdiHome} size={1} />
            </button>
            {crumbs.slice(1).map((c, i) => (
              <React.Fragment key={`crumb-${i}-${c.to}`}>
                <span style={{ color: 'var(--muted)', padding: i === 0 ? '0 2px' : '0 6px' }}>{'/'}</span>
                <button className="puter-button" style={{ height: 28, padding: i === 0 ? '0 6px' : '0 8px', whiteSpace: 'nowrap', maxWidth: '30%', overflow: 'hidden', textOverflow: 'ellipsis', background: 'transparent', border: 'none' }} onClick={() => navigate(c.to)} title={c.label}>
                  {c.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索" style={{ width: 180, height: 28, padding: '0 8px', borderRadius: 8, border: '1px solid var(--button-border)', background: 'var(--button-bg)', color: '#111827' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid var(--win-border)', color: '#111827' }}>
        {/** 点击动画 */}
        {/** 上传 */}
        {/** 新建文件夹 */}
        {/** 下载 */}
        {/** 删除 */}
        {/** 更多 */}
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => { const files = e.target.files; if (files && files.length) onUploadFiles(files); if (fileInputRef.current) fileInputRef.current.value = '' }} />
        {(() => {
          const press = usePress()
          return (
            <button
              className="puter-button"
              style={{ height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', transition: 'transform 120ms ease, filter 120ms ease', transform: press.pressed ? 'scale(0.96)' : 'none', filter: press.pressed ? 'brightness(0.97)' : 'none', willChange: 'transform' }}
              onMouseDown={press.onMouseDown}
              onMouseUp={press.onMouseUp}
              onMouseLeave={press.onMouseLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              上传
            </button>
          )
        })()}
        {(() => {
          const press = usePress()
          return (
            <button
              className="puter-button"
              style={{ height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', transition: 'transform 120ms ease, filter 120ms ease', transform: press.pressed ? 'scale(0.96)' : 'none', filter: press.pressed ? 'brightness(0.97)' : 'none', willChange: 'transform' }}
              onMouseDown={press.onMouseDown}
              onMouseUp={press.onMouseUp}
              onMouseLeave={press.onMouseLeave}
              onClick={onCreateFolder}
            >
              新建文件夹
            </button>
          )
        })()}
        {(() => {
          const press = usePress()
          return (
            <button
              className="puter-button"
              style={{ height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', transition: 'transform 120ms ease, filter 120ms ease', transform: press.pressed ? 'scale(0.96)' : 'none', filter: press.pressed ? 'brightness(0.97)' : 'none', willChange: 'transform' }}
              onMouseDown={press.onMouseDown}
              onMouseUp={press.onMouseUp}
              onMouseLeave={press.onMouseLeave}
              onClick={onDownloadSelected}
            >
              下载
            </button>
          )
        })()}
        {(() => {
          const press = usePress()
          return (
            <button
              className="puter-button"
              style={{ height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', transition: 'transform 120ms ease, filter 120ms ease', transform: press.pressed ? 'scale(0.96)' : 'none', filter: press.pressed ? 'brightness(0.97)' : 'none', willChange: 'transform' }}
              onMouseDown={press.onMouseDown}
              onMouseUp={press.onMouseUp}
              onMouseLeave={press.onMouseLeave}
              onClick={onDeleteSelected}
            >
              删除
            </button>
          )
        })()}
        {(() => {
          const press = usePress()
          return (
            <button
              className="puter-button"
              style={{ height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', transition: 'transform 120ms ease, filter 120ms ease', transform: press.pressed ? 'scale(0.96)' : 'none', filter: press.pressed ? 'brightness(0.97)' : 'none', willChange: 'transform' }}
              onMouseDown={press.onMouseDown}
              onMouseUp={press.onMouseUp}
              onMouseLeave={press.onMouseLeave}
              onClick={() => alert('更多功能即将上线')}
            >
              更多
            </button>
          )
        })()}
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button ref={sortButtonRef} className="puter-button" style={{ height: 28, width: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }} onClick={() => setShowSortMenu(!showSortMenu)} title="排序">
              <Icon path={mdiSort} size={0.9} />
            </button>
            {showSortMenu && (
              <ul role="menu" aria-orientation="vertical" className="semi-dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, minWidth: 120, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '4px 0', margin: '4px 0', zIndex: 1000, listStyle: 'none' }}>
                <li role="menuitem" tabIndex={0} aria-disabled="false" className={`semi-dropdown-item semi-dropdown-item-withTick ${sortKey === 'name' ? 'semi-dropdown-item-active' : ''}`} onClick={() => setSortKey('name')} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#111827' }}>
                  <span role="img" aria-label="tick" className="semi-icon semi-icon-default semi-icon-tick" style={{ width: 16, height: 16, marginRight: 8, color: sortKey === 'name' ? 'currentColor' : 'transparent' }}>
                    <Icon path={mdiCheckBold} size={0.9} />
                  </span>
                  文件名
                </li>
                <li role="menuitem" tabIndex={-1} aria-disabled="false" className={`semi-dropdown-item semi-dropdown-item-withTick ${sortKey === 'modified_ts' ? 'semi-dropdown-item-active' : ''}`} onClick={() => setSortKey('modified_ts')} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#111827' }}>
                  <span role="img" aria-label="tick" className="semi-icon semi-icon-default semi-icon-tick" style={{ width: 16, height: 16, marginRight: 8, color: sortKey === 'modified_ts' ? 'currentColor' : 'transparent' }}>
                    <Icon path={mdiCheckBold} size={0.9} />
                  </span>
                  修改时间
                </li>
                <li role="menuitem" tabIndex={-1} aria-disabled="false" className={`semi-dropdown-item semi-dropdown-item-withTick ${sortKey === 'size' ? 'semi-dropdown-item-active' : ''}`} onClick={() => setSortKey('size')} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#111827' }}>
                  <span role="img" aria-label="tick" className="semi-icon semi-icon-default semi-icon-tick" style={{ width: 16, height: 16, marginRight: 8, color: sortKey === 'size' ? 'currentColor' : 'transparent' }}>
                    <Icon path={mdiCheckBold} size={0.9} />
                  </span>
                  大小
                </li>
                <div className="semi-dropdown-divider" style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }}></div>
                <li role="menuitem" tabIndex={-1} aria-disabled="false" className={`semi-dropdown-item semi-dropdown-item-withTick ${sortOrder === 'asc' ? 'semi-dropdown-item-active' : ''}`} onClick={() => setSortOrder('asc')} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#111827' }}>
                  <span role="img" aria-label="tick" className="semi-icon semi-icon-default semi-icon-tick" style={{ width: 16, height: 16, marginRight: 8, color: sortOrder === 'asc' ? 'currentColor' : 'transparent' }}>
                    <Icon path={mdiCheckBold} size={0.9} />
                  </span>
                  升序
                </li>
                <li role="menuitem" tabIndex={-1} aria-disabled="false" className={`semi-dropdown-item semi-dropdown-item-withTick ${sortOrder === 'desc' ? 'semi-dropdown-item-active' : ''}`} onClick={() => setSortOrder('desc')} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#111827' }}>
                  <span role="img" aria-label="tick" className="semi-icon semi-icon-default semi-icon-tick" style={{ width: 16, height: 16, marginRight: 8, color: sortOrder === 'desc' ? 'currentColor' : 'transparent' }}>
                    <Icon path={mdiCheckBold} size={0.9} />
                  </span>
                  降序
                </li>
              </ul>
            )}
          </div>
          <div title="切换列表视图" className="puter-button" style={{ height: 28, display: 'inline-flex', alignItems: 'center', padding: '0 2px', border: '1px solid var(--button-border)', borderRadius: 8, background: 'var(--button-bg)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                width: 48,
                height: 24,
                borderRadius: 6,
                background: view === 'grid' ? 'var(--button-bg)' : 'var(--semi-color-primary)',
                justifyContent: 'flex-start',
                transition: 'background-color 180ms ease'
              }}
              onClick={() => setView(view === 'list' ? 'grid' : 'list')}
              role="switch"
              aria-checked={view === 'list'}
              aria-label="切换显示样式"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setView(view === 'list' ? 'grid' : 'list')
                }
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '0 4px', zIndex: 0, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', opacity: view === 'list' ? 1 : 0.5 }}>
                  <Icon path={mdiViewList} size={0.9} />
                </div>
                <div style={{ display: 'flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', opacity: view === 'grid' ? 1 : 0.5 }}>
                  <Icon path={mdiViewGridOutline} size={0.9} />
                </div>
              </div>
              <div style={{ filter: 'drop-shadow(rgba(32, 35, 39, 0.12) 0px 0.667px 1.333px)', transform: view === 'list' ? 'translateX(2px)' : 'translateX(22px)', transformOrigin: '50% 50% 0px', position: 'relative', zIndex: 1, transition: 'transform 180ms ease', width: 24, height: 24, borderRadius: 6, background: 'var(--semi-color-bg-1)' }}></div>
            </div>
          </div>
        </span>
      </div>
    </>
  )
}
