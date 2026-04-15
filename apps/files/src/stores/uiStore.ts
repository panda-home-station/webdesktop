/**
 * UI Store
 * Manages UI state for dialogs and context menus
 */

import { create } from 'zustand';
import { UIState, FileStat } from '../types/file-manager';

interface UIActions {
  // Create item dialog
  openCreateItemDialog: (type: 'file' | 'directory') => void;
  closeCreateItemDialog: () => void;

  // Delete dialog
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;

  // Rename dialog
  openRenameDialog: (entry: FileStat) => void;
  closeRenameDialog: () => void;

  // Copy/Move dialog
  openCopyMoveDialog: (operation: 'copy' | 'move') => void;
  closeCopyMoveDialog: () => void;

  // Context menu
  openContextMenu: (x: number, y: number, type: 'blank' | 'item', entry?: FileStat) => void;
  closeContextMenu: () => void;
}

const initialState: UIState = {
  showCreateItemDialog: false,
  createItemType: 'directory',
  showDeleteDialog: false,
  showRenameDialog: false,
  showCopyMoveDialog: false,
  copyMoveOperation: 'copy',
  contextMenu: null,
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,

  // Create item dialog
  openCreateItemDialog: (type) => set({
    showCreateItemDialog: true,
    createItemType: type,
  }),

  closeCreateItemDialog: () => set({
    showCreateItemDialog: false,
  }),

  // Delete dialog
  openDeleteDialog: () => set({ showDeleteDialog: true }),
  closeDeleteDialog: () => set({ showDeleteDialog: false }),

  // Rename dialog
  openRenameDialog: (_entry) => set({ showRenameDialog: true }),
  closeRenameDialog: () => set({ showRenameDialog: false }),

  // Copy/Move dialog
  openCopyMoveDialog: (operation) => set({
    showCopyMoveDialog: true,
    copyMoveOperation: operation,
  }),
  closeCopyMoveDialog: () => set({ showCopyMoveDialog: false }),

  // Context menu
  openContextMenu: (x, y, type, entry) => set({
    contextMenu: { x, y, type, entry },
  }),
  closeContextMenu: () => set({ contextMenu: null }),
}));

// Selectors
export const useUI = () => useUIStore();
export const useContextMenu = () => useUIStore((state) => state.contextMenu);
