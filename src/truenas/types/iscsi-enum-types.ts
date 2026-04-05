/**
 * iSCSI extent type enum
 * Ported from webui/src/app/enums/iscsi.enum.ts
 */
export enum IscsiExtentType {
  Disk = 'DISK',
  File = 'FILE',
}

/**
 * Get iSCSI extent type display name
 */
export function getIscsiExtentTypeLabel(type: IscsiExtentType): string {
  switch (type) {
    case IscsiExtentType.Disk:
      return 'Disk';
    case IscsiExtentType.File:
      return 'File';
    default:
      return type;
  }
}
