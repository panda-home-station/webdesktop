/**
 * Toolbar component
 * File browser toolbar - Apple Finder style with navigation, search, and actions
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
  ArrowUpWideNarrow,
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
    <div style={styles.container}>
      {/* Left Section - Navigation */}
      <div style={styles.leftSection}>
        {/* Navigation Buttons */}
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
          <Search size={14} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="搜索"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button style={styles.searchClear} onClick={handleSearchClear}>
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
          <ArrowUpWideNarrow size={14} style={styles.sortIcon} />
        </div>

        {/* View Toggle */}
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.viewButton,
              ...(viewMode === 'list' ? styles.viewButtonActive : {}),
            }}
            onClick={() => onViewModeChange('list')}
            title="列表视图"
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
    padding: '0 12px',
    backgroundColor: '#f5f5f7',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    height: '48px',
    gap: '12px',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  centerSection: {
    display: 'flex',
    justifyContent: 'center',
    flexShrink: 0,
    width: '200px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  navGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: '8px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#1d1d1f',
    transition: 'all 0.15s ease',
  },
  buttonDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '6px 10px',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: '8px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    transition: 'all 0.2s ease',
  },
  searchContainerFocused: {
    backgroundColor: '#fff',
    borderColor: '#007aff',
    boxShadow: '0 0 0 3px rgba(0, 122, 255, 0.1)',
  },
  searchIcon: {
    color: '#86868b',
    marginRight: '6px',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: '#1d1d1f',
    outline: 'none',
  },
  searchClear: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#fff',
    padding: 0,
    marginLeft: '4px',
  },
  sortContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  sortSelect: {
    padding: '5px 24px 5px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontSize: '12px',
    color: '#1d1d1f',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 6px center',
  },
  sortIcon: {
    position: 'absolute',
    right: '8px',
    color: '#86868b',
    pointerEvents: 'none',
  },
  viewToggle: {
    display: 'flex',
    alignItems: 'center',
    padding: '3px',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: '8px',
    gap: '2px',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '26px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '5px',
    cursor: 'pointer',
    color: '#86868b',
    transition: 'all 0.15s ease',
  },
  viewButtonActive: {
    backgroundColor: '#fff',
    color: '#007aff',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
};

export default Toolbar;