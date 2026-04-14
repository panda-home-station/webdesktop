/**
 * FileBrowser component
 * Main file browser component that orchestrates all sub-components
 * Apple Finder-style layout with sidebar
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { FileStat, SortBy, ViewMode } from '@truenas/types/filesystem-types';
import { useFileBrowserStore } from '../stores/fileBrowserStore';
import { useFileSystem } from '../hooks/useFileSystem';
import { Toolbar } from './Toolbar';
import { FileList } from './FileList';
import { FileGrid } from './FileGrid';
import { CreateFolderDialog } from './CreateFolderDialog';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';

export const FileBrowser: React.FC = () => {
  const {
    currentPath,
    entries,
    selectedPaths,
    sortBy,
    sortOrder,
    viewMode,
    isLoading,
    error,
    filesystemStats,
    setSelectedPaths,
    toggleSelection,
    clearSelection,
    setSortBy,
    setViewMode,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
  } = useFileBrowserStore();

  const {
    navigateTo,
    navigateUp,
    createDirectory,
    uploadFile,
    refresh,
  } = useFileSystem();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Load directory on mount and path change
  useEffect(() => {
    refreshRef.current();
  }, [currentPath]);

  // Listen for upload events
  useEffect(() => {
    const handleUpload = (e: CustomEvent) => {
      const files = e.detail as File[];
      files.forEach((file) => uploadFile(file));
    };

    window.addEventListener('files:upload', handleUpload as EventListener);
    return () => {
      window.removeEventListener('files:upload', handleUpload as EventListener);
    };
  }, [uploadFile]);

  // Sort entries
  const sortedEntries = React.useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      // Directories always first
      if (a.type === 'DIRECTORY' && b.type !== 'DIRECTORY') return -1;
      if (a.type !== 'DIRECTORY' && b.type === 'DIRECTORY') return 1;

      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'mtime':
          comparison = (a.mtime || 0) - (b.mtime || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [entries, sortBy, sortOrder]);

  // Handle file selection
  const handleSelect = useCallback((path: string, multiSelect: boolean) => {
    toggleSelection(path, multiSelect);
  }, [toggleSelection]);

  // Handle file open (double click)
  const handleOpen = useCallback((entry: FileStat) => {
    if (entry.type === 'DIRECTORY') {
      navigateTo(entry.path);
    } else {
      // TODO: Open file preview
    }
  }, [navigateTo]);

  // Handle navigation
  const handleNavigate = useCallback((path: string) => {
    navigateTo(path);
    clearSelection();
  }, [navigateTo, clearSelection]);

  // Handle navigate up
  const handleNavigateUp = useCallback(() => {
    navigateUp();
    clearSelection();
  }, [navigateUp, clearSelection]);

  // Handle create folder
  const handleCreateFolder = useCallback(async (name: string) => {
    await createDirectory(name);
  }, [createDirectory]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, [setViewMode]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortBy) => {
    if (newSortBy === sortBy) {
      // Toggle order if same column
      useFileBrowserStore.getState().toggleSortOrder();
    } else {
      setSortBy(newSortBy);
    }
  }, [sortBy, setSortBy]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        handleNavigateUp();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        refreshRef.current();
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedPaths(new Set(entries.map((e) => e.path)));
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigateUp, entries, setSelectedPaths, clearSelection]);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Toolbar */}
        <Toolbar
          viewMode={viewMode}
          sortBy={sortBy}
          currentPath={currentPath}
          canGoBack={canNavigateBack()}
          canGoForward={canNavigateForward()}
          onViewModeChange={handleViewModeChange}
          onSortByChange={handleSortChange}
          onNavigateUp={handleNavigateUp}
          onNavigateBack={navigateBack}
          onNavigateForward={navigateForward}
          onNavigate={handleNavigate}
          onRefresh={() => refreshRef.current()}
          onNewFolder={() => setShowCreateDialog(true)}
          onUpload={() => {}}
          hasSelection={selectedPaths.size > 0}
          onDelete={() => {}}
        />

        {/* Content */}
        <div style={styles.content}>
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.spinner} />
            </div>
          )}

          {error && (
            <div style={styles.error}>
              <span style={styles.errorText}>{error}</span>
              <button style={styles.retryButton} onClick={() => refreshRef.current()}>
                重试
              </button>
            </div>
          )}

          {!isLoading && !error && (
            viewMode === 'list' ? (
              <FileList
                entries={sortedEntries}
                selectedPaths={selectedPaths}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onContextMenu={() => {}}
              />
            ) : (
              <FileGrid
                entries={sortedEntries}
                selectedPaths={selectedPaths}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onContextMenu={() => {}}
              />
            )
          )}
        </div>

        {/* Status Bar */}
        <StatusBar
          totalCount={entries.length}
          selectedCount={selectedPaths.size}
          filesystemStats={filesystemStats}
        />
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateFolder}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100%',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(0, 122, 255, 0.15)',
    borderTopColor: '#007aff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: '14px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#007aff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};

// Add keyframes for spinner animation via style tag
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default FileBrowser;