/**
 * CreateItemDialog Component
 * Dialog for creating new files or folders
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FolderPlus, FilePlus } from 'lucide-react';

interface CreateItemDialogProps {
  isOpen: boolean;
  type: 'file' | 'directory';
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export const CreateItemDialog: React.FC<CreateItemDialogProps> = ({
  isOpen,
  type,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setIsCreating(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isDirectory = type === 'directory';
  const title = isDirectory ? '新建文件夹' : '新建文件';
  const Icon = isDirectory ? FolderPlus : FilePlus;
  const placeholder = isDirectory ? '文件夹名称' : '文件名称';

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
            <div style={styles.inputContainer}>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                style={styles.input}
                disabled={isCreating}
              />
            </div>
            <div style={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                style={styles.buttonSecondary}
                disabled={isCreating}
              >
                取消
              </button>
              <button
                type="submit"
                style={styles.buttonPrimary}
                disabled={!name.trim() || isCreating}
              >
                {isCreating ? '创建中...' : '创建'}
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
  inputContainer: {
    padding: 'var(--files-space-4)',
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
