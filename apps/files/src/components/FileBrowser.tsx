/**
 * FileBrowser component
 * Main file browser component - Neo-Frost refined design
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { FileStat, SortBy, ViewMode } from '@truenas/types/filesystem-types';
import type { Pool } from '@truenas/types/pool';
import { poolService } from '@truenas/services/pool';
import { filesystemService } from '@truenas/services/filesystem';
import { useFileBrowserStore } from '../stores/fileBrowserStore';
import { useClipboardStore } from '../stores/clipboardStore';
import { useUIStore } from '../stores/uiStore';
import { useFileSystem } from '../hooks/useFileSystem';
import { useClipboard } from '../hooks/useClipboard';
import { useUserHome } from '../hooks/useUserHome';
import { Toolbar } from './Toolbar';
import { FileList } from './FileList';
import { FileGrid } from './FileGrid';
import { ContextMenu } from './ContextMenu';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';
import {
  CreateItemDialog,
  DeleteConfirmDialog,
  RenameDialog,
  CopyMoveDialog,
} from './dialogs';
import { Loader2 } from 'lucide-react';

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

  const { contextMenu, closeContextMenu } = useUIStore();
  const { hasClipboard } = useClipboardStore();

  const {
    navigateTo,
    navigateUp,
    createDirectory,
    uploadFile,
    deleteFiles,
    renameFile,
    refresh,
  } = useFileSystem();

  const { copyFiles, cutFiles, pasteFiles } = useClipboard();
  const { userHome } = useUserHome();

  const [pools, setPools] = useState<Pool[]>([]);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const _fileInputRef = useRef<HTMLInputElement>(null);
  const _folderInputRef = useRef<HTMLInputElement>(null);

  // UI State from stores
  const ui = useUIStore();
  const _clipboard = useClipboardStore();

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    closeContextMenu();
  }, [closeContextMenu]);

  // Context menu handlers
  const handleBlankContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    useUIStore.getState().openContextMenu(e.clientX, e.clientY, 'blank');
  }, []);

  const handleItemContextMenu = useCallback((e: React.MouseEvent, entry: FileStat) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedPaths.has(entry.path)) {
      toggleSelection(entry.path, false);
    }
    useUIStore.getState().openContextMenu(e.clientX, e.clientY, 'item', entry);
  }, [selectedPaths, toggleSelection]);

  // Upload files handler
  const uploadFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => uploadFile(file));
    closeContextMenu();
  }, [uploadFile, closeContextMenu]);

  // Open directory
  const openEntry = useCallback((entry: FileStat) => {
    if (entry.type === 'DIRECTORY') {
      navigateTo(entry.path);
    }
    closeContextMenu();
  }, [navigateTo, closeContextMenu]);

  // Fetch pools for sidebar
  useEffect(() => {
    const fetchPools = async () => {
      try {
        const result = await poolService.query([], { extra: { is_upgraded: true } });
        setPools(result);
      } catch (err) {
        console.error('Failed to fetch pools:', err);
      }
    };
    fetchPools();
  }, []);

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
  const sortedEntries = useMemo(() => {
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
  const _handleCreateFolder = useCallback(async (name: string) => {
    await createDirectory(name);
  }, [createDirectory]);

  // Generate unique name like Windows (append number if exists)
  const getUniqueName = useCallback((baseName: string, isDirectory: boolean) => {
    const nameWithoutExt = isDirectory ? baseName : baseName.replace(/\.[^.]+$/, '');
    const extMatch = baseName.match(/\.[^.]+$/);
    const originalExt = isDirectory ? '' : (extMatch ? extMatch[0] : '');

    // Check if name exists
    const nameExists = (name: string) =>
      entries.some((e) => e.name === name || e.name === name + originalExt);

    // If base name doesn't exist, use it
    if (!nameExists(nameWithoutExt + originalExt)) {
      return nameWithoutExt + originalExt;
    }

    // Try appending (2), (3), etc.
    let counter = 2;
    while (nameExists(`${nameWithoutExt} (${counter})${originalExt}`)) {
      counter++;
    }
    return `${nameWithoutExt} (${counter})${originalExt}`;
  }, [entries]);

  // Direct create folder (like Windows)
  const directCreateFolder = useCallback(async () => {
    const name = getUniqueName('新建文件夹', true);
    await createDirectory(name);
    closeContextMenu();
  }, [getUniqueName, createDirectory, closeContextMenu]);

  // Direct create file (like Windows)
  const directCreateFile = useCallback(async () => {
    const name = getUniqueName('新建文本文档', false);
    const filePath = filesystemService.joinPath(currentPath, name);
    const emptyBlob = new Blob([''], { type: 'application/octet-stream' });
    await filesystemService.upload(filePath, emptyBlob);
    refreshRef.current();
    closeContextMenu();
  }, [getUniqueName, currentPath, closeContextMenu]);

  // Handle download
  const handleDownload = useCallback((entry: FileStat) => {
    filesystemService.download(entry.path).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    closeContextMenu();
  }, [closeContextMenu]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, [setViewMode]);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortBy) => {
    if (newSortBy === sortBy) {
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

  // Dialog handlers
  const handleCreateItemDialogClose = useCallback(() => {
    useUIStore.getState().closeCreateItemDialog();
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    useUIStore.getState().closeDeleteDialog();
  }, []);

  const handleRenameDialogClose = useCallback(() => {
    useUIStore.getState().closeRenameDialog();
  }, []);

  const handleCopyMoveDialogClose = useCallback(() => {
    useUIStore.getState().closeCopyMoveDialog();
  }, []);

  // Context menu actions
  const handleContextMenuCopy = useCallback(() => {
    const sources = contextMenu?.entry ? [contextMenu.entry.path] : Array.from(selectedPaths);
    copyFiles(sources);
    closeContextMenu();
  }, [contextMenu, selectedPaths, copyFiles, closeContextMenu]);

  const handleContextMenuCut = useCallback(() => {
    const sources = contextMenu?.entry ? [contextMenu.entry.path] : Array.from(selectedPaths);
    cutFiles(sources);
    closeContextMenu();
  }, [contextMenu, selectedPaths, cutFiles, closeContextMenu]);

  const handleContextMenuPaste = useCallback(() => {
    pasteFiles(currentPath);
    closeContextMenu();
  }, [currentPath, pasteFiles, closeContextMenu]);

  const handleContextMenuRename = useCallback(() => {
    if (contextMenu?.entry) {
      useUIStore.getState().openRenameDialog(contextMenu.entry);
    }
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const handleContextMenuDelete = useCallback(() => {
    useUIStore.getState().openDeleteDialog();
    closeContextMenu();
  }, [closeContextMenu]);

  // Dialog confirm handlers
  const handleDeleteConfirm = useCallback(async () => {
    const paths = Array.from(selectedPaths);
    if (paths.length > 0) {
      await deleteFiles(paths);
    }
    useUIStore.getState().closeDeleteDialog();
  }, [selectedPaths, deleteFiles]);

  const handleRenameConfirm = useCallback(async (newName: string) => {
    if (contextMenu?.entry) {
      await renameFile(contextMenu.entry.path, newName);
    }
    useUIStore.getState().closeRenameDialog();
  }, [contextMenu, renameFile]);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar
        pools={pools}
        onNavigate={handleNavigate}
        userHome={userHome}
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
        />

        {/* Content */}
        <div
          style={styles.content}
          onContextMenu={handleBlankContextMenu}
        >
          {isLoading && (
            <div style={styles.loading}>
              <div style={styles.spinnerContainer}>
                <Loader2 size={32} style={styles.spinnerIcon} />
                <span style={styles.loadingText}>加载中...</span>
              </div>
            </div>
          )}

          {error && (
            <div style={styles.error} className="files-animate-in">
              <div style={styles.errorIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p style={styles.errorTitle}>加载失败</p>
              <p style={styles.errorText}>{error}</p>
              <button
                style={styles.retryButton}
                onClick={() => refreshRef.current()}
                className="files-interactive"
              >
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
                onContextMenu={handleItemContextMenu}
                onBlankContextMenu={handleBlankContextMenu}
              />
            ) : (
              <FileGrid
                entries={sortedEntries}
                selectedPaths={selectedPaths}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onContextMenu={handleItemContextMenu}
                onBlankContextMenu={handleBlankContextMenu}
              />
            )
          )}
        </div>

        {/* Status Bar */}
        <StatusBar
          totalCount={entries.length}
          selectedCount={selectedPaths.size}
        />
      </div>

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={handleCloseContextMenu}
        onCreateFolder={directCreateFolder}
        onCreateFile={directCreateFile}
        onUpload={uploadFiles}
        onRefresh={() => refreshRef.current()}
        onOpen={() => contextMenu?.entry && openEntry(contextMenu.entry)}
        onDownload={() => contextMenu?.entry && handleDownload(contextMenu.entry)}
        onCopy={handleContextMenuCopy}
        onCut={handleContextMenuCut}
        onPaste={handleContextMenuPaste}
        onRename={handleContextMenuRename}
        onDelete={handleContextMenuDelete}
        hasClipboard={hasClipboard()}
        currentPath={currentPath}
      />

      {/* Create Item Dialog */}
      <CreateItemDialog
        isOpen={ui.showCreateItemDialog}
        type={ui.createItemType}
        onClose={handleCreateItemDialogClose}
        onCreate={async (name) => {
          if (ui.createItemType === 'directory') {
            await createDirectory(name);
          } else {
            const filePath = filesystemService.joinPath(currentPath, name);
            const emptyBlob = new Blob([''], { type: 'application/octet-stream' });
            await filesystemService.upload(filePath, emptyBlob);
            refreshRef.current();
          }
          handleCreateItemDialogClose();
        }}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={ui.showDeleteDialog}
        paths={Array.from(selectedPaths)}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
      />

      {/* Rename Dialog */}
      <RenameDialog
        isOpen={ui.showRenameDialog}
        oldPath={contextMenu?.entry?.path || ''}
        oldName={contextMenu?.entry?.name || ''}
        onClose={handleRenameDialogClose}
        onRename={handleRenameConfirm}
      />

      {/* Copy/Move Dialog */}
      <CopyMoveDialog
        isOpen={ui.showCopyMoveDialog}
        operation={ui.copyMoveOperation}
        sources={Array.from(selectedPaths)}
        onClose={handleCopyMoveDialogClose}
        onConfirm={(_destination) => {
          handleCopyMoveDialogClose();
        }}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'var(--files-surface-3)',
    boxShadow: 'none',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: 'var(--files-surface-3)',
    boxShadow: 'none',
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'var(--files-surface-3)',
    boxShadow: 'none',
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
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 10,
  },
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
  },
  spinnerIcon: {
    color: 'var(--files-primary)',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    color: 'var(--files-text-muted)',
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
    gap: 'var(--files-space-3)',
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 10,
    padding: 'var(--files-space-8)',
  },
  errorIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    marginBottom: 'var(--files-space-2)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 'var(--files-radius-xl)',
    color: 'var(--files-danger)',
  },
  errorTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--files-text-primary)',
  },
  errorText: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--files-text-muted)',
    textAlign: 'center',
    maxWidth: '300px',
  },
  retryButton: {
    marginTop: 'var(--files-space-2)',
    padding: 'var(--files-space-2) var(--files-space-5)',
    backgroundColor: 'var(--files-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--files-radius-md)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all var(--files-transition-base)',
    fontFamily: 'inherit',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes files-fade-in-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default FileBrowser;
