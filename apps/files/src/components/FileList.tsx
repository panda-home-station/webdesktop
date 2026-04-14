/**
 * FileList component
 * Displays files in a list/table view
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
        // For range select, we'll handle this differently
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
        <p>此文件夹为空</p>
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
    padding: '8px 16px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    fontWeight: 500,
    fontSize: '13px',
    color: '#666',
  },
  headerName: {
    flex: 1,
  },
  headerSize: {
    width: '100px',
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
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    fontSize: '14px',
  },
};