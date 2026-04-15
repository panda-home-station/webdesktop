/**
 * ContextMenu Component
 * Reusable right-click context menu
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderPlus,
  FilePlus,
  Upload,
  FolderInput,
  Download,
  Trash2,
  RefreshCw,
  FolderOpen,
  Copy,
  Scissors,
  Clipboard,
  Edit,
} from 'lucide-react';
import { ContextMenuState } from '../types/file-manager';

interface ContextMenuProps {
  contextMenu: ContextMenuState | null;
  onClose: () => void;
  onCreateFolder: () => void;
  onCreateFile: () => void;
  onUpload: (files: FileList | null) => void;
  onRefresh: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onRename: () => void;
  onDelete: () => void;
  hasClipboard: boolean;
  currentPath: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  onClose,
  onCreateFolder,
  onCreateFile,
  onUpload,
  onRefresh,
  onOpen,
  onDownload,
  onCopy,
  onCut,
  onPaste,
  onRename,
  onDelete,
  hasClipboard,
  currentPath: _currentPath,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClick = () => onClose();
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (contextMenu) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [contextMenu, onClose]);

  const handleItemClick = useCallback((e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    onClose();
  }, [onClose]);

  if (!contextMenu) return null;

  const isBlankMenu = contextMenu.type === 'blank';
  const entry = contextMenu.entry;

  return createPortal(
    <div
      className="semi-portal"
      style={{ zIndex: 10005 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        tabIndex={-1}
        className="semi-portal-inner"
        style={{
          position: 'fixed',
          left: Math.min(contextMenu.x, window.innerWidth - 200),
          top: Math.min(contextMenu.y, window.innerHeight - 400),
          zIndex: 10006,
        }}
      >
        <div style={styles.contextMenu}>
          {isBlankMenu ? (
            // Blank area context menu
            <>
              <MenuButton
                icon={<FolderPlus size={16} />}
                label="新建文件夹"
                onClick={(e) => handleItemClick(e, onCreateFolder)}
              />
              <MenuButton
                icon={<FilePlus size={16} />}
                label="新建文件"
                onClick={(e) => handleItemClick(e, onCreateFile)}
              />
              <Divider />
              <MenuButton
                icon={<Upload size={16} />}
                label="上传文件"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpload(e.target.files);
                }}
              />
              <MenuButton
                icon={<FolderInput size={16} />}
                label="上传文件夹"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-expect-error webkitdirectory is not in TS types
                webkitdirectory=""
                style={{ display: 'none' }}
                onChange={(e) => {
                  e.stopPropagation();
                  onUpload(e.target.files);
                }}
              />
              <Divider />
              <MenuButton
                icon={<RefreshCw size={16} />}
                label="刷新"
                onClick={(e) => handleItemClick(e, onRefresh)}
              />
            </>
          ) : (
            // Item context menu
            <>
              {entry?.type === 'DIRECTORY' && (
                <MenuButton
                  icon={<FolderOpen size={16} />}
                  label="打开"
                  onClick={(e) => handleItemClick(e, onOpen)}
                />
              )}
              {entry?.type !== 'DIRECTORY' && (
                <MenuButton
                  icon={<Download size={16} />}
                  label="下载"
                  onClick={(e) => handleItemClick(e, onDownload)}
                />
              )}
              <Divider />
              <MenuButton
                icon={<Copy size={16} />}
                label="复制"
                onClick={(e) => handleItemClick(e, onCopy)}
              />
              <MenuButton
                icon={<Scissors size={16} />}
                label="剪切"
                onClick={(e) => handleItemClick(e, onCut)}
              />
              <MenuButton
                icon={<Clipboard size={16} />}
                label="粘贴"
                onClick={(e) => handleItemClick(e, onPaste)}
                disabled={!hasClipboard}
              />
              <Divider />
              <MenuButton
                icon={<Edit size={16} />}
                label="重命名"
                onClick={(e) => handleItemClick(e, onRename)}
              />
              <Divider />
              <MenuButton
                icon={<Trash2 size={16} />}
                label="删除"
                onClick={(e) => handleItemClick(e, onDelete)}
                danger
              />
            </>
          )}
        </div>
      </div>
      <div
        style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10004 }}
        onMouseDown={onClose}
      />
    </div>,
    document.body
  );
};

// Menu Button Component
interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
}

const MenuButton: React.FC<MenuButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const style: React.CSSProperties = {
    ...styles.menuButton,
    ...(disabled && styles.menuButtonDisabled),
    ...(danger && isHovered && styles.menuButtonDanger),
    ...(isHovered && !disabled && { background: 'var(--files-primary-light)' }),
  };

  return (
    <button
      style={style}
      onClick={disabled ? (e) => e.stopPropagation() : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// Divider Component
const Divider: React.FC = () => <div style={styles.divider} />;

const styles: Record<string, React.CSSProperties> = {
  contextMenu: {
    minWidth: 180,
    padding: 6,
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--files-divider)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-2) var(--files-space-3)',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--files-text-primary)',
    textAlign: 'left',
    width: '100%',
    transition: 'background var(--files-transition-fast)',
    fontFamily: 'inherit',
  },
  menuButtonDisabled: {
    color: 'var(--files-text-disabled)',
    cursor: 'not-allowed',
  },
  menuButtonDanger: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--files-danger)',
  },
  divider: {
    height: 1,
    backgroundColor: 'var(--files-divider)',
    margin: '4px 8px',
  },
};
