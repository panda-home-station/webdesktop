/**
 * FileBrowser component
 * Main file browser component - Neo-Frost refined design
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileStat, SortBy, ViewMode } from '@truenas/types/filesystem-types';
import type { Pool } from '@truenas/types/pool';
import { poolService } from '@truenas/services/pool';
import { filesystemService } from '@truenas/services/filesystem';
import { useFileBrowserStore } from '../stores/fileBrowserStore';
import { useFileSystem } from '../hooks/useFileSystem';
import { Toolbar } from './Toolbar';
import { FileList } from './FileList';
import { FileGrid } from './FileGrid';
import { CreateFolderDialog } from './CreateFolderDialog';
import { CreateFileDialog } from './CreateFileDialog';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';
import { Loader2, FolderPlus, FilePlus, Upload, FolderInput, Download, Trash2, RefreshCw, FolderOpen, Copy, Scissors, Clipboard } from 'lucide-react';

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

  const {
    navigateTo,
    navigateUp,
    createDirectory,
    uploadFile,
    refresh,
  } = useFileSystem();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateFileDialog, setShowCreateFileDialog] = useState(false);
  const [pools, setPools] = useState<Pool[]>([]);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'blank' | 'item';
    entry?: FileStat;
  } | null>(null);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle blank area context menu
  const handleBlankContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'blank' });
  }, []);

  // Handle item context menu
  const handleItemContextMenu = useCallback((e: React.MouseEvent, entry: FileStat) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedPaths.has(entry.path)) {
      toggleSelection(entry.path, false);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'item', entry });
  }, [selectedPaths, toggleSelection]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu, closeContextMenu]);

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
    try {
      await createDirectory(name);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
    closeContextMenu();
  }, [getUniqueName, createDirectory, closeContextMenu]);

  // Direct create file (like Windows)
  const directCreateFile = useCallback(async () => {
    const name = getUniqueName('新建文本文档', false);
    const filePath = filesystemService.joinPath(currentPath, name);
    const emptyBlob = new Blob([''], { type: 'application/octet-stream' });
    try {
      await filesystemService.upload(filePath, emptyBlob);
      refreshRef.current();
    } catch (err) {
      console.error('Failed to create file:', err);
    }
    closeContextMenu();
  }, [getUniqueName, currentPath, closeContextMenu]);

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

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar
        pools={pools}
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
        />

        {/* Content */}
        <div style={styles.content}>
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

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateFolder}
      />

      {/* Create File Dialog */}
      <CreateFileDialog
        isOpen={showCreateFileDialog}
        onClose={() => setShowCreateFileDialog(false)}
        onCreate={async (name) => {
          const filePath = filesystemService.joinPath(currentPath, name);
          const emptyBlob = new Blob([''], { type: 'application/octet-stream' });
          try {
            await filesystemService.upload(filePath, emptyBlob);
            refreshRef.current();
          } catch (err) {
            console.error('Failed to create file:', err);
          }
        }}
      />

      {/* Context Menu */}
      {contextMenu && createPortal(
        <div
          className="semi-portal"
          style={{ zIndex: 10005 }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            tabIndex={-1}
            className="semi-portal-inner"
            style={{
              position: 'fixed',
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 300),
              zIndex: 10006,
            }}
          >
            <div style={styles.contextMenu}>
              {contextMenu.type === 'blank' ? (
                <>
                  <button
                    style={styles.contextMenuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      directCreateFolder();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FolderPlus size={16} />
                    <span>新建文件夹</span>
                  </button>
                  <button
                    style={styles.contextMenuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      directCreateFile();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FilePlus size={16} />
                    <span>新建文件</span>
                  </button>
                  <div style={styles.contextMenuDivider} />
                  <button
                    style={styles.contextMenuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Upload size={16} />
                    <span>上传文件</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      e.stopPropagation();
                      uploadFiles(e.target.files);
                    }}
                  />
                  <button
                    style={styles.contextMenuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      folderInputRef.current?.click();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FolderInput size={16} />
                    <span>上传文件夹</span>
                  </button>
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    // @ts-expect-error webkitdirectory is not in TS types
                    webkitdirectory=""
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      e.stopPropagation();
                      uploadFiles(e.target.files);
                    }}
                  />
                  <div style={styles.contextMenuDivider} />
                  <button
                    style={styles.contextMenuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshRef.current();
                      closeContextMenu();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <RefreshCw size={16} />
                    <span>刷新</span>
                  </button>
                </>
              ) : (
                <>
                  {contextMenu.entry?.type === 'DIRECTORY' && (
                    <button
                      style={styles.contextMenuItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (contextMenu.entry) openEntry(contextMenu.entry);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <FolderOpen size={16} />
                      <span>打开</span>
                    </button>
                  )}
                  {contextMenu.entry?.type !== 'DIRECTORY' && (
                    <button
                      style={styles.contextMenuItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (contextMenu.entry) {
                          filesystemService.download(contextMenu.entry.path).then((blob) => {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = contextMenu.entry!.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          });
                        }
                        closeContextMenu();
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Download size={16} />
                      <span>下载</span>
                    </button>
                  )}
                  <div style={styles.contextMenuDivider} />
                  <button
                    style={styles.contextMenuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshRef.current();
                      closeContextMenu();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <RefreshCw size={16} />
                    <span>刷新</span>
                  </button>
                  <div style={styles.contextMenuDivider} />
                  <button
                    style={{
                      ...styles.contextMenuItem,
                      color: 'var(--files-text-disabled)',
                      cursor: 'not-allowed',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    title="此功能暂不可用"
                  >
                    <Copy size={16} />
                    <span>复制</span>
                  </button>
                  <button
                    style={{
                      ...styles.contextMenuItem,
                      color: 'var(--files-text-disabled)',
                      cursor: 'not-allowed',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    title="此功能暂不可用"
                  >
                    <Scissors size={16} />
                    <span>剪切</span>
                  </button>
                  <button
                    style={{
                      ...styles.contextMenuItem,
                      color: 'var(--files-text-disabled)',
                      cursor: 'not-allowed',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--files-primary-light)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    title="此功能暂不可用"
                  >
                    <Clipboard size={16} />
                    <span>粘贴</span>
                  </button>
                  <div style={styles.contextMenuDivider} />
                  <button
                    style={{
                      ...styles.contextMenuItem,
                      color: 'var(--files-danger)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeContextMenu();
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={16} />
                    <span>删除</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div
            style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 10004 }}
            onMouseDown={closeContextMenu}
          />
        </div>,
        document.body
      )}
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
  contextMenu: {
    minWidth: 180,
    padding: 6,
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--files-divider)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  contextMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-2) var(--files-space-3)',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--files-text-primary)',
    textAlign: 'left',
    width: '100%',
    transition: 'background var(--files-transition-fast)',
    fontFamily: 'inherit',
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: 'var(--files-divider)',
    margin: '4px 8px',
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