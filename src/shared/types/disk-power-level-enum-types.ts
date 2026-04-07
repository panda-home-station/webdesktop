/**
 * Disk power level enum
 * Ported from webui/src/app/enums/disk-power-level.enum.ts
 */
export enum DiskPowerLevel {
  Disabled = 'DISABLED',
  Level1 = '1',
  Level64 = '64',
  Level127 = '127',
  Level128 = '128',
  Level192 = '192',
  Level254 = '254',
}

/**
 * Get power level display name
 */
export function getDiskPowerLevelLabel(level: DiskPowerLevel): string {
  switch (level) {
    case DiskPowerLevel.Disabled:
      return 'Disabled';
    case DiskPowerLevel.Level1:
      return 'Maximum';
    case DiskPowerLevel.Level64:
      return 'Intermediate';
    case DiskPowerLevel.Level127:
      return 'Minimum';
    case DiskPowerLevel.Level128:
      return 'Minimum (with spindown)';
    case DiskPowerLevel.Level192:
      return 'Reserved';
    case DiskPowerLevel.Level254:
      return 'Reserved';
    default:
      return level;
  }
}

/**
 * Convert power level to numeric value
 */
export function powerLevelToNumber(level: DiskPowerLevel): number {
  return parseInt(level, 10);
}
