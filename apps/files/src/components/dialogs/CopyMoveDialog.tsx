/**
 * CopyMoveDialog Component
 * Dialog for copying or moving files
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Scissors, FolderOpen } from 'lucide-react';

interface CopyMoveDialogProps {
  isOpen: boolean;
  operation: 'copy' | 'move';
  sources: string[];
  onClose: () => void;
  onConfirm: (destination: string) => void;
}

export const CopyMoveDialog: React.FC<CopyMoveDialogProps> = ({
  isOpen,
  operation,
  sources,
  onClose,
  onConfirm,
}) => {
  const [destination, setDestination] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Default to parent directory of first source
      const firstSource = sources[0] || '';
      const parentPath = firstSource.substring(0, firstSource.lastIndexOf('/'));
      setDestination(parentPath + '/');
      setIsConfirming(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, sources]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || isConfirming) return;

    setIsConfirming(true);
    try {
      onConfirm(destination.trim());
      onClose();
    } catch (error) {
      console.error(`Failed to ${operation}:`, error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isCopy = operation === 'copy';
  const title = isCopy ? '复制到' : '移动到';
  const Icon = isCopy ? Copy : Scissors;
  const itemCount = sources.length;
  const itemWord = itemCount === 1 ? '项' : '项';

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
        <div style={styles.dialog} className="files-animate-in" onKeyDown={handleKeyDown}>
          <div style={styles.header}>
            <Icon size={20} style={styles.headerIcon} />
            <h2 style={styles.title}>{title}</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.content}>
              <p style={styles.info}>
                已选择 {itemCount} {itemWord}
              </p>
              <p style={styles.label}>目标位置</p>
              <input
                ref={inputRef}
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="/mnt/pool1/dataset/"
                style={styles.input}
                disabled={isConfirming}
              />
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                style={styles.buttonSecondary}
                disabled={isConfirming}
              >
                取消
              </button>
              <button
                type="submit"
                style={styles.buttonPrimary}
                disabled={!destination.trim() || isConfirming}
              >
                <FolderOpen size={16} />
                {isConfirming ? '处理中...' : '选择'}
              </button>
            </div>
          </form>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 10005,
  },
  dialog: {
    position: 'relative',
    width: 420,
    backgroundColor: 'var(--files-surface-0)',
    borderRadius: 'var(--files-radius-lg)',
    boxShadow: 'var(--files-shadow-xl)',
    border: '1px solid var(--files-divider)',
    overflow: 'hidden',
    zIndex: 10006,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-4)',
    borderBottom: '1px solid var(--files-divider)',
  },
  headerIcon: {
    color: 'var(--files-primary)',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--files-text-primary)',
  },
  content: {
    padding: 'var(--files-space-4)',
  },
  info: {
    margin: '0 0 var(--files-space-3) 0',
    fontSize: '13px',
    color: 'var(--files-text-secondary)',
  },
  label: {
    margin: '0 0 var(--files-space-2) 0',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--files-text-secondary)',
  },
  input: {
    width: '100%',
    padding: 'var(--files-space-3)',
    fontSize: '14px',
    borderRadius: 'var(--files-radius-md)',
    border: '1px solid var(--files-divider)',
    backgroundColor: 'var(--files-surface-1)',
    color: 'var(--files-text-primary)',
    outline: 'none',
    transition: 'border-color var(--files-transition-fast)',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
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
  buttonPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-2)',
    padding: 'var(--files-space-2) var(--files-space-4)',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: 'var(--files-radius-md)',
    border: 'none',
    backgroundColor: 'var(--files-primary)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all var(--files-transition-fast)',
    fontFamily: 'inherit',
  },
};
