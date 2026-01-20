import React, { useRef, useEffect } from 'react'

export interface WinProps {
  id: string
  title: string
  content: React.ReactNode
  iconUrl?: string
  x?: number
  y?: number
  w?: number
  h?: number
  minimized?: boolean
  maximized?: boolean
  zIndex: number
  isActive?: boolean
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onMinimize: (id: string) => void
  onMaximize: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, w: number, h: number, x?: number, y?: number) => void
  minW?: number
  minH?: number
}

export default function Window({
  id,
  title,
  content,
  iconUrl,
  x = 60,
  y = 60,
  w = 600,
  h = 400,
  minimized,
  maximized,
  zIndex,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  minW = 300,
  minH = 200
}: WinProps) {
  if (minimized) return null

  const handleMouseDown = () => {
    onFocus(id)
  }

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (maximized) return
    const startX = e.clientX
    const startY = e.clientY
    const initX = x
    const initY = y

    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const pad = 0
      const W = window.innerWidth
      const H = window.innerHeight
      // Simple boundary check
      const nx = Math.max(pad, Math.min(initX + dx, W - w - pad))
      const ny = Math.max(0, Math.min(initY + dy, H - h - pad))
      onMove(id, nx, ny)
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  const createResizeHandler = (
    direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (maximized) return
    const startX = e.clientX
    const startY = e.clientY
    const initW = w
    const initH = h
    const initX = x
    const initY = y

    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let nextW = initW
      let nextH = initH
      let nextX = initX
      let nextY = initY

      if (direction.includes('e')) {
        nextW = Math.max(minW, initW + dx)
      }
      if (direction.includes('w')) {
        const diff = Math.min(initW - minW, dx) // Limit shrinking to minW
        // Better logic: calculate potential new width first
        const potentialW = initW - dx
        if (potentialW >= minW) {
          nextW = potentialW
          nextX = initX + dx
        } else {
            // sticky at min width
            nextW = minW
            nextX = initX + (initW - minW)
        }
      }
      if (direction.includes('s')) {
        nextH = Math.max(minH, initH + dy)
      }
      if (direction.includes('n')) {
        const potentialH = initH - dy
         if (potentialH >= minH) {
          nextH = potentialH
          nextY = initY + dy
        } else {
            nextH = minH
            nextY = initY + (initH - minH)
        }
      }

      onResize(id, nextW, nextH, nextX !== initX ? nextX : undefined, nextY !== initY ? nextY : undefined)
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        width: w,
        height: h,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--win-bg)',
        borderLeft: '1px solid var(--win-border)',
        borderRight: '1px solid var(--win-border)',
        borderBottom: '1px solid var(--win-border)',
        borderTop: maximized ? 'none' : '1px solid var(--win-border)',
        borderRadius: 'var(--win-radius)',
        boxShadow: 'var(--win-shadow)',
        backdropFilter: 'blur(22px)',
        zIndex: zIndex
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title Bar */}
      <div
        className="puter-titlebar"
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          cursor: 'move',
          borderTopLeftRadius: 'var(--win-radius)',
          borderTopRightRadius: 'var(--win-radius)',
          userSelect: 'none'
        }}
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={() => onMaximize(id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {iconUrl ? (
            <img src={iconUrl} alt="" width={18} height={18} style={{ borderRadius: 4 }} />
          ) : (
            <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(0,0,0,0.08)' }} />
          )}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 16 }}>{title}</span>
        </div>
        <div className="win-ctl" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <button
            className="win-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onMinimize(id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <rect x="5" y="12" width="14" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
          <button
            className="win-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onMaximize(id)}
          >
            {maximized ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                <rect x="10" y="10" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
          <button
            className="win-btn close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onClose(id)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        color: 'var(--text)',
        position: 'relative',
        overflow: 'auto',
        background: '#ffffff',
        borderBottomLeftRadius: 'var(--win-radius)',
        borderBottomRightRadius: 'var(--win-radius)'
      }}>
        {content}

        {/* Resize Handles */}
        {!maximized && (
          <>
            {/* SE */}
            <div
              style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize', background: 'transparent', zIndex: 5 }}
              onMouseDown={createResizeHandler('se')}
            />
            {/* SW */}
            <div
              style={{ position: 'absolute', left: 0, bottom: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
              onMouseDown={createResizeHandler('sw')}
            />
            {/* NW */}
            <div
              style={{ position: 'absolute', left: 0, top: 0, width: 14, height: 14, cursor: 'nwse-resize' }}
              onMouseDown={createResizeHandler('nw')}
            />
            {/* NE */}
            <div
              style={{ position: 'absolute', right: 0, top: 0, width: 14, height: 14, cursor: 'nesw-resize' }}
              onMouseDown={createResizeHandler('ne')}
            />
            {/* W */}
            <div
              style={{ position: 'absolute', left: 0, top: 0, width: 10, height: '100%', cursor: 'ew-resize' }}
              onMouseDown={createResizeHandler('w')}
            />
            {/* E */}
            <div
              style={{ position: 'absolute', right: 0, top: 0, width: 10, height: '100%', cursor: 'ew-resize' }}
              onMouseDown={createResizeHandler('e')}
            />
            {/* S */}
            <div
              style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 8, cursor: 'ns-resize' }}
              onMouseDown={createResizeHandler('s')}
            />
             {/* N - typically harder because of titlebar, but if we allow resizing from top border */}
             {/* We usually don't have a top resize handle over the titlebar unless it's very thin pixel at the top. 
                 The original code didn't seem to have a clear 'n' resize handle separate from corners? 
                 Wait, I missed 'n' in the original code? 
                 Let's check the original code again.
             */}
          </>
        )}
      </div>
    </div>
  )
}
