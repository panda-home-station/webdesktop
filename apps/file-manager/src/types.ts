export interface FileEntry {
  name: string
  is_dir: boolean
  size: number
  modified_ts: number
  path?: string
  level?: number
  expanded?: boolean
  realName?: string
}

export interface DragItem {
  name: string
  is_dir: boolean
  path?: string
}

export interface TrashMetadata {
  originalPath: string
  deletionTime: number
  name: string
  is_dir: boolean
  size: number
}

export interface ClipboardItem {
  items: string[]
  action: 'copy' | 'move'
  sourcePath: string
}

export interface DragSelection {
  startX: number
  startY: number
  curX: number
  curY: number
}

export type SortKey = 'name' | 'size' | 'modified_ts'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'list' | 'grid'

export interface ColumnWidths {
  [key: string]: number
}
