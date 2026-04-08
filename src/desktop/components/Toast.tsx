/**
 * Toast Component
 *
 * Displays temporary notifications and messages
 */

import { useEffect, useRef } from 'react'
import { Check, X, Info, AlertTriangle, XCircle } from 'lucide-react'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Toast Component
 *
 * Displays a single toast notification
 */
export function Toast({ id, type, title, description, duration, onClose, action }: ToastProps) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onClose(id)
      }, duration)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [id, duration, onClose])

  /**
   * Get icon based on toast type
   */
  const getIcon = () => {
    const iconSize = 20
    const iconColor = {
      success: '#10b981',
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
    }[type]

    switch (type) {
      case 'success':
        return <Check size={iconSize} color={iconColor} />
      case 'info':
        return <Info size={iconSize} color={iconColor} />
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />
      case 'error':
        return <XCircle size={iconSize} color={iconColor} />
    }
  }

  /**
   * Get background color
   */
  const getBackground = () => {
    return {
      success: '#ecfdf5',
      info: '#eff6ff',
      warning: '#fef3c7',
      error: '#fee2e2',
    }[type]
  }

  /**
   * Get border color
   */
  const getBorderColor = () => {
    return {
      success: '#a7f3d0',
      info: '#bfdbfe',
      warning: '#fde68a',
      error: '#fecaca',
    }[type]
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        background: getBackground(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        minWidth: 320,
        maxWidth: 480,
        animation: 'toast-slide-in 0.3s ease-out',
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: 12,
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        style={{
          flexShrink: 0,
          padding: 4,
          background: 'transparent',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          borderRadius: 4,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

/**
 * Toast Container Component
 *
 * Displays multiple toasts in a stack
 */
interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 100000,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}

// Add animation styles to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes toast-slide-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes toast-slide-out {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `
  document.head.appendChild(style)
}
