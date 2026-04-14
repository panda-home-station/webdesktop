/**
 * FileItem component
 * Renders a single file or directory item - Apple Finder style
 */

import React from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import { Folder } from 'lucide-react';
import { FileIcon, defaultStyles } from 'react-file-icon';
import { formatBytes, formatRelativeTime } from '../utils/formatters';

interface FileItemProps {
  entry: FileStat;
  isSelected: boolean;
  viewMode: 'list' | 'grid';
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
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
  const isDirectory = entry.type === 'DIRECTORY';

  // Get extension from filename
  const ext = entry.name.split('.').pop()?.toLowerCase() || '';

  // Get react-file-icon style for this extension
  const getFileIconStyle = () => {
    const style = (defaultStyles as Record<string, Record<string, unknown>>)[ext];
    if (style) {
      return style;
    }
    // Default style for unknown extensions
    return { type: 'document', labelColor: '#888' };
  };

  const renderIcon = () => {
    if (isDirectory) {
      return (
        <Folder
          size={viewMode === 'grid' ? 48 : 20}
          strokeWidth={1.5}
          color="#007aff"
        />
      );
    }

    if (viewMode === 'grid') {
      return (
        <div style={styles.gridFileIcon}>
          <FileIcon
            extension={ext || 'file'}
            {...getFileIconStyle()}
            radius={8}
          />
        </div>
      );
    }

    // List view
    return (
      <FileIcon
        extension={ext || 'file'}
        {...getFileIconStyle()}
        radius={4}
      />
    );
  };

  if (viewMode === 'grid') {
    return (
      <div
        style={{
          ...styles.gridItem,
          ...(isSelected ? styles.gridItemSelected : {}),
        }}
        className={isSelected ? 'file-item-selected' : ''}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        <div style={styles.gridIcon}>
          {renderIcon()}
        </div>
        <div
          style={{ ...styles.gridName, userSelect: 'none' }}
          title={entry.name}
          onDoubleClickCapture={(e) => e.preventDefault()}
        >
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
        ...(isSelected ? styles.listItemSelected : {}),
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div style={styles.listIcon}>
        {renderIcon()}
      </div>
      <div
        style={{ ...styles.listName, userSelect: 'none' }}
        title={entry.name}
        onDoubleClickCapture={(e) => e.preventDefault()}
      >
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
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minWidth: '100px',
    maxWidth: '120px',
    margin: '4px',
  },
  gridItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  gridIcon: {
    marginBottom: '8px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridFileIcon: {
    width: '48px',
    height: '48px',
  },
  gridName: {
    fontSize: '12px',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    wordBreak: 'break-word',
    color: '#1d1d1f',
    lineHeight: 1.3,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  listItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  listIcon: {
    marginRight: '12px',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listName: {
    flex: 1,
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#1d1d1f',
  },
  listSize: {
    width: '80px',
    fontSize: '12px',
    color: '#86868b',
    textAlign: 'right',
    paddingRight: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
  },
  listTime: {
    width: '100px',
    fontSize: '12px',
    color: '#86868b',
    textAlign: 'right',
  },
};

// Add hover styles via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .file-item-selected {
    background-color: rgba(0, 122, 255, 0.12) !important;
  }

  div[style*="cursor: pointer"]:hover {
    background-color: rgba(0, 0, 0, 0.04) !important;
  }

  div[style*="cursor: pointer"]:active {
    background-color: rgba(0, 0, 0, 0.08) !important;
  }
`;
if (document.head) {
  document.head.appendChild(styleSheet);
}

export default FileItem;