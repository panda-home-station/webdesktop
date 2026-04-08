/**
 * Storage Utility Functions
 * Common utilities for storage-related operations
 */

// Format bytes to human-readable string
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format size to human-readable string
export function formatSize(size: number): string {
  return formatBytes(size);
}

// Calculate percentage
export function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

// Get usage color based on percentage
export function getUsageColor(percentage: number): string {
  if (percentage < 70) return '#4caf50'; // Green
  if (percentage < 90) return '#ff9800'; // Orange
  return '#f44336'; // Red
}

// Get pool status label
export function getPoolStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'HEALTHY': 'Healthy',
    'DEGRADED': 'Degraded',
    'FAULTED': 'Faulted',
    'OFFLINE': 'Offline',
    'ONLINE': 'Online',
  };
  return statusLabels[status] || status;
}

// Get pool health color
export function getPoolHealthColor(status: string): string {
  const statusColors: Record<string, string> = {
    'HEALTHY': '#4caf50',
    'DEGRADED': '#ff9800',
    'FAULTED': '#f44336',
    'OFFLINE': '#9e9e9e',
    'ONLINE': '#4caf50',
  };
  return statusColors[status] || '#9e9e9e';
}

// Get total pool capacity
export function getTotalPoolCapacity(pools: { size?: { allocated?: number } }[]): number {
  return pools.reduce((total, pool) => total + (pool.size?.allocated || 0), 0);
}

// Get total pool used
export function getTotalPoolUsed(pools: { size?: { used?: number } }[]): number {
  return pools.reduce((total, pool) => total + (pool.size?.used || 0), 0);
}

// Get pool used percentage
export function getPoolUsedPercentage(pool: { allocated?: number; free?: number }): number {
  // When is_upgraded is true, pool.allocated and pool.free are available
  const allocated = pool.allocated || 0;
  const free = pool.free || 0;
  const used = allocated - free;
  return calculatePercentage(used, allocated);
}

// Get disk type label
export function getDiskTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    'HDD': 'HDD',
    'SSD': 'SSD',
    'NVME': 'NVMe',
  };
  return typeLabels[type] || type;
}

// Get disk bus label
export function getDiskBusLabel(bus: string): string {
  const busLabels: Record<string, string> = {
    'SATA': 'SATA',
    'SAS': 'SAS',
    'NVME': 'NVMe',
  };
  return busLabels[bus] || bus;
}
