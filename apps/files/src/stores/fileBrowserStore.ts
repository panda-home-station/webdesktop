/**
 * File Browser Store
 * Zustand store for managing file browser state
 */

import { create } from 'zustand';
import { FileStat, SortBy, SortOrder, ViewMode } from '@truenas/types/filesystem-types';

interface FileBrowserState {
  // Current directory path
  currentPath: string;
  // Entries in current directory
  entries: FileStat[];
  // Selected file paths
  selectedPaths: Set<string>;
  // Sort settings
  sortBy: SortBy;
  sortOrder: SortOrder;
  // View mode
  viewMode: ViewMode;
  // Loading state
  isLoading: boolean;
  // Error message
  error: string | null;
  // File stats for current path
  filesystemStats: {
    total_bytes: number;
    free_bytes: number;
    avail_bytes: number;
  } | null;
}

interface FileBrowserActions {
  // Navigation
  setPath: (path: string) => void;
  navigateUp: () => void;
  navigateTo: (path: string) => void;

  // Entries
  setEntries: (entries: FileStat[]) => void;
  addEntry: (entry: FileStat) => void;
  removeEntry: (path: string) => void;
  updateEntry: (path: string, updates: Partial<FileStat>) => void;

  // Selection
  setSelectedPaths: (paths: Set<string>) => void;
  toggleSelection: (path: string, multiSelect?: boolean) => void;
  selectRange: (fromPath: string, toPath: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Sorting
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  toggleSortOrder: () => void;

  // View mode
  setViewMode: (viewMode: ViewMode) => void;
  toggleViewMode: () => void;

  // Loading
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Stats
  setFilesystemStats: (stats: { total_bytes: number; free_bytes: number; avail_bytes: number } | null) => void;

  // Reset
  reset: () => void;
}

const initialState: FileBrowserState = {
  currentPath: '/mnt',
  entries: [],
  selectedPaths: new Set(),
  sortBy: 'name',
  sortOrder: 'asc',
  viewMode: 'list',
  isLoading: false,
  error: null,
  filesystemStats: null,
};

export const useFileBrowserStore = create<FileBrowserState & FileBrowserActions>((set, get) => ({
  ...initialState,

  // Navigation
  setPath: (path) => set({ currentPath: path }),

  navigateUp: () => {
    const { currentPath } = get();
    if (currentPath === '/mnt' || currentPath === '/') return;

    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length <= 1) {
      set({ currentPath: '/mnt' });
      return;
    }
    parts.pop();
    set({ currentPath: '/' + parts.join('/') });
  },

  navigateTo: (path) => set({ currentPath: path, selectedPaths: new Set() }),

  // Entries
  setEntries: (entries) => set({ entries }),

  addEntry: (entry) => set((state) => ({
    entries: [...state.entries, entry]
  })),

  removeEntry: (path) => set((state) => ({
    entries: state.entries.filter((e) => e.path !== path),
    selectedPaths: new Set([...state.selectedPaths].filter((p) => p !== path))
  })),

  updateEntry: (path, updates) => set((state) => ({
    entries: state.entries.map((e) =>
      e.path === path ? { ...e, ...updates } : e
    )
  })),

  // Selection
  setSelectedPaths: (paths) => set({ selectedPaths: paths }),

  toggleSelection: (path, multiSelect = false) => set((state) => {
    const newSelection = new Set(multiSelect ? state.selectedPaths : []);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    return { selectedPaths: newSelection };
  }),

  selectRange: (fromPath, toPath) => set((state) => {
    const sortedEntries = getSortedEntries(state.entries, state.sortBy, state.sortOrder);
    const fromIndex = sortedEntries.findIndex((e) => e.path === fromPath);
    const toIndex = sortedEntries.findIndex((e) => e.path === toPath);

    if (fromIndex === -1 || toIndex === -1) return state;

    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    const newSelection = new Set(state.selectedPaths);
    for (let i = start; i <= end; i++) {
      newSelection.add(sortedEntries[i].path);
    }

    return { selectedPaths: newSelection };
  }),

  selectAll: () => set((state) => ({
    selectedPaths: new Set(state.entries.map((e) => e.path))
  })),

  clearSelection: () => set({ selectedPaths: new Set() }),

  // Sorting
  setSortBy: (sortBy) => set({ sortBy }),

  setSortOrder: (sortOrder) => set({ sortOrder }),

  toggleSortOrder: () => set((state) => ({
    sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc'
  })),

  // View mode
  setViewMode: (viewMode) => set({ viewMode }),

  toggleViewMode: () => set((state) => ({
    viewMode: state.viewMode === 'list' ? 'grid' : 'list'
  })),

  // Loading
  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Stats
  setFilesystemStats: (stats) => set({ filesystemStats: stats }),

  // Reset
  reset: () => set(initialState),
}));

// Helper function for sorting
function getSortedEntries(
  entries: FileStat[],
  sortBy: SortBy,
  sortOrder: SortOrder
): FileStat[] {
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
}

// Selector hooks
export const useCurrentPath = () => useFileBrowserStore((state) => state.currentPath);
export const useEntries = () => useFileBrowserStore((state) => state.entries);
export const useSelectedPaths = () => useFileBrowserStore((state) => state.selectedPaths);
export const useViewMode = () => useFileBrowserStore((state) => state.viewMode);
export const useSortBy = () => useFileBrowserStore((state) => state.sortBy);
export const useSortOrder = () => useFileBrowserStore((state) => state.sortOrder);
export const useIsLoading = () => useFileBrowserStore((state) => state.isLoading);
export const useError = () => useFileBrowserStore((state) => state.error);
