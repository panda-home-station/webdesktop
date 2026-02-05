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
  headerExtra?: React.ReactNode
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
  headerExtra 
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
        animation: 'modal-pop 0.2s ease-out'
      }}>
        {(title || headerExtra) && (
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e5ea',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
            {headerExtra}
          </div>
        )}
        
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            padding: '16px 24px',
            background: '#f9f9f9',
            borderTop: '1px solid #e5e5ea',
            flexShrink: 0
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
