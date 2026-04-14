/**
 * Filesystem Types
 * Type definitions for file system operations
 */

export type FileType = 'DIRECTORY' | 'FILE' | 'SYMLINK' | 'OTHER';

export interface FileStat {
  name: string;
  path: string;
  realpath: string;
  type: FileType;
  size: number;
  allocation_size: number;
  mode: number;
  mount_id: number;
  acl: boolean;
  uid: number;
  gid: number;
  is_mountpoint: boolean;
  is_ctldir: boolean;
  attributes: string[];
  xattrs: string[];
  zfs_attrs: string[] | null;
  user?: string | null;
  group?: string | null;
  atime?: number;
  mtime?: number;
  ctime?: number;
  btime?: number;
}

export interface DirectoryContents {
  path: string;
  entries: FileStat[];
  total: number;
}

export interface FilesystemStats {
  flags: string[];
  fstype: string;
  source: string;
  dest: string;
  blocksize: number;
  total_blocks: number;
  free_blocks: number;
  avail_blocks: number;
  files: number;
  free_files: number;
  name_max: number;
  fsid: string;
  total_bytes: number;
  free_bytes: number;
  avail_bytes: number;
  total_bytes_str: string;
  free_bytes_str: string;
  avail_bytes_str: string;
}

export type SortBy = 'name' | 'size' | 'mtime' | 'type';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid';

export interface FileBrowserState {
  currentPath: string;
  entries: FileStat[];
  selectedPaths: Set<string>;
  sortBy: SortBy;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
}

export interface FileBrowserActions {
  setPath: (path: string) => void;
  setEntries: (entries: FileStat[]) => void;
  setSelectedPaths: (paths: Set<string>) => void;
  toggleSelection: (path: string, multiSelect: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  toggleSortOrder: () => void;
  setViewMode: (viewMode: ViewMode) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  navigateUp: () => void;
  navigateTo: (path: string) => void;
}

export type FileBrowserStore = FileBrowserState & FileBrowserActions;
