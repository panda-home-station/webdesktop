/**
 * File Manager Types
 * Type definitions for file manager operations
 */

import { FileStat } from '@truenas/types/filesystem-types';
import type { Pool } from '@truenas/types/pool';

// ==================== Clipboard ====================

export type ClipboardOperation = 'copy' | 'cut' | null;

export interface ClipboardState {
  operation: ClipboardOperation;
  sources: string[];
  isActive: boolean;
}

// ==================== UI State ====================

export interface ContextMenuState {
  x: number;
  y: number;
  type: 'blank' | 'item';
  entry?: FileStat;
}

export interface UIState {
  // Dialogs
  showCreateItemDialog: boolean;
  createItemType: 'file' | 'directory';
  showDeleteDialog: boolean;
  showRenameDialog: boolean;
  showCopyMoveDialog: boolean;
  copyMoveOperation: 'copy' | 'move';

  // Context menu
  contextMenu: ContextMenuState | null;
}

// ==================== User Home ====================

export interface UserHomeInfo {
  username: string;
  uid: number;
  gid: number;
  home: string;
  shell: string;
  homeAccessible: boolean;  // Whether home is accessible via filesystem API
  isAdmin: boolean;         // Whether user is administrator
}

// ==================== Pool Access ====================

export interface PoolAccessInfo {
  pool: Pool;
  accessible: boolean;
}

// ==================== File Operations ====================

export interface FileOperationOptions {
  recursive?: boolean;
  overwrite?: boolean;
  preserveAcl?: boolean;
}

export interface CopyMoveOptions extends FileOperationOptions {
  destination: string;
}

export interface RenameOptions {
  newName: string;
}

// ==================== Dialog Props ====================

export interface CreateItemDialogProps {
  isOpen: boolean;
  type: 'file' | 'directory';
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  paths: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export interface RenameDialogProps {
  isOpen: boolean;
  oldPath: string;
  oldName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export interface CopyMoveDialogProps {
  isOpen: boolean;
  operation: 'copy' | 'move';
  sources: string[];
  onClose: () => void;
  onConfirm: (destination: string) => void;
}
