/**
 * Clipboard Store
 * Manages copy/cut operations for files
 */

import { create } from 'zustand';
import { ClipboardState } from '../types/file-manager';

interface ClipboardActions {
  copy: (paths: string[]) => void;
  cut: (paths: string[]) => void;
  clear: () => void;
  hasClipboard: () => boolean;
}

const initialState: ClipboardState = {
  operation: null,
  sources: [],
  isActive: false,
};

export const useClipboardStore = create<ClipboardState & ClipboardActions>((set, get) => ({
  ...initialState,

  copy: (paths: string[]) => set({
    operation: 'copy',
    sources: paths,
    isActive: paths.length > 0,
  }),

  cut: (paths: string[]) => set({
    operation: 'cut',
    sources: paths,
    isActive: paths.length > 0,
  }),

  clear: () => set(initialState),

  hasClipboard: () => get().isActive,
}));

// Selector
export const useClipboard = () => useClipboardStore();
