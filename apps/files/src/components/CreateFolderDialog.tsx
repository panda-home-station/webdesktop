/**
 * CreateFolderDialog component
 * Modal dialog for creating a new folder - Neo-Frost design
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setName('');
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.dialog} className="files-animate-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <FolderPlus size={20} />
          </div>
          <h3 style={styles.title}>新建文件夹</h3>
          <button
            style={styles.closeButton}
            onClick={handleCancel}
            className="files-interactive"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div style={styles.body}>
            <label style={styles.label}>文件夹名称</label>
            <input
              ref={inputRef}
              type="text"
              style={styles.input}
              placeholder="输入文件夹名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={handleCancel}
              className="files-interactive"
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                ...styles.createButton,
                ...(name.trim() ? {} : styles.createButtonDisabled),
              }}
              disabled={!name.trim()}
              className={name.trim() ? 'files-interactive' : ''}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 'var(--files-radius-xl)',
    border: '1px solid var(--files-glass-border)',
    boxShadow: 'var(--files-shadow-xl)',
    width: '420px',
    maxWidth: '90%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-5)',
    borderBottom: '1px solid var(--files-divider)',
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: 'var(--files-primary-subtle)',
    borderRadius: 'var(--files-radius-md)',
    color: 'var(--files-primary)',
  },
  title: {
    flex: 1,
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--files-text-primary)',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--files-radius-md)',
    cursor: 'pointer',
    color: 'var(--files-text-muted)',
    transition: 'all var(--files-transition-base)',
  },
  body: {
    padding: 'var(--files-space-5)',
  },
  label: {
    display: 'block',
    marginBottom: 'var(--files-space-2)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--files-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    width: '100%',
    padding: 'var(--files-space-3) var(--files-space-4)',
    borderRadius: 'var(--files-radius-md)',
    border: '1px solid var(--files-divider)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
    color: 'var(--files-text-primary)',
    outline: 'none',
    transition: 'all var(--files-transition-base)',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-4) var(--files-space-5)',
    borderTop: '1px solid var(--files-divider)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  cancelButton: {
    padding: 'var(--files-space-2) var(--files-space-5)',
    borderRadius: 'var(--files-radius-md)',
    border: '1px solid var(--files-divider)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--files-text-secondary)',
    transition: 'all var(--files-transition-base)',
    fontFamily: 'inherit',
  },
  createButton: {
    padding: 'var(--files-space-2) var(--files-space-5)',
    borderRadius: 'var(--files-radius-md)',
    border: 'none',
    backgroundColor: 'var(--files-primary)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all var(--files-transition-base)',
    fontFamily: 'inherit',
  },
  createButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default CreateFolderDialog;