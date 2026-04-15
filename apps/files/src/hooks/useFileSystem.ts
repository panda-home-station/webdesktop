/**
 * useFileSystem hook
 * Hook for performing file system operations
 */

import { useCallback } from 'react';
import { FileStat } from '@truenas/types/filesystem-types';
import { useFileBrowserStore } from '../stores/fileBrowserStore';
import { fileOperations } from '../services/fileOperations';

export function useFileSystem() {
  const {
    currentPath,
    setEntries,
    setLoading,
    setError,
    addEntry,
  } = useFileBrowserStore();

  /**
   * Load directory contents
   */
  const loadDirectory = useCallback(async (path: string = currentPath) => {
    setLoading(true);
    setError(null);

    try {
      const entries = await fileOperations.listDirectory(path);
      setEntries(entries);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载目录失败';
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [currentPath, setEntries, setLoading, setError]);

  /**
   * Navigate to a directory
   */
  const navigateTo = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const entries = await fileOperations.listDirectory(path);
      setEntries(entries);

      // Update path in store - use store's navigateTo which handles history and clears selection
      useFileBrowserStore.getState().navigateTo(path);
    } catch (error) {
      const message = error instanceof Error ? error.message : '导航失败';
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [setEntries, setLoading, setError]);

  /**
   * Navigate to parent directory
   */
  const navigateUp = useCallback(async () => {
    const parentPath = fileOperations.getParentPath(currentPath);
    await navigateTo(parentPath);
  }, [currentPath, navigateTo]);

  /**
   * Create a new directory
   */
  const createDirectory = useCallback(async (name: string): Promise<FileStat | null> => {
    try {
      const newPath = fileOperations.joinPath(currentPath, name);
      const entry = await fileOperations.createDirectory(newPath);
      addEntry(entry);
      return entry;
    } catch (error) {
      let message = '创建文件夹失败';
      if (error instanceof Error) {
        message = error.message;
        if ('reason' in error && error.reason) {
          message = error.reason;
        }
      }
      console.error('[FileSystem] mkdir error message:', message);
      setError(message);
      return null;
    }
  }, [currentPath, addEntry, setError]);

  /**
   * Upload a file
   */
  const uploadFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      const filePath = fileOperations.joinPath(currentPath, file.name);
      await fileOperations.uploadFile(filePath, file);

      // Refresh directory to show new file
      await loadDirectory();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传文件失败';
      setError(message);
      return false;
    }
  }, [currentPath, loadDirectory, setError]);

  /**
   * Download a file
   */
  const downloadFile = useCallback(async (path: string, filename: string) => {
    try {
      const blob = await fileOperations.downloadFile(path);

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : '下载文件失败';
      setError(message);
    }
  }, [setError]);

  /**
   * Delete files/directories
   * TODO: Await middleware API implementation
   */
  const deleteFiles = useCallback(async (paths: string[]): Promise<boolean> => {
    try {
      await fileOperations.delete(paths, true);
      await loadDirectory();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败';
      console.error('[FileSystem] Delete error:', message);
      setError(message);
      return false;
    }
  }, [loadDirectory, setError]);

  /**
   * Rename a file or directory
   * TODO: Await middleware API implementation
   */
  const renameFile = useCallback(async (oldPath: string, newName: string): Promise<boolean> => {
    try {
      await fileOperations.rename(oldPath, newName);
      await loadDirectory();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '重命名失败';
      console.error('[FileSystem] Rename error:', message);
      setError(message);
      return false;
    }
  }, [loadDirectory, setError]);

  /**
   * Copy files/directories
   * TODO: Await middleware API implementation
   */
  const copyFiles = useCallback(async (sources: string[], destination: string): Promise<boolean> => {
    try {
      for (const source of sources) {
        const fileName = source.split('/').pop() || '';
        const destPath = `${destination}${destination.endsWith('/') ? '' : '/'}${fileName}`;
        await fileOperations.copy(source, destPath, true);
      }
      await loadDirectory();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '复制失败';
      console.error('[FileSystem] Copy error:', message);
      setError(message);
      return false;
    }
  }, [loadDirectory, setError]);

  /**
   * Move files/directories
   * TODO: Await middleware API implementation
   */
  const moveFiles = useCallback(async (sources: string[], destination: string): Promise<boolean> => {
    try {
      for (const source of sources) {
        const fileName = source.split('/').pop() || '';
        const destPath = `${destination}${destination.endsWith('/') ? '' : '/'}${fileName}`;
        await fileOperations.move(source, destPath);
      }
      await loadDirectory();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : '移动失败';
      console.error('[FileSystem] Move error:', message);
      setError(message);
      return false;
    }
  }, [loadDirectory, setError]);

  /**
   * Refresh current directory
   */
  const refresh = useCallback(async () => {
    await loadDirectory();
  }, [loadDirectory]);

  /**
   * Get user home directory
   */
  const getUserHome = useCallback(async (): Promise<string | null> => {
    try {
      await fileOperations.stat('/etc/passwd');
      // This won't work, we need a proper API call
      // For now, return null
      return null;
    } catch {
      return null;
    }
  }, []);

  return {
    loadDirectory,
    navigateTo,
    navigateUp,
    createDirectory,
    uploadFile,
    downloadFile,
    deleteFiles,
    renameFile,
    copyFiles,
    moveFiles,
    refresh,
    getUserHome,
  };
}
