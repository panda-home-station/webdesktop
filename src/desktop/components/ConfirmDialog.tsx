/**
 * Confirm Dialog Component
 * A simple confirmation dialog with title, message, and buttons
 */

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

// Color constants matching the theme
const colors = {
  primary: '#0066cc',
  danger: '#dc3545',
  text: '#1a1a1a',
  textSecondary: '#666666',
  background: '#f5f5f7',
  cardBg: '#ffffff',
  border: '#e5e5ea',
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  dangerous?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  dangerous = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width={450}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={styles.content}>
        {dangerous && (
          <div style={styles.iconContainer}>
            <AlertTriangle size={32} color={colors.danger} />
          </div>
        )}
        <div style={styles.message}>{message}</div>
      </div>
      <div style={styles.actions}>
        <button
          onClick={onCancel}
          style={styles.cancelButton}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          style={{
            ...styles.confirmButton,
            backgroundColor: dangerous ? colors.danger : colors.primary,
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    marginBottom: 24,
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    lineHeight: 1.6,
    color: colors.text,
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: colors.text,
  },
  confirmButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
  },
}