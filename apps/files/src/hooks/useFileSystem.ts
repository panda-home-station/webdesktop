/**
 * useFileSystem hook
 * Hook for performing file system operations
 */

import { useCallback } from 'react';
import { filesystemService } from '@truenas/services/filesystem';
import { FileStat } from '@truenas/types/filesystem-types';
import { useFileBrowserStore } from '../stores/fileBrowserStore';

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
      const entries = await filesystemService.listdir(path);
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
      const entries = await filesystemService.listdir(path);
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
    const parentPath = filesystemService.getParentPath(currentPath);
    await navigateTo(parentPath);
  }, [currentPath, navigateTo]);

  /**
   * Create a new directory
   */
  const createDirectory = useCallback(async (name: string): Promise<FileStat | null> => {
    try {
      const newPath = filesystemService.joinPath(currentPath, name);
      const job = await filesystemService.mkdir(newPath);
      // mkdir returns a Job<FileStat>, extract the result
      const entry = job.result;
      addEntry(entry);
      return entry;
    } catch (error) {
      let message = '创建文件夹失败';
      if (error instanceof Error) {
        message = error.message;
        // TrueNASError has a 'reason' field with the actual error details
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
      const filePath = filesystemService.joinPath(currentPath, file.name);
      await filesystemService.upload(filePath, file);

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
      const blob = await filesystemService.download(path);

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
   * Refresh current directory
   */
  const refresh = useCallback(async () => {
    await loadDirectory();
  }, [loadDirectory]);

  return {
    loadDirectory,
    navigateTo,
    navigateUp,
    createDirectory,
    uploadFile,
    downloadFile,
    refresh,
  };
}
