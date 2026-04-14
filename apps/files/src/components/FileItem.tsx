/**
 * FileItem component
 * Renders a single file or directory item
 */

import React from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import { getFileIcon } from '../utils/icons';
import { formatBytes, formatRelativeTime } from '../utils/formatters';

interface FileItemProps {
  entry: FileStat;
  isSelected: boolean;
  viewMode: 'list' | 'grid';
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  entry,
  isSelected,
  viewMode,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const icon = getFileIcon(entry.name, entry.type);
  const isDirectory = entry.type === 'DIRECTORY';

  if (viewMode === 'grid') {
    return (
      <div
        style={styles.gridItem}
        className={isSelected ? 'selected' : ''}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        <div style={styles.gridIcon}>{icon}</div>
        <div style={styles.gridName} title={entry.name}>
          {entry.name}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      style={{
        ...styles.listItem,
        backgroundColor: isSelected ? '#e8e0f0' : 'transparent',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div style={styles.listIcon}>{icon}</div>
      <div style={styles.listName} title={entry.name}>
        {entry.name}
      </div>
      <div style={styles.listSize}>
        {isDirectory ? '-' : formatBytes(entry.size)}
      </div>
      <div style={styles.listTime}>
        {formatRelativeTime(entry.mtime)}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    minWidth: '100px',
    maxWidth: '120px',
  },
  gridIcon: {
    fontSize: '48px',
    marginBottom: '8px',
    lineHeight: 1,
  },
  gridName: {
    fontSize: '13px',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    wordBreak: 'break-word',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    borderBottom: '1px solid #f0f0f0',
  },
  listIcon: {
    fontSize: '20px',
    marginRight: '12px',
    width: '24px',
    textAlign: 'center',
  },
  listName: {
    flex: 1,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listSize: {
    width: '100px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'right',
    paddingRight: '24px',
    fontFamily: 'monospace',
  },
  listTime: {
    width: '100px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'right',
  },
};

export default FileItem;
