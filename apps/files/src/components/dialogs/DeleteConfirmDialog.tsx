/**
 * DeleteConfirmDialog Component
 * Dialog for confirming file/folder deletion
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  paths: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  paths,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const itemCount = paths.length;
  const itemType = paths.length === 1 ? paths[0].split('/').pop() : '';

  return createPortal(
    <div className="semi-portal" onContextMenu={(e) => e.preventDefault()}>
      <div
        className="semi-portal-inner"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10006,
        }}
      >
        <div style={styles.overlay} onClick={onClose} />
        <div style={styles.dialog} className="files-animate-in">
          <div style={styles.header}>
            <div style={styles.warningIcon}>
              <AlertTriangle size={24} />
            </div>
            <h2 style={styles.title}>确认删除</h2>
          </div>

          <div style={styles.content}>
            <p style={styles.message}>
              {itemCount === 1 ? (
                <>确定要删除「{itemType}」吗？此操作无法撤销。</>
              ) : (
                <>确定要删除这 {itemCount} 项吗？此操作无法撤销。</>
              )}
            </p>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.buttonSecondary}
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={styles.buttonDanger}
            >
              <Trash2 size={16} />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 10005,
  },
  dialog: {
    position: 'relative',
    width: 400,
    backgroundColor: 'var(--files-surface-0)',
    borderRadius: 'var(--files-radius-lg)',
    boxShadow: 'var(--files-shadow-xl)',
    border: '1px solid var(--files-divider)',
    overflow: 'hidden',
    zIndex: 10006,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-5)',
    borderBottom: '1px solid var(--files-divider)',
  },
  warningIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--files-danger)',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--files-text-primary)',
  },
  content: {
    padding: 'var(--files-space-4)',
  },
  message: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--files-text-secondary)',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-4)',
    borderTop: '1px solid var(--files-divider)',
    backgroundColor: 'var(--files-surface-1)',
  },
  buttonSecondary: {
    padding: 'var(--files-space-2) var(--files-space-4)',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: 'var(--files-radius-md)',
    border: '1px solid var(--files-divider)',
    backgroundColor: 'transparent',
    color: 'var(--files-text-primary)',
    cursor: 'pointer',
    transition: 'all var(--files-transition-fast)',
    fontFamily: 'inherit',
  },
  buttonDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-2)',
    padding: 'var(--files-space-2) var(--files-space-4)',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: 'var(--files-radius-md)',
    border: 'none',
    backgroundColor: 'var(--files-danger)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all var(--files-transition-fast)',
    fontFamily: 'inherit',
  },
};
