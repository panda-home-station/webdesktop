/**
 * Toolbar component
 * File browser toolbar with actions
 */

import React, { useRef } from 'react';
import { ViewMode, SortBy } from '@truenas/types/filesystem-types';

interface ToolbarProps {
  viewMode: ViewMode;
  sortBy: SortBy;
  onViewModeChange: (mode: ViewMode) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onNavigateUp: () => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
  hasSelection: boolean;
  onDelete: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  sortBy,
  onViewModeChange,
  onSortByChange,
  onNavigateUp,
  onRefresh,
  onNewFolder,
  onUpload: _onUpload,
  hasSelection,
  onDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Emit custom event with files
      const event = new CustomEvent('files:upload', { detail: Array.from(files) });
      window.dispatchEvent(event);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <div style={styles.group}>
        <button
          style={styles.button}
          onClick={onNavigateUp}
          title="返回上级目录"
        >
          ⬆️
        </button>
        <button
          style={styles.button}
          onClick={onRefresh}
          title="刷新"
        >
          🔄
        </button>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Create */}
      <div style={styles.group}>
        <button
          style={styles.button}
          onClick={onNewFolder}
          title="新建文件夹"
        >
          📁➕
        </button>
        <button
          style={styles.button}
          onClick={handleUploadClick}
          title="上传文件"
        >
          📤
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Delete */}
      <div style={styles.group}>
        <button
          style={{ ...styles.button, opacity: hasSelection ? 1 : 0.4 }}
          onClick={hasSelection ? onDelete : undefined}
          title="删除"
          disabled={!hasSelection}
        >
          🗑️
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sort */}
      <div style={styles.group}>
        <select
          style={styles.select}
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortBy)}
        >
          <option value="name">名称</option>
          <option value="size">大小</option>
          <option value="mtime">修改时间</option>
        </select>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* View mode */}
      <div style={styles.group}>
        <button
          style={{ ...styles.button, opacity: viewMode === 'list' ? 1 : 0.5 }}
          onClick={() => onViewModeChange('list')}
          title="列表视图"
        >
          ☰
        </button>
        <button
          style={{ ...styles.button, opacity: viewMode === 'grid' ? 1 : 0.5 }}
          onClick={() => onViewModeChange('grid')}
          title="图标视图"
        >
          ⊞
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    gap: '4px',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'background-color 0.15s',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#ddd',
    margin: '0 8px',
  },
  select: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

export default Toolbar;
