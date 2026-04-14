/**
 * FileGrid component
 * Displays files in a grid/icon view
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

  const handleClick = useCallback((e: React.MouseEvent, entry: FileStat) => {
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
  }, [onSelect]);

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
      {entries.map((entry) => (
        <FileItem
          key={entry.path}
          entry={entry}
          isSelected={selectedPaths.has(entry.path)}
          viewMode="grid"
          onClick={(e) => handleClick(e, entry)}
          onDoubleClick={() => handleDoubleClick(entry)}
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
    padding: '16px',
    overflow: 'auto',
    gap: '4px',
    backgroundColor: '#fff',
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

export default FileGrid;
