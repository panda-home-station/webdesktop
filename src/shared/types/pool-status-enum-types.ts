/**
 * Pool status enum
 * Ported from webui/src/app/enums/pool-status.enum.ts
 */
export enum PoolStatus {
  Healthy = 'HEALTHY',
  Degraded = 'DEGRADED',
  Unavailable = 'UNAVAILABLE',
}

/**
 * Get pool status label
 */
export function getPoolStatusLabel(status: PoolStatus): string {
  switch (status) {
    case PoolStatus.Healthy:
      return 'Healthy';
    case PoolStatus.Degraded:
      return 'Degraded';
    case PoolStatus.Unavailable:
      return 'Unavailable';
    default:
      return status;
  }
}

/**
 * Get pool status color
 */
export function getPoolStatusColor(status: PoolStatus): string {
  switch (status) {
    case PoolStatus.Healthy:
      return '#4caf50'; // green
    case PoolStatus.Degraded:
      return '#ff9800'; // orange
    case PoolStatus.Unavailable:
      return '#f44336'; // red
    default:
      return '#9e9e9e'; // gray
  }
}
