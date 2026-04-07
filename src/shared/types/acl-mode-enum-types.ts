/**
 * ACL mode enum
 * Ported from webui/src/app/enums/acl-type.enum.ts
 */
export enum AclMode {
  Disabled = 'DISABLED',
  Restricted = 'RESTRICTED',
  Passthrough = 'PASSTHROUGH',
}

/**
 * Get ACL mode display name
 */
export function getAclModeLabel(mode: AclMode): string {
  switch (mode) {
    case AclMode.Disabled:
      return 'Disabled';
    case AclMode.Restricted:
      return 'Restricted';
    case AclMode.Passthrough:
      return 'Passthrough';
    default:
      return mode;
  }
}
