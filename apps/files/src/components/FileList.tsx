/**
 * FileList component
 * Displays files in a list/table view - Neo-Frost refined design
 */

import React, { useCallback, useRef } from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import { FileItem } from './FileItem';
import { FolderOpen } from 'lucide-react';

interface FileListProps {
  entries: FileStat[];
  selectedPaths: Set<string>;
  onSelect: (path: string, multiSelect: boolean) => void;
  onOpen: (entry: FileStat) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileStat) => void;
}

export const FileList: React.FC<FileListProps> = ({
  entries,
  selectedPaths,
  onSelect,
  onOpen,
  onContextMenu,
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
        const fromIndex = entries.findIndex((e) => e.path === lastClickedRef.current);
        const toIndex = entries.findIndex((e) => e.path === entry.path);
        if (fromIndex !== -1 && toIndex !== -1) {
          const start = Math.min(fromIndex, toIndex);
          const end = Math.max(fromIndex, toIndex);
          for (let i = start; i <= end; i++) {
            onSelect(entries[i].path, true);
          }
        }
      } else if (e.ctrlKey || e.metaKey) {
        onSelect(entry.path, true);
      } else {
        onSelect(entry.path, false);
      }
      lastClickedRef.current = entry.path;
    }, 200);
  }, [entries, onSelect]);

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
      <div style={styles.empty} className="files-animate-in">
        <div style={styles.emptyIcon}>
          <FolderOpen size={56} strokeWidth={1} />
        </div>
        <p style={styles.emptyTitle}>此文件夹为空</p>
        <p style={styles.emptyHint}>将文件拖放到此处，或使用工具栏上传</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="files-content">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerName}>
          <span style={styles.headerText}>名称</span>
        </div>
        <div style={styles.headerSize}>大小</div>
        <div style={styles.headerTime}>修改时间</div>
        <div style={styles.headerType}>类型</div>
      </div>

      {/* List */}
      <div style={styles.list}>
        {entries.map((entry, index) => (
          <div
            key={entry.path}
            style={{
              animationDelay: `${Math.min(index * 30, 300)}ms`,
            }}
            className="files-animate-in"
          >
            <FileItem
              entry={entry}
              isSelected={selectedPaths.has(entry.path)}
              viewMode="list"
              onClick={(e) => handleClick(e, entry)}
              onDoubleClick={(e) => handleDoubleClick(e, entry)}
              onContextMenu={(e) => onContextMenu(e, entry)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--files-surface-3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--files-space-3) var(--files-space-5)',
    borderBottom: '1px solid var(--files-divider)',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--files-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  headerName: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  headerText: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-2)',
  },
  headerSize: {
    width: '100px',
    textAlign: 'right',
    paddingRight: 'var(--files-space-5)',
  },
  headerTime: {
    width: '140px',
    textAlign: 'right',
    paddingRight: 'var(--files-space-4)',
  },
  headerType: {
    width: '80px',
    textAlign: 'left',
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--files-space-2) 0',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--files-space-8)',
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

export default FileList;