/**
 * File Operations Service
 * Wraps all file system operations via middleware API
 */

import { filesystemService } from '@truenas/services/filesystem';
import { FileStat } from '@truenas/types/filesystem-types';

export class FileOperationsService {
  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<FileStat[]> {
    return filesystemService.listdir(path);
  }

  /**
   * Get file/directory statistics
   */
  async stat(path: string): Promise<FileStat> {
    return filesystemService.stat(path);
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string, mode: string = '755'): Promise<FileStat> {
    return filesystemService.mkdir(path, mode);
  }

  /**
   * Create an empty file
   */
  async createFile(path: string): Promise<void> {
    const emptyBlob = new Blob([''], { type: 'application/octet-stream' });
    await filesystemService.upload(path, emptyBlob);
  }

  /**
   * Upload a file
   */
  async uploadFile(path: string, file: File): Promise<void> {
    await filesystemService.upload(path, file);
  }

  /**
   * Download a file
   */
  async downloadFile(path: string): Promise<Blob> {
    return filesystemService.download(path);
  }

  /**
   * Get file system statistics (disk space)
   */
  async getStatfs(path: string) {
    return filesystemService.statfs(path);
  }

  /**
   * Delete files/directories
   * TODO: Await middleware API implementation
   */
  async delete(_paths: string[], _recursive: boolean = true): Promise<void> {
    // TODO: Implement when middleware adds filesystem.remove
    // For now, throw error to indicate not implemented
    throw new Error('filesystem.remove API not yet implemented');
  }

  /**
   * Rename a file or directory
   * TODO: Await middleware API implementation
   */
  async rename(_oldPath: string, _newName: string): Promise<void> {
    // TODO: Implement when middleware adds filesystem.rename
    throw new Error('filesystem.rename API not yet implemented');
  }

  /**
   * Copy a file or directory
   * TODO: Await middleware API implementation
   */
  async copy(_source: string, _destination: string, _recursive: boolean = true): Promise<void> {
    // TODO: Implement when middleware adds filesystem.copy
    throw new Error('filesystem.copy API not yet implemented');
  }

  /**
   * Move a file or directory
   * TODO: Await middleware API implementation
   */
  async move(_source: string, _destination: string): Promise<void> {
    // TODO: Implement when middleware adds filesystem.rename for move
    throw new Error('filesystem.move API not yet implemented');
  }

  /**
   * Change file ownership
   */
  async chown(
    path: string,
    options: { uid?: number; gid?: number; user?: string; group?: string; recursive?: boolean }
  ): Promise<void> {
    await filesystemService.chown(path, options);
  }

  /**
   * Set file permissions
   */
  async setperm(
    path: string,
    options: { mode?: string; uid?: number; gid?: number; user?: string; group?: string; recursive?: boolean }
  ): Promise<void> {
    await filesystemService.setperm(path, options);
  }

  /**
   * Get ACL for a path
   */
  async getAcl(_path: string) {
    // TODO: Implement when filesystem.getacl is available
    throw new Error('filesystem.getacl API not yet implemented');
  }

  /**
   * Set ACL for a path
   */
  async setAcl(_path: string, _acl: unknown) {
    // TODO: Implement when filesystem.setacl is available
    throw new Error('filesystem.setacl API not yet implemented');
  }

  /**
   * Check if a path is accessible
   */
  async isAccessible(path: string): Promise<boolean> {
    try {
      await filesystemService.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get parent directory path
   */
  getParentPath(path: string): string {
    return filesystemService.getParentPath(path);
  }

  /**
   * Join path segments
   */
  joinPath(...segments: string[]): string {
    return filesystemService.joinPath(...segments);
  }
}

// Singleton instance
export const fileOperations = new FileOperationsService();
