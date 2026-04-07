/**
 * Disk type enum
 * Ported from webui/src/app/enums/disk-type.enum.ts
 */
export enum DiskType {
  Hdd = 'HDD',
  Ssd = 'SSD',
  Nvme = 'NVMe',
  Usb = 'USB',
  Hda = 'HDA',
}

/**
 * Get disk type display name
 */
export function getDiskTypeLabel(type: DiskType): string {
  switch (type) {
    case DiskType.Hdd:
      return 'HDD';
    case DiskType.Ssd:
      return 'SSD';
    case DiskType.Nvme:
      return 'NVMe';
    case DiskType.Usb:
      return 'USB';
    case DiskType.Hda:
      return 'HDA';
    default:
      return type;
  }
}

/**
 * Check if disk is solid state
 */
export function isSolidStateDisk(type: DiskType): boolean {
  return type === DiskType.Ssd || type === DiskType.Nvme;
}

/**
 * Check if disk is rotational
 */
export function isRotationalDisk(type: DiskType): boolean {
  return type === DiskType.Hdd;
}
