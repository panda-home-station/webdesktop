/**
 * RenameDialog Component
 * Dialog for renaming a file or folder
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Edit } from 'lucide-react';

interface RenameDialogProps {
  isOpen: boolean;
  oldPath: string;
  oldName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  oldPath: _oldPath,
  oldName,
  onClose,
  onRename,
}) => {
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewName(oldName);
      setIsRenaming(false);
      setTimeout(() => {
        inputRef.current?.focus();
        // Select filename without extension
        const dotIndex = oldName.lastIndexOf('.');
        if (dotIndex > 0) {
          inputRef.current?.setSelectionRange(0, dotIndex);
        } else {
          inputRef.current?.select();
        }
      }, 50);
    }
  }, [isOpen, oldName]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === oldName || isRenaming) return;

    setIsRenaming(true);
    try {
      onRename(newName.trim());
      onClose();
    } catch (error) {
      console.error('Failed to rename:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

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
            <Edit size={20} style={styles.headerIcon} />
            <h2 style={styles.title}>重命名</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={styles.content}>
              <p style={styles.label}>新名称</p>
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={styles.input}
                disabled={isRenaming}
              />
            </div>
            <div style={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                style={styles.buttonSecondary}
                disabled={isRenaming}
              >
                取消
              </button>
              <button
                type="submit"
                style={styles.buttonPrimary}
                disabled={!newName.trim() || newName.trim() === oldName || isRenaming}
              >
                {isRenaming ? '重命名中...' : '重命名'}
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
    width: 380,
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
