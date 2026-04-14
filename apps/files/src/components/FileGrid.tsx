/**
 * FileGrid component
 * Displays files in a grid/icon view - Apple Finder style
 */

import React, { useCallback, useRef } from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import { FileItem } from './FileItem';

interface FileGridProps {
  entries: FileStat[];
  selectedPaths: Set<string>;
  onSelect: (path: string, multiSelect: boolean) => void;
  onOpen: (entry: FileStat) => void;
  onContextMenu: (e: React.MouseEvent, entry: FileStat) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  entries,
  selectedPaths,
  onSelect,
  onOpen,
  onContextMenu,
}) => {
  const lastClickedRef = useRef<string | null>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = useCallback((e: React.MouseEvent, entry: FileStat) => {
    // If there's a pending timer, it means this is the second click of a double-click
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      // This is the second click - let double-click handler deal with it
      return;
    }

    // Set a timer - if double-click fires before it, this timer will be cancelled
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      // Execute single click action (selection)
      if (e.shiftKey && lastClickedRef.current) {
        // Range select
        onSelect(entry.path, true);
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle select
        onSelect(entry.path, true);
      } else {
        // Single select
        onSelect(entry.path, false);
      }
      lastClickedRef.current = entry.path;
    }, 200);
  }, [onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent, entry: FileStat) => {
    // Cancel pending timer so single-click action doesn't fire
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
      {entries.map((entry) => (
        <FileItem
          key={entry.path}
          entry={entry}
          isSelected={selectedPaths.has(entry.path)}
          viewMode="grid"
          onClick={(e) => handleClick(e, entry)}
          onDoubleClick={(e) => handleDoubleClick(e, entry)}
          onContextMenu={(e) => onContextMenu(e, entry)}
        />
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    padding: '16px 20px',
    overflow: 'auto',
    gap: '4px',
    backgroundColor: '#fff',
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

export default FileGrid;