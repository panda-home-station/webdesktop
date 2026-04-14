/**
 * Toolbar component
 * File browser toolbar with actions - Apple SF Symbols style
 */

import React, { useRef } from 'react';
import { ViewMode, SortBy } from '@truenas/types/filesystem-types';
import {
  ArrowUp,
  Upload,
  Trash2,
  List,
  Grid3X3,
  ArrowUpDown,
  FolderPlus,
} from 'lucide-react';

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
        <ToolbarButton
          icon={<ArrowUp size={18} />}
          onClick={onNavigateUp}
          title="返回上级目录 (Backspace)"
        />
        <ToolbarButton
          icon={<ArrowUpDown size={18} />}
          onClick={onRefresh}
          title="刷新 (F5)"
        />
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Create */}
      <div style={styles.group}>
        <ToolbarButton
          icon={<FolderPlus size={18} />}
          onClick={onNewFolder}
          title="新建文件夹"
        />
        <ToolbarButton
          icon={<Upload size={18} />}
          onClick={handleUploadClick}
          title="上传文件"
        />
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
        <ToolbarButton
          icon={<Trash2 size={18} />}
          onClick={hasSelection ? onDelete : undefined}
          title="删除"
          disabled={!hasSelection}
        />
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
        <ToolbarButton
          icon={<List size={18} />}
          onClick={() => onViewModeChange('list')}
          title="列表视图"
          isActive={viewMode === 'list'}
        />
        <ToolbarButton
          icon={<Grid3X3 size={18} />}
          onClick={() => onViewModeChange('grid')}
          title="图标视图"
          isActive={viewMode === 'grid'}
        />
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  isActive?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  onClick,
  title,
  disabled,
  isActive,
}) => {
  return (
    <button
      style={{
        ...styles.button,
        ...(isActive ? styles.buttonActive : {}),
        ...(disabled ? styles.buttonDisabled : {}),
      }}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {icon}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f5f5f7',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    gap: '4px',
    height: '44px',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#1d1d1f',
    transition: 'all 0.15s ease',
  },
  buttonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    color: '#007aff',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    margin: '0 8px',
  },
  select: {
    padding: '6px 12px',
    paddingRight: '28px',
    borderRadius: '6px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    fontSize: '13px',
    color: '#1d1d1f',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  },
};

export default Toolbar;