import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Icon from '@mdi/react'
import { mdiAbTesting } from '@mdi/js'
import { getAppContextMenu, setDragging, subscribeDragging } from '../../shared/sdk/desktop'
import { WindowContext } from '../../shared/sdk/window'

export interface WinProps {
  id: string
  title: string
  content: React.ReactNode
  iconUrl?: string
  appId: string
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
  onDragFromMaximized?: (id: string, x: number, y: number, w: number, h: number) => void
  onTitleChange?: (id: string, title: string) => void
  restoreRect?: { x: number; y: number; w: number; h: number }
  minW?: number
  minH?: number
}

export default function Window({
  id,
  title,
  content,
  iconUrl,
  appId,
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
  onDragFromMaximized,
  onTitleChange,
  restoreRect,
  minW = 300,
  minH = 200,
  isActive
}: WinProps) {
  if (minimized) return null

  // Validate numeric values to prevent NaN
  const safeX = Number.isFinite(x) ? x : 60
  const safeY = Number.isFinite(y) ? y : 60
  const safeW = Number.isFinite(w) ? w : 600
  const safeH = Number.isFinite(h) ? h : 400

  // Log invalid values for debugging
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) {
    console.warn('Invalid window dimensions:', { id, x, y, w, h })
  }

  const winRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; items: { label: string; onClick?: () => void }[] } | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  const contextValue = useMemo(() => ({
    id,
    appId,
    setTitle: (t: string) => onTitleChange?.(id, t),
    close: () => onClose(id),
    minimize: () => onMinimize(id),
    maximize: () => onMaximize(id),
    isActive: !!isActive
  }), [id, appId, onTitleChange, onClose, onMinimize, onMaximize, isActive])

  const handleMouseDown = () => {
    onFocus(id)
  }

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    
    let dragStartX = e.clientX
    let dragStartY = e.clientY
    let dragInitX = safeX
    let dragInitY = safeY
    let isDraggingMaximized = maximized
    let hasRestored = false

    // Use transform for performance to avoid React re-renders during drag
    let lastDx = 0
    let lastDy = 0
    let rafId: number | null = null

    // Performance optimization: remove heavy styles during drag
    if (winRef.current) {
      // 仅对当前拖拽的窗口禁用昂贵的特效，以保证其移动的绝对流畅
      winRef.current.style.boxShadow = 'none'
      winRef.current.style.willChange = 'transform'
    }

    setDragging(true)

    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartX
      const dy = ev.clientY - dragStartY
      
      if (isDraggingMaximized && !hasRestored) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
           const rect = restoreRect || { w: Math.min(safeW, 800), h: Math.min(safeH, 600), x: safeX, y: safeY }
           const currentW = safeW || 800
           const offsetX = dragStartX - dragInitX
           // Prevent division by zero
           const percent = currentW > 0 ? offsetX / currentW : 0
           const newW = Number.isFinite(rect.w) ? rect.w : Math.min(safeW, 800)
           const newH = Number.isFinite(rect.h) ? rect.h : Math.min(safeH, 600)
           const baseX = Number.isFinite(rect.x) ? rect.x : safeX
           const baseY = Number.isFinite(rect.y) ? rect.y : safeY
           const newX = ev.clientX - (newW * percent)
           const newY = ev.clientY - (dragStartY - dragInitY)

           if (onDragFromMaximized) {
             onDragFromMaximized(id, newX, newY, newW, newH)
           }

           hasRestored = true
           isDraggingMaximized = false

           // Reset drag base
           dragStartX = ev.clientX
           dragStartY = ev.clientY
           dragInitX = newX
           dragInitY = newY
           lastDx = 0
           lastDy = 0

           if (winRef.current) {
             // Force update styles to match restored state immediately
             winRef.current.style.width = `${newW}px`
             winRef.current.style.height = `${newH}px`
             winRef.current.style.left = `${newX}px`
             winRef.current.style.top = `${newY}px`
             winRef.current.style.transform = 'none'
             winRef.current.style.transition = 'none'
           }
        }
        return
      }

      // Calculate boundaries
      const W = window.innerWidth
      const H = window.innerHeight
      const currentW = hasRestored ? (restoreRect?.w || 800) : safeW
      
      const rawX = dragInitX + dx
      const rawY = dragInitY + dy
      
      // Allow dragging out of bounds but with limits
      // Left/Right: keep 30px visible
      // Top: >= -1 (allow covering 1px border/gap)
      const minX = 30 - currentW
      const maxX = W - 30
      const minY = -1
      const maxY = H - 30
      
      const clampedX = Math.max(minX, Math.min(rawX, maxX))
      const clampedY = Math.max(minY, Math.min(rawY, maxY))
      
      const newDx = clampedX - dragInitX
      const newDy = clampedY - dragInitY

      lastDx = newDx
      lastDy = newDy
      
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (winRef.current) {
            // Use translate3d for GPU acceleration
            winRef.current.style.transform = `translate3d(${lastDx}px, ${lastDy}px, 0)`
            winRef.current.style.transition = 'none'
          }
          rafId = null
        })
      }
    }

    const up = () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      setDragging(false)
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      if (isDraggingMaximized && !hasRestored) {
        // Restore styles if we didn't actually drag
        if (winRef.current) {
           winRef.current.style.boxShadow = 'var(--win-shadow)'
           winRef.current.style.willChange = 'auto'
        }
        return
      }

      const W = window.innerWidth
      const H = window.innerHeight
      const currentW = hasRestored ? (restoreRect?.w || 800) : safeW

      const rawX = dragInitX + lastDx
      const rawY = dragInitY + lastDy
      
      const minX = 30 - currentW
      const maxX = W - 30
      const minY = -1
      const maxY = H - 30
      
      const nx = Math.round(Math.max(minX, Math.min(rawX, maxX)))
      const ny = Math.round(Math.max(minY, Math.min(rawY, maxY)))
      
      // Reset transform and transition
      if (winRef.current) {
        winRef.current.style.transform = ''
        winRef.current.style.transition = ''
        
        // Restore styles
        winRef.current.style.boxShadow = 'var(--win-shadow)'
        winRef.current.style.willChange = 'auto'
      }
      
      if (nx !== safeX || ny !== safeY || hasRestored) {
        onMove(id, nx, ny)
      }
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
    const initW = safeW
    const initH = safeH
    const initX = safeX
    const initY = safeY

    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let nextW = initW
      let nextH = initH
      let nextX = initX
      let nextY = initY

      const screenW = window.innerWidth
      const screenH = window.innerHeight

      if (direction.includes('e')) {
        nextW = Math.max(minW, Math.min(initW + dx, screenW - initX))
      }
      if (direction.includes('w')) {
        const rightEdge = initX + initW
        let potentialX = initX + dx
        let potentialW = initW - dx
        
        // 1. Ensure minimum width
        if (potentialW < minW) {
          potentialW = minW
          potentialX = rightEdge - minW
        }

        // 2. Ensure width doesn't exceed screen width
        if (potentialW > screenW) {
          potentialW = screenW
          potentialX = rightEdge - potentialW
        }
        
        // 3. Ensure left boundary doesn't go too far (respect WindowManager's 30px visibility rule)
        // x >= 30 - w  => x + w >= 30. Since rightEdge = x + w, this is usually true.
        const limitMinX = 30 - potentialW
        if (potentialX < limitMinX) {
          potentialX = limitMinX
          potentialW = rightEdge - potentialX
        }

        nextW = potentialW
        nextX = potentialX
      }
      if (direction.includes('s')) {
        nextH = Math.max(minH, Math.min(initH + dy, screenH - initY))
      }
      if (direction.includes('n')) {
        const bottomEdge = initY + initH
        let potentialY = initY + dy
        let potentialH = initH - dy

        // 1. Clamp Y to top boundary (-1)
        if (potentialY < -1) {
          potentialY = -1
          potentialH = bottomEdge - potentialY
        }

        // 2. Ensure minimum height
        if (potentialH < minH) {
          potentialH = minH
          potentialY = bottomEdge - minH
        }

        // 3. Ensure height doesn't exceed screen height
        if (potentialH > screenH) {
          potentialH = screenH
          potentialY = bottomEdge - potentialH
        }

        // 4. Final safety clamp for Y (if step 3 pushed it too far up)
        if (potentialY < -1) {
          potentialY = -1
          potentialH = bottomEdge - potentialY
        }

        nextH = potentialH
        nextY = potentialY
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
      ref={winRef}
      style={{
        position: 'absolute',
        top: maximized ? 0 : safeY,
        left: maximized ? safeX : safeX,
        width: maximized ? 'calc(100% - ' + safeX + 'px)' : safeW,
        height: maximized ? '100%' : safeH,
        display: 'flex',
        flexDirection: 'column',
        background: maximized ? 'var(--win-bg)' : 'transparent',
        borderRadius: maximized ? 0 : 'var(--win-radius)',
        boxShadow: maximized ? 'none' : 'var(--win-shadow)',
        border: maximized ? 'none' : '1px solid rgba(0,0,0,0.15)',
        overflow: 'hidden',
        zIndex: zIndex,
        boxSizing: 'border-box',
        WebkitFontSmoothing: 'antialiased',
        contain: 'paint'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title Bar */}
      <div
        className="win-title"
        style={{
          height: 38,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          cursor: 'move',
          borderTopLeftRadius: maximized ? 0 : 'var(--win-radius)',
          borderTopRightRadius: maximized ? 0 : 'var(--win-radius)',
          userSelect: 'none',
          background: 'var(--titlebar-bg)',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={() => onMaximize(id)}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const items = getAppContextMenu(appId, { x: e.clientX, y: e.clientY, target: e.currentTarget })
          if (items && items.length > 0) {
            setMenu({ x: e.clientX, y: e.clientY, items })
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {iconUrl ? (
            <img src={iconUrl} alt="" width={18} height={18} style={{ borderRadius: 4, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }} />
          ) : (
            <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(0,0,0,0.08)' }} />
          )}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 16, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>{title}</span>
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
      <div
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const items = getAppContextMenu(appId, { x: e.clientX, y: e.clientY, target: e.currentTarget })
          if (items && items.length > 0) {
            setMenu({ x: e.clientX, y: e.clientY, items })
          }
        }}
        style={{
        flex: 1,
        color: 'var(--text)',
        position: 'relative',
        overflow: 'hidden',
        contain: 'size layout paint style', // CSS Isolation
        background: '#ffffff',
          borderBottomLeftRadius: maximized ? 0 : 'var(--win-radius)',
          borderBottomRightRadius: maximized ? 0 : 'var(--win-radius)'
        }}>
          <WindowContext.Provider value={contextValue}>
            {content}
          </WindowContext.Provider>
          {menu && (
          <div className="semi-portal" style={{ zIndex: 10005 }}>
            <div tabIndex={-1} className="semi-portal-inner" style={{ position: 'fixed', left: menu.x, top: menu.y, zIndex: 10006 }}>
              <div style={{ minWidth: 160, padding: 6, borderRadius: 10, background: 'rgba(243,244,246,0.96)', backdropFilter: 'blur(8px)', border: '1px solid var(--win-border)', boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}>
                {menu.items.map((it, idx) => (
                  <button
                    key={idx}
                    style={{ width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => {
                      closeMenu()
                      try {
                        it.onClick && it.onClick()
                      } catch {}
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e5e7eb'
                      e.currentTarget.style.color = ''
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = ''
                    }}
                  >
                    <Icon path={mdiAbTesting} size={0.9} />
                    {it.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10004 }} onMouseDown={closeMenu} />
          </div>
        )}

      </div>

      {/* Resize Handles - moved outside content to avoid scrollbar overlap */}
      {!maximized && (
        <>
          {/* SE */}
          <div
            style={{ position: 'absolute', right: -6, bottom: -6, width: 16, height: 16, cursor: 'nwse-resize', background: 'transparent', zIndex: 101 }}
            onMouseDown={createResizeHandler('se')}
          />
          {/* SW */}
          <div
            style={{ position: 'absolute', left: -6, bottom: -6, width: 16, height: 16, cursor: 'nesw-resize', zIndex: 101 }}
            onMouseDown={createResizeHandler('sw')}
          />
          {/* NW */}
          <div
            style={{ position: 'absolute', left: -6, top: -6, width: 16, height: 16, cursor: 'nwse-resize', zIndex: 101 }}
            onMouseDown={createResizeHandler('nw')}
          />
          {/* NE */}
          <div
            style={{ position: 'absolute', right: -6, top: -6, width: 16, height: 16, cursor: 'nesw-resize', zIndex: 101 }}
            onMouseDown={createResizeHandler('ne')}
          />
          {/* W */}
          <div
            style={{ position: 'absolute', left: -5, top: 0, width: 10, height: '100%', cursor: 'ew-resize', zIndex: 100 }}
            onMouseDown={createResizeHandler('w')}
          />
          {/* E */}
          <div
            style={{ position: 'absolute', right: -5, top: 0, width: 10, height: '100%', cursor: 'ew-resize', zIndex: 100 }}
            onMouseDown={createResizeHandler('e')}
          />
          {/* S */}
          <div
            style={{ position: 'absolute', bottom: -5, left: 0, width: '100%', height: 10, cursor: 'ns-resize', zIndex: 100 }}
            onMouseDown={createResizeHandler('s')}
          />
          {/* N */}
          <div
            style={{ position: 'absolute', top: -5, left: 0, width: '100%', height: 10, cursor: 'ns-resize', zIndex: 100 }}
            onMouseDown={createResizeHandler('n')}
          />
        </>
      )}
    </div>
  )
}
