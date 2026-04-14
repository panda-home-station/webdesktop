/**
 * Toolbar component
 * File browser toolbar - Neo-Frost design with glass morphism
 */

import React, { useState } from 'react';
import { ViewMode, SortBy } from '@truenas/types/filesystem-types';
import {
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Search,
  RefreshCw,
  List,
  Grid3X3,
  X,
} from 'lucide-react';
import { PathBar } from './PathBar';

interface ToolbarProps {
  viewMode: ViewMode;
  sortBy: SortBy;
  currentPath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onNavigateUp: () => void;
  onNavigateBack: () => void;
  onNavigateForward: () => void;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onSearch?: (query: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  sortBy,
  currentPath,
  canGoBack,
  canGoForward,
  onViewModeChange,
  onSortByChange,
  onNavigateUp,
  onNavigateBack,
  onNavigateForward,
  onNavigate,
  onRefresh,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  return (
    <div className="files-glass" style={styles.container}>
      {/* Left Section - Navigation */}
      <div style={styles.leftSection}>
        {/* Navigation Buttons - Glass pill container */}
        <div style={styles.navGroup}>
          <ToolbarButton
            icon={<ArrowLeft size={16} />}
            onClick={onNavigateBack}
            disabled={!canGoBack}
            title="后退"
          />
          <ToolbarButton
            icon={<ArrowRight size={16} />}
            onClick={onNavigateForward}
            disabled={!canGoForward}
            title="前进"
          />
          <ToolbarButton
            icon={<ArrowUp size={16} />}
            onClick={onNavigateUp}
            title="上级目录"
          />
          <div style={styles.navDivider} />
          <ToolbarButton
            icon={<RefreshCw size={16} />}
            onClick={onRefresh}
            title="刷新"
          />
        </div>

        {/* Current Path - Windows Style */}
        <PathBar path={currentPath} onNavigate={onNavigate} />
      </div>

      {/* Center Section - Search */}
      <div style={styles.centerSection}>
        <div style={{
          ...styles.searchContainer,
          ...(isSearchFocused ? styles.searchContainerFocused : {}),
        }}>
          <Search size={15} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              style={styles.searchClear}
              onClick={handleSearchClear}
              className="files-interactive"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div style={styles.rightSection}>
        {/* Sort Dropdown */}
        <div style={styles.sortContainer}>
          <select
            style={styles.sortSelect}
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortBy)}
          >
            <option value="name">名称</option>
            <option value="size">大小</option>
            <option value="mtime">修改日期</option>
          </select>
        </div>

        {/* View Toggle - Glass pill */}
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.viewButton,
              ...(viewMode === 'list' ? styles.viewButtonActive : {}),
            }}
            onClick={() => onViewModeChange('list')}
            title="列表视图"
            className="files-interactive"
          >
            <List size={16} />
          </button>
          <button
            style={{
              ...styles.viewButton,
              ...(viewMode === 'grid' ? styles.viewButtonActive : {}),
            }}
            onClick={() => onViewModeChange('grid')}
            title="图标视图"
            className="files-interactive"
          >
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  onClick,
  title,
  disabled,
}) => {
  return (
    <button
      style={{
        ...styles.button,
        ...(disabled ? styles.buttonDisabled : {}),
      }}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="files-interactive"
    >
      {icon}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: 'var(--files-toolbar-height)',
    gap: 'var(--files-space-6)',
    borderRadius: 0,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '1px solid var(--files-divider)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    flex: 1,
    minWidth: 0,
  },
  centerSection: {
    display: 'flex',
    justifyContent: 'center',
    flexShrink: 0,
    width: '180px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    flexShrink: 0,
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-1)',
    padding: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 'var(--files-radius-lg)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },
  navDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    margin: '0 4px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: 'var(--files-radius-md)',
    cursor: 'pointer',
    color: 'var(--files-text-secondary)',
    transition: 'all var(--files-transition-base)',
  },
  buttonDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '8px 14px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 'var(--files-radius-lg)',
    border: '1px solid transparent',
    transition: 'all var(--files-transition-smooth)',
  },
  searchContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'var(--files-primary)',
    boxShadow: '0 0 0 3px var(--files-primary-light), var(--files-shadow-md)',
  },
  searchIcon: {
    color: 'var(--files-text-muted)',
    marginRight: 'var(--files-space-2)',
    flexShrink: 0,
    transition: 'color var(--files-transition-base)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: 'var(--files-text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
  },
  searchClear: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: '50%',
    cursor: 'pointer',
    color: 'var(--files-text-secondary)',
    padding: 0,
    marginLeft: 'var(--files-space-2)',
    transition: 'all var(--files-transition-fast)',
  },
  sortContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  sortSelect: {
    padding: '6px 28px 6px 12px',
    borderRadius: 'var(--files-radius-md)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontSize: '12px',
    color: 'var(--files-text-secondary)',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    fontFamily: 'inherit',
    transition: 'all var(--files-transition-base)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  },
  sortIcon: {
    position: 'absolute',
    right: '10px',
    color: 'var(--files-text-muted)',
    pointerEvents: 'none',
  },
  viewToggle: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 'var(--files-radius-lg)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    gap: 'var(--files-space-1)',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: 'var(--files-radius-md)',
    cursor: 'pointer',
    color: 'var(--files-text-muted)',
    transition: 'all var(--files-transition-base)',
  },
  viewButtonActive: {
    backgroundColor: '#fff',
    color: 'var(--files-primary)',
    boxShadow: 'var(--files-shadow-sm)',
  },
};

export default Toolbar;