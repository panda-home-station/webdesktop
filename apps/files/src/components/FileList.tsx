/**
 * FileList component
 * Displays files in a list/table view - Apple Finder style
 */

import React, { useCallback, useRef } from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import { FileItem } from './FileItem';

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

  const handleClick = useCallback((e: React.MouseEvent, entry: FileStat) => {
    if (e.shiftKey && lastClickedRef.current) {
      // Range select
      const fromIndex = entries.findIndex((e) => e.path === lastClickedRef.current);
      const toIndex = entries.findIndex((e) => e.path === entry.path);
      if (fromIndex !== -1 && toIndex !== -1) {
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        const newSelection = new Set<string>();
        for (let i = start; i <= end; i++) {
          newSelection.add(entries[i].path);
        }
        onSelect(entry.path, true);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle select
      onSelect(entry.path, true);
    } else {
      // Single select
      onSelect(entry.path, false);
    }
    lastClickedRef.current = entry.path;
  }, [entries, onSelect]);

  const handleDoubleClick = useCallback((entry: FileStat) => {
    onOpen(entry);
  }, [onOpen]);

  if (entries.length === 0) {
    return (
      <div style={styles.empty}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          style={{ color: '#c7c7cc', marginBottom: '12px' }}
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <p style={styles.emptyText}>此文件夹为空</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerName}>名称</div>
        <div style={styles.headerSize}>大小</div>
        <div style={styles.headerTime}>修改时间</div>
      </div>
      {/* List */}
      <div style={styles.list}>
        {entries.map((entry) => (
          <FileItem
            key={entry.path}
            entry={entry}
            isSelected={selectedPaths.has(entry.path)}
            viewMode="list"
            onClick={(e) => handleClick(e, entry)}
            onDoubleClick={() => handleDoubleClick(entry)}
            onContextMenu={(e) => onContextMenu(e, entry)}
          />
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
    backgroundColor: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: '#f5f5f7',
    fontWeight: 500,
    fontSize: '12px',
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  headerName: {
    flex: 1,
  },
  headerSize: {
    width: '80px',
    textAlign: 'right',
    paddingRight: '24px',
  },
  headerTime: {
    width: '100px',
    textAlign: 'right',
  },
  list: {
    flex: 1,
    overflow: 'auto',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#c7c7cc',
    fontSize: '14px',
  },
  emptyText: {
    margin: 0,
    color: '#86868b',
  },
};

export default FileList;