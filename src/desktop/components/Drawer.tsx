import React, { useEffect, useRef, useState } from 'react'
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
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }

    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', handleResize)
    }, 100)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [open, onClose])

  if (!open) return null

  const panelWidth = typeof width === 'number' ? width : 400
  const viewportHeight = viewport.height
  const viewportWidth = viewport.width
  const margin = 12

  // Minimum height for the drawer
  const minHeight = 300
  // Maximum height for the drawer (full screen height by default)
  const maxHeight = viewportHeight - margin * 2

  const position = anchorEl
    ? (() => {
        const preferredLeft = Math.min(anchorEl.x, viewportWidth - panelWidth - margin) + 8

        // Space below preferredTop to viewport bottom
        const spaceBelow = viewportHeight - (anchorEl.y + 44) - margin
        // Space above anchor point to viewport top
        const spaceAbove = anchorEl.y - margin

        if (spaceBelow >= minHeight && spaceBelow >= spaceAbove) {
          // Position below anchor, align bottom to screen bottom
          return {
            left: preferredLeft,
            top: anchorEl.y + 44,
            maxHeight: Math.min(Math.max(spaceBelow, minHeight), maxHeight),
          }
        }

        if (spaceAbove >= minHeight) {
          // Position above anchor, align to screen bottom
          const top = margin
          const height = viewportHeight - margin * 2
          return {
            left: preferredLeft,
            top,
            maxHeight: Math.max(height, minHeight),
          }
        }

        // Neither has enough space, use the larger one
        if (spaceBelow >= spaceAbove) {
          return {
            left: preferredLeft,
            top: anchorEl.y + 44,
            maxHeight: Math.max(spaceBelow, minHeight),
          }
        }

        const top = margin
        const height = viewportHeight - margin * 2
        return {
          left: preferredLeft,
          top,
          maxHeight: Math.max(height, minHeight),
        }
      })()
    : {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        maxHeight,
      }

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        width,
        height: position.maxHeight,
        maxHeight: position.maxHeight,
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
        overflow: 'auto',
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
