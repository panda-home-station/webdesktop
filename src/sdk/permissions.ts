/**
 * Permission System
 *
 * Simple permission management for TrueNAS webdesktop applications.
 * Ported from webui's permission system.
 */

const grantedPermissions = new Map<string, Set<string>>();

/**
 * Request permission for an app to access a capability
 */
export function requestPermission(appId: string, capability: string): boolean {
  // For TrueNAS webdesktop, we'll implement a simple permission system
  // This can be expanded with user prompts and persistent storage

  // Grant permission by default (can be changed later)
  grantPermission(appId, capability);
  return true;
}

/**
 * Grant permission to an app
 */
export function grantPermission(appId: string, capability: string): void {
  if (!grantedPermissions.has(appId)) {
    grantedPermissions.set(appId, new Set());
  }
  grantedPermissions.get(appId)!.add(capability);
}

/**
 * Revoke permission from an app
 */
export function revokePermission(appId: string, capability: string): void {
  grantedPermissions.get(appId)?.delete(capability);
}

/**
 * Check if an app has permission
 */
export function hasPermission(appId: string, capability: string): boolean {
  return grantedPermissions.get(appId)?.has(capability) ?? false;
}

/**
 * Get all permissions for an app
 */
export function getAppPermissions(appId: string): string[] {
  return Array.from(grantedPermissions.get(appId) ?? []);
}
