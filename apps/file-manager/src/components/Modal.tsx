import React from 'react'
import { X } from 'lucide-react'

type Props = {
  title: string
  children: React.ReactNode
  onClose: () => void
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  danger?: boolean // For delete actions
}

export default function Modal({
  title,
  children,
  onClose,
  onConfirm,
  confirmText = '确定',
  cancelText = '取消',
  danger = false
}: Props) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.2)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: 320,
        maxWidth: '90%',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: 4, 
              color: '#9ca3af',
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>
        
        <div style={{ padding: 20 }}>
          {children}
        </div>
        
        <div style={{
          padding: '12px 20px',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: 'white',
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button 
              onClick={onConfirm}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: danger ? '#ef4444' : '#2563eb',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
