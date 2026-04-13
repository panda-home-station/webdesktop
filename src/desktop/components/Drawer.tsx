import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  anchorEl?: { x: number; y: number } | null
  width?: number | string
  children: React.ReactNode
  title?: React.ReactNode
  headerExtra?: React.ReactNode
}

export function Drawer({
  open,
  onClose,
  anchorEl,
  width = 400,
  children,
  title,
  headerExtra
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  const panelWidth = typeof width === 'number' ? width : 400
  const panelHeight = 520

  const position = anchorEl
    ? (() => {
        const preferredTop = anchorEl.y + 44
        const preferredLeft = Math.min(anchorEl.x, window.innerWidth - panelWidth - 12)

        if (preferredTop + panelHeight > window.innerHeight - 12) {
          return {
            left: preferredLeft,
            top: Math.max(12, anchorEl.y - panelHeight - 8),
          }
        }

        return {
          left: preferredLeft,
          top: preferredTop,
        }
      })()
    : {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        width,
        maxHeight: 'calc(100vh - 24px)',
        zIndex: 10001,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'drawer-appear 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      {(title || headerExtra) && (
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          {title && (
            <div style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#1C1C1E',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              {title}
            </div>
          )}
          {headerExtra && <div>{headerExtra}</div>}
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>

      <style>{`
        @keyframes drawer-appear {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  , document.body)
}
