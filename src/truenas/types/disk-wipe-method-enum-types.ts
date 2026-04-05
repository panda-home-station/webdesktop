/**
 * Disk wipe method enum
 * Ported from webui/src/app/enums/disk-wipe-method.enum.ts
 */
export enum DiskWipeMethod {
  Quick = 'QUICK',
  Full = 'FULL',
  FullRandom = 'FULL_RANDOM',
}

/**
 * Get disk wipe method display name
 */
export function getDiskWipeMethodLabel(method: DiskWipeMethod): string {
  switch (method) {
    case DiskWipeMethod.Quick:
      return 'Quick';
    case DiskWipeMethod.Full:
      return 'Full';
    case DiskWipeMethod.FullRandom:
      return 'Full with random data';
    default:
      return method;
  }
}

/**
 * Get disk wipe method description
 */
export function getDiskWipeMethodDescription(method: DiskWipeMethod): string {
  switch (method) {
    case DiskWipeMethod.Quick:
      return 'Quick wipe (only writes signatures)';
    case DiskWipeMethod.Full:
      return 'Full wipe (writes zeros to entire disk)';
    case DiskWipeMethod.FullRandom:
      return 'Full wipe with random data (more secure, slower)';
    default:
      return '';
  }
}
