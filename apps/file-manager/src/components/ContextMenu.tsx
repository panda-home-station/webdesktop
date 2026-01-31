import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type ContextMenuItem = {
  label?: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  color?: string
}

type Props = {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({ top: y, left: x, opacity: 0 })

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      let top = y
      let left = x
      
      // Boundary detection
      if (y + rect.height > window.innerHeight) {
        top = y - rect.height
      }
      if (x + rect.width > window.innerWidth) {
        left = x - rect.width
      }
      
      // Ensure it doesn't go off top/left
      if (top < 0) top = 0
      if (left < 0) left = 0
      
      setStyle({ top, left, opacity: 1 })
    }
  }, [x, y])

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', down, true)
    return () => window.removeEventListener('mousedown', down, true)
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      className="context-menu"
      style={{
        position: 'fixed',
        zIndex: 99999,
        ...style,
        background: 'rgba(243, 244, 246, 0.96)',
        backdropFilter: 'blur(8px)',
        borderRadius: 10,
        padding: 6,
        boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
        border: '1px solid rgba(0,0,0,0.1)',
        minWidth: 160,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        transition: 'opacity 0.1s ease-out',
        color: '#1f2937'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        item.divider ? (
          <div key={i} style={{ height: 1, background: 'rgba(0,0,0,0.1)', margin: '4px 0' }} />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick()
                onClose()
              }
            }}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              fontSize: 14,
              borderRadius: 6,
              cursor: item.disabled ? 'default' : 'pointer',
              color: item.color || (item.disabled ? '#999' : 'inherit'),
              transition: 'background 0.1s',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = '#d1d5db'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {item.icon && <span style={{ width: 16, display: 'flex', justifyContent: 'center' }}>{item.icon}</span>}
            {item.label}
          </button>
        )
      ))}
    </div>,
    document.body
  )
}
