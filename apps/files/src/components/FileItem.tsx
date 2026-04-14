/**
 * FileItem component
 * Renders a single file or directory item - Apple Finder style
 */

import React from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileCode,
  Film,
  Music,
  Archive,
} from 'lucide-react';
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
  const isDirectory = entry.type === 'DIRECTORY';

  const getIcon = () => {
    if (isDirectory) {
      return <Folder size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
    }

    const ext = entry.name.split('.').pop()?.toLowerCase() || '';

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
      return <FileImage size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
    }
    // Code
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
      return <FileCode size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
    }
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
      return <FileText size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
    }
    // Video
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv'].includes(ext)) {
      return <Film size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
    }
    // Audio
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      return <Music size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
    }
    // Archives
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <Archive size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
    }

    return <File size={viewMode === 'grid' ? 64 : 20} strokeWidth={1.5} />;
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
        <div
          style={{
            ...styles.gridIcon,
            color: isDirectory ? '#007aff' : '#5e5ce6',
          }}
        >
          {getIcon()}
        </div>
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
        ...(isSelected ? styles.listItemSelected : {}),
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div
        style={{
          ...styles.listIcon,
          color: isDirectory ? '#007aff' : '#5e5ce6',
        }}
      >
        {getIcon()}
      </div>
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