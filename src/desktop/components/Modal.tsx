import React from 'react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  width?: number | string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
  headerExtra?: React.ReactNode
  contentStyle?: React.CSSProperties
}

export function Modal({
  open,
  onClose,
  title,
  width = 500,
  children,
  footer,
  className,
  style,
  bodyStyle,
  headerExtra,
  contentStyle,
}: ModalProps) {
  if (!open) return null

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={{
        width,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        animation: 'modal-pop 0.2s ease-out',
        ...contentStyle
      }}>
        {(title || headerExtra) && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e5ea',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
            {headerExtra}
          </div>
        )}
        {/* Body */}
      <div style={{ padding: 16, overflowY: 'auto', flex: 1, ...bodyStyle }}>
        {children}
      </div>

        {footer && (
          <div style={{
            padding: '12px 16px',
            background: '#f9f9f9',
            borderTop: '1px solid #e5e5ea',
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes modal-pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
