/**
 * File formatters
 * Utility functions for formatting file sizes, dates, and permissions
 */

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '-';

  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format timestamp to time string (for recently modified files)
 */
export function formatRelativeTime(timestamp: number | undefined): string {
  if (!timestamp) return '-';

  const now = Date.now();
  const diff = now - timestamp * 1000;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < week) return `${Math.floor(diff / day)} 天前`;

  return formatDate(timestamp);
}

/**
 * Format Unix permission mode to rwx string
 */
export function formatPermissions(mode: number): string {
  const permissions = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];

  let result = '';

  // Owner
  result += permissions[(mode >> 6) & 0x7];
  // Group
  result += permissions[(mode >> 3) & 0x7];
  // Others
  result += permissions[mode & 0x7];

  return result;
}

/**
 * Format Unix permission mode to octal string
 */
export function formatPermissionsOctal(mode: number): string {
  return ((mode >> 9) & 0x7).toString() +
    ((mode >> 6) & 0x7).toString() +
    ((mode >> 3) & 0x7).toString() +
    (mode & 0x7).toString();
}

/**
 * Format file type to Chinese description
 */
export function formatFileType(type: string): string {
  switch (type) {
    case 'DIRECTORY':
      return '文件夹';
    case 'FILE':
      return '文件';
    case 'SYMLINK':
      return '符号链接';
    case 'OTHER':
      return '其他';
    default:
      return type;
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length === 1) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Check if file is hidden (starts with .)
 */
export function isHiddenFile(name: string): boolean {
  return name.startsWith('.');
}
