/**
 * File type icons
 * Maps file extensions and types to icons
 */

// File type categories with their extensions
const extensionMap: Record<string, string> = {
  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  bmp: 'image',
  svg: 'image',
  webp: 'image',
  ico: 'image',

  // Documents
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  ppt: 'presentation',
  pptx: 'presentation',
  txt: 'text',
  md: 'text',
  rtf: 'text',

  // Code
  js: 'code',
  ts: 'code',
  jsx: 'code',
  tsx: 'code',
  py: 'code',
  java: 'code',
  cpp: 'code',
  c: 'code',
  h: 'code',
  css: 'code',
  html: 'code',
  json: 'code',
  xml: 'code',
  yaml: 'code',
  yml: 'code',

  // Archives
  zip: 'archive',
  tar: 'archive',
  gz: 'archive',
  rar: 'archive',
  '7z': 'archive',

  // Media
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  ogg: 'audio',
  mp4: 'video',
  avi: 'video',
  mkv: 'video',
  mov: 'video',
  wmv: 'video',

  // Executables
  exe: 'executable',
  dll: 'executable',
  so: 'executable',
  dylib: 'executable',
};

// Icon components as emoji/unicode
const iconMap: Record<string, string> = {
  // Folders
  folder: '📁',
  folder_shared: '📂',
  folder_system: '📦',

  // Special types
  directory: '📁',
  file: '📄',
  symlink: '🔗',
  other: '📎',

  // Specific types
  image: '🖼️',
  document: '📝',
  text: '📃',
  spreadsheet: '📊',
  presentation: '📽️',
  code: '💻',
  archive: '🗜️',
  audio: '🎵',
  video: '🎬',
  executable: '⚙️',

  // System
  app: '🖥️',
  config: '🔧',
  database: '🗄️',
};

/**
 * Get icon for a file based on its name/type
 */
export function getFileIcon(name: string, type: string): string {
  // Directory
  if (type === 'DIRECTORY') {
    return iconMap.folder;
  }

  // Not a regular file
  if (type !== 'FILE') {
    return iconMap[type.toLowerCase()] || iconMap.other;
  }

  // Get extension
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const category = extensionMap[ext];

  if (category && iconMap[category]) {
    return iconMap[category];
  }

  // Default file icon
  return iconMap.file;
}

/**
 * Get file type category
 */
export function getFileTypeCategory(name: string, type: string): string {
  if (type === 'DIRECTORY') return 'folder';
  if (type !== 'FILE') return 'other';

  const ext = name.split('.').pop()?.toLowerCase() || '';
  return extensionMap[ext] || 'file';
}
