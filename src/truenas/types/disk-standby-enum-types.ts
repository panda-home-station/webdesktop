/**
 * Disk standby enum
 * Ported from webui/src/app/enums/disk-standby.enum.ts
 */
export enum DiskStandby {
  AlwaysOn = 'ALWAYS ON',
  Minutes5 = '5',
  Minutes10 = '10',
  Minutes20 = '20',
  Minutes30 = '30',
  Minutes60 = '60',
  Minutes120 = '120',
  Minutes180 = '180',
  Minutes240 = '240',
  Minutes300 = '300',
  Minutes330 = '330',
}

/**
 * Get disk standby display name
 */
export function getDiskStandbyLabel(standby: DiskStandby): string {
  switch (standby) {
    case DiskStandby.AlwaysOn:
      return 'Always On';
    case DiskStandby.Minutes5:
      return '5 minutes';
    case DiskStandby.Minutes10:
      return '10 minutes';
    case DiskStandby.Minutes20:
      return '20 minutes';
    case DiskStandby.Minutes30:
      return '30 minutes';
    case DiskStandby.Minutes60:
      return '1 hour';
    case DiskStandby.Minutes120:
      return '2 hours';
    case DiskStandby.Minutes180:
      return '3 hours';
    case DiskStandby.Minutes240:
      return '4 hours';
    case DiskStandby.Minutes300:
      return '5 hours';
    case DiskStandby.Minutes330:
      return '5.5 hours';
    default:
      return standby;
  }
}

/**
 * Convert standby to numeric value (minutes)
 */
export function standbyToMinutes(standby: DiskStandby): number {
  if (standby === DiskStandby.AlwaysOn) {
    return 0; // 0 means always on
  }
  return parseInt(standby, 10);
}
