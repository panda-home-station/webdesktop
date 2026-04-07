/**
 * SED (Self-Encrypting Drive) status enum
 * Ported from webui/src/app/enums/sed-status.enum.ts
 */
export enum SedStatus {
  Failed = 'FAILED',
  Uninitialized = 'UNINITIALIZED',
  Locked = 'LOCKED',
  Unlocked = 'UNLOCKED',
  Available = 'AVAILABLE',
}

/**
 * Get SED status display name
 */
export function getSedStatusLabel(status: SedStatus): string {
  switch (status) {
    case SedStatus.Failed:
      return 'Failed';
    case SedStatus.Uninitialized:
      return 'Uninitialized';
    case SedStatus.Locked:
      return 'Locked';
    case SedStatus.Unlocked:
      return 'Unlocked';
    case SedStatus.Available:
      return 'Available';
    default:
      return status;
  }
}

/**
 * Get SED status color
 */
export function getSedStatusColor(status: SedStatus): string {
  switch (status) {
    case SedStatus.Available:
    case SedStatus.Unlocked:
      return '#4caf50'; // green
    case SedStatus.Locked:
      return '#ff9800'; // orange
    case SedStatus.Failed:
      return '#f44336'; // red
    case SedStatus.Uninitialized:
      return '#9e9e9e'; // gray
    default:
      return '#9e9e9e';
  }
}

/**
 * Check if SED is locked
 */
export function isSedLocked(status: SedStatus): boolean {
  return status === SedStatus.Locked;
}

/**
 * Check if SED is available for use
 */
export function isSedAvailable(status: SedStatus): boolean {
  return status === SedStatus.Available || status === SedStatus.Unlocked;
}
