/**
 * Filesystem Service
 * Handles all filesystem-related API calls to TrueNAS middleware
 *
 * Note: Only methods available in middleware/src/middlewared/middlewared/plugins/filesystem.py
 * are implemented here. The following operations are NOT available via filesystem.* API:
 * - delete/remove
 * - rename
 * - copy
 * - move
 * These may need to be performed via shell commands or alternative APIs.
 */

import { truenasApi } from '../api';
import {
  FileStat,
  FilesystemStats,
} from '@truenas/types/filesystem-types';

export class FilesystemService {
  /**
   * List directory contents
   */
  async listdir(path: string): Promise<FileStat[]> {
    return truenasApi.call('filesystem.listdir', path, [], {}) as Promise<FileStat[]>;
  }

  /**
   * Get file/directory statistics
   */
  async stat(path: string): Promise<FileStat> {
    return truenasApi.call('filesystem.stat', path) as Promise<FileStat>;
  }

  /**
   * Create a directory
   */
  async mkdir(path: string, mode: string = '755'): Promise<FileStat> {
    return truenasApi.call('filesystem.mkdir', {
      path,
      options: { mode, raise_chmod_error: false }
    }) as Promise<FileStat>;
  }

  /**
   * Get filesystem statistics (disk space)
   */
  async statfs(path: string): Promise<FilesystemStats> {
    return truenasApi.call('filesystem.statfs', path) as Promise<FilesystemStats>;
  }

  /**
   * Set ZFS file attributes
   */
  async setZfsAttributes(path: string, attributes: Record<string, boolean>): Promise<void> {
    return truenasApi.call('filesystem.set_zfs_attributes', {
      path,
      zfs_file_attributes: attributes
    }) as Promise<void>;
  }

  /**
   * Get ZFS file attributes
   */
  async getZfsAttributes(path: string): Promise<Record<string, boolean>> {
    return truenasApi.call('filesystem.get_zfs_attributes', path) as Promise<Record<string, boolean>>;
  }

  /**
   * Change file ownership
   */
  async chown(
    path: string,
    options: { uid?: number; gid?: number; user?: string; group?: string; recursive?: boolean }
  ): Promise<void> {
    const payload: Record<string, unknown> = { path };
    if (options.uid !== undefined) payload.uid = options.uid;
    if (options.gid !== undefined) payload.gid = options.gid;
    if (options.user) payload.user = options.user;
    if (options.group) payload.group = options.group;

    return truenasApi.call('filesystem.chown', {
      ...payload,
      options: { recursive: options.recursive || false }
    }) as Promise<void>;
  }

  /**
   * Set file permissions
   */
  async setperm(
    path: string,
    options: { mode?: string; uid?: number; gid?: number; user?: string; group?: string; recursive?: boolean }
  ): Promise<void> {
    const payload: Record<string, unknown> = { path };
    if (options.mode) payload.mode = options.mode;
    if (options.uid !== undefined) payload.uid = options.uid;
    if (options.gid !== undefined) payload.gid = options.gid;
    if (options.user) payload.user = options.user;
    if (options.group) payload.group = options.group;

    return truenasApi.call('filesystem.setperm', {
      ...payload,
      options: { recursive: options.recursive || false }
    }) as Promise<void>;
  }

  /**
   * Download a file from the server
   * Returns the file content as a Blob
   */
  async download(path: string): Promise<Blob> {
    const job = await truenasApi.job<Blob>('filesystem.get', path);
    // The job result is the file content as a Blob
    // We need to convert the ArrayBuffer to a Blob
    const result = await job.result;
    if (result instanceof ArrayBuffer) {
      return new Blob([result]);
    }
    return result as Blob;
  }

  /**
   * Upload a file to the server
   * Uses file_receive which accepts base64 encoded content
   */
  async upload(path: string, content: Blob): Promise<void> {
    // Convert Blob to base64 for the API
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(content);
    const base64Content = await base64Promise;

    await truenasApi.call('filesystem.file_receive', path, base64Content, {});
  }

  /**
   * Check if a path exists and is a directory
   */
  async isDirectory(path: string): Promise<boolean> {
    try {
      const stat = await this.stat(path);
      return stat.type === 'DIRECTORY';
    } catch {
      return false;
    }
  }

  /**
   * Get parent directory path
   */
  getParentPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) {
      return '/';
    }
    parts.pop();
    return '/' + parts.join('/');
  }

  /**
   * Join path segments
   */
  joinPath(...segments: string[]): string {
    return segments
      .filter(Boolean)
      .join('/')
      .replace(/\/+/g, '/');
  }
}

// Singleton instance
export const filesystemService = new FilesystemService();
