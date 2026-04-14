/**
 * FileItem component
 * Renders a single file or directory item - Neo-Frost refined design
 */

import React, { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);
  const isDirectory = entry.type === 'DIRECTORY';

  const ext = entry.name.split('.').pop()?.toLowerCase() || '';

  const getFileIconStyle = () => {
    const style = (defaultStyles as Record<string, Record<string, unknown>>)[ext];
    if (style) return style;
    return { type: 'document', labelColor: '#888' };
  };

  const renderIcon = () => {
    if (isDirectory) {
      return (
        <div style={styles.folderIcon}>
          <Folder
            size={viewMode === 'grid' ? 52 : 22}
            strokeWidth={1.5}
            color="var(--files-primary)"
          />
        </div>
      );
    }

    return (
      <div style={viewMode === 'grid' ? styles.gridFileIcon : styles.listFileIcon}>
        <FileIcon
          extension={ext || 'file'}
          {...getFileIconStyle()}
          radius={viewMode === 'grid' ? 10 : 6}
        />
      </div>
    );
  };

  // Get file type label
  const getFileTypeLabel = () => {
    if (isDirectory) return '文件夹';
    const typeMap: Record<string, string> = {
      pdf: 'PDF',
      doc: 'Word', docx: 'Word',
      xls: 'Excel', xlsx: 'Excel',
      ppt: 'PPT', pptx: 'PPT',
      jpg: '图片', jpeg: '图片', png: '图片', gif: '图片', webp: '图片', svg: '图片',
      mp4: '视频', mov: '视频', avi: '视频', mkv: '视频',
      mp3: '音频', wav: '音频', flac: '音频',
      zip: '压缩包', rar: '压缩包', '7z': '压缩包',
      txt: '文本', md: 'Markdown',
      js: 'JavaScript', ts: 'TypeScript', py: 'Python', java: 'Java',
      html: 'HTML', css: 'CSS', json: 'JSON', xml: 'XML',
    };
    return typeMap[ext] || (ext ? ext.toUpperCase() : '文件');
  };

  if (viewMode === 'grid') {
    return (
      <div
        style={{
          ...styles.gridItem,
          ...(isSelected ? styles.gridItemSelected : {}),
          ...(isHovered && !isSelected ? styles.gridItemHover : {}),
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="files-interactive"
      >
        <div style={styles.gridIcon}>
          {renderIcon()}
        </div>
        <div
          style={{
            ...styles.gridName,
            ...(isSelected ? styles.gridNameSelected : {}),
          }}
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
        ...(isHovered && !isSelected ? styles.listItemHover : {}),
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="files-interactive"
    >
      <div style={styles.listIcon}>
        {renderIcon()}
      </div>
      <div
        style={{
          ...styles.listName,
          ...(isSelected ? styles.listNameSelected : {}),
        }}
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
      <div style={styles.listType}>
        {getFileTypeLabel()}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  // ============ GRID VIEW ============
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--files-space-4) var(--files-space-3)',
    borderRadius: 'var(--files-radius-lg)',
    cursor: 'pointer',
    transition: 'all var(--files-transition-smooth)',
    minWidth: '100px',
    position: 'relative',
  },
  gridItemSelected: {
    backgroundColor: 'var(--files-primary-light)',
    boxShadow: 'inset 0 0 0 2px var(--files-primary)',
  },
  gridItemHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  gridIcon: {
    marginBottom: 'var(--files-space-3)',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform var(--files-transition-bounce)',
  },
  folderIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridFileIcon: {
    width: '52px',
    height: '52px',
  },
  listFileIcon: {
    width: '22px',
    height: '22px',
  },
  gridName: {
    fontSize: '12px',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    wordBreak: 'break-word',
    color: 'var(--files-text-primary)',
    lineHeight: 1.4,
    transition: 'color var(--files-transition-base)',
  },
  gridNameSelected: {
    color: 'var(--files-primary)',
    fontWeight: 500,
  },

  // ============ LIST VIEW ============
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 'var(--files-space-1) var(--files-space-5)',
    cursor: 'pointer',
    transition: 'all var(--files-transition-base)',
    borderBottom: '1px solid var(--files-divider)',
    minHeight: '36px',
  },
  listItemSelected: {
    backgroundColor: 'var(--files-primary-light)',
  },
  listItemHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  listIcon: {
    marginRight: 'var(--files-space-3)',
    width: '24px',
    height: '24px',
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
    color: 'var(--files-text-primary)',
    transition: 'color var(--files-transition-base)',
  },
  listNameSelected: {
    color: 'var(--files-primary)',
    fontWeight: 500,
  },
  listSize: {
    width: '100px',
    fontSize: '12px',
    color: 'var(--files-text-muted)',
    textAlign: 'right',
    paddingRight: 'var(--files-space-5)',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    letterSpacing: '-0.3px',
  },
  listTime: {
    width: '140px',
    fontSize: '12px',
    color: 'var(--files-text-muted)',
    textAlign: 'right',
    paddingRight: 'var(--files-space-4)',
  },
  listType: {
    width: '80px',
    fontSize: '11px',
    color: 'var(--files-text-muted)',
    textAlign: 'left',
  },
};

export default FileItem;