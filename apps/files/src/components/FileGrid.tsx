/**
 * FileGrid component
 * Displays files in a grid/icon view - Neo-Frost refined design
 */

import React, { useCallback, useRef } from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import { FileItem } from './FileItem';
import { FolderOpen } from 'lucide-react';

interface FileGridProps {
  entries: FileStat[];
  selectedPaths: Set<string>;
  onSelect: (path: string, multiSelect: boolean) => void;
  onOpen: (entry: FileStat) => void;
  onContextMenu: (e: React.MouseEvent, entry?: FileStat) => void;
  onBlankContextMenu: (e: React.MouseEvent) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  entries,
  selectedPaths,
  onSelect,
  onOpen,
  onContextMenu,
  onBlankContextMenu,
}) => {
  const lastClickedRef = useRef<string | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback((e: React.MouseEvent, entry: FileStat) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      if (e.shiftKey && lastClickedRef.current) {
        onSelect(entry.path, true);
      } else if (e.ctrlKey || e.metaKey) {
        onSelect(entry.path, true);
      } else {
        onSelect(entry.path, false);
      }
      lastClickedRef.current = entry.path;
    }, 200);
  }, [onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent, entry: FileStat) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    e.preventDefault();
    e.stopPropagation();
    onOpen(entry);
  }, [onOpen]);

  if (entries.length === 0) {
    return (
      <div style={styles.empty} className="files-animate-in" onContextMenu={onBlankContextMenu}>
        <div style={styles.emptyIcon}>
          <FolderOpen size={56} strokeWidth={1} />
        </div>
        <p style={styles.emptyTitle}>此文件夹为空</p>
        <p style={styles.emptyHint}>将文件拖放到此处，或使用工具栏上传</p>
      </div>
    );
  }

  return (
    <div
      style={styles.container}
      className="files-content"
      onContextMenu={onBlankContextMenu}
    >
      {entries.map((entry, index) => (
        <div
          key={entry.path}
          style={{
            animationDelay: `${Math.min(index * 20, 400)}ms`,
          }}
          className="files-animate-in"
        >
          <FileItem
            entry={entry}
            isSelected={selectedPaths.has(entry.path)}
            viewMode="grid"
            onClick={(e) => handleClick(e, entry)}
            onDoubleClick={(e) => handleDoubleClick(e, entry)}
            onContextMenu={(e) => onContextMenu(e, entry)}
          />
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: 'var(--files-space-2)',
    padding: 'var(--files-space-4) var(--files-space-5)',
    overflow: 'auto',
    backgroundColor: 'var(--files-surface-3)',
    alignContent: 'flex-start',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--files-space-8)',
    boxShadow: 'none',
    backgroundColor: 'var(--files-surface-3)',
  },
  emptyIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '96px',
    height: '96px',
    marginBottom: 'var(--files-space-5)',
    backgroundColor: 'var(--files-primary-subtle)',
    borderRadius: 'var(--files-radius-xl)',
    color: 'var(--files-primary)',
  },
  emptyTitle: {
    margin: '0 0 var(--files-space-2) 0',
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--files-text-secondary)',
  },
  emptyHint: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--files-text-muted)',
  },
};

export default FileGrid;