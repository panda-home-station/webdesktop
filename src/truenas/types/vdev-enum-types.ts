/**
 * VDEV type enumerations
 * Ported from webui/src/app/enums/v-dev-type.enum.ts
 */

/**
 * Types of VDEV items in pool topology
 */
export enum TopologyItemType {
  Disk = 'DISK',
  Stripe = 'STRIPE',
  Mirror = 'MIRROR',
  Spare = 'SPARE',
  Log = 'LOG',
  Missing = 'MISSING',
  Root = 'ROOT',
  File = 'FILE',
  Raidz = 'RAIDZ',
  Raidz1 = 'RAIDZ1',
  Raidz2 = 'RAIDZ2',
  Raidz3 = 'RAIDZ3',
  Draid = 'DRAID',
  L2Cache = 'L2CACHE',
  Replacing = 'REPLACING',
}

/**
 * VDEV layout options for pool creation
 */
export enum CreateVdevLayout {
  Stripe = 'STRIPE',
  Mirror = 'MIRROR',
  Raidz1 = 'RAIDZ1',
  Raidz2 = 'RAIDZ2',
  Raidz3 = 'RAIDZ3',
  Draid1 = 'DRAID1',
  Draid2 = 'DRAID2',
  Draid3 = 'DRAID3',
}

/**
 * VDEV topology section types
 */
export enum VDevType {
  Cache = 'cache',
  Data = 'data',
  Dedup = 'dedup',
  Log = 'log',
  Spare = 'spare',
  Special = 'special',
}

/**
 * VDEV warnings for pool configuration
 */
export enum TopologyWarning {
  MixedVdevLayout = 'Mixed VDEV types',
  MixedVdevCapacity = 'Mixed VDEV Capacities',
  MixedDiskCapacity = 'Mixed Disk Capacities',
  MixedVdevWidth = 'Mixed VDEV Widths',
  NoRedundancy = 'No Redundancy',
  RedundancyMismatch = 'Redundancy Mismatch',
}

/**
 * Labels for VDEV types
 */
export const vdevTypeLabels: Record<VDevType, string> = {
  [VDevType.Data]: 'Data',
  [VDevType.Log]: 'Log',
  [VDevType.Special]: 'Metadata',
  [VDevType.Spare]: 'Spare',
  [VDevType.Dedup]: 'Dedup',
  [VDevType.Cache]: 'Cache',
};

/**
 * VDEV layout options for UI
 */
export interface VdevLayoutOption {
  label: string;
  value: CreateVdevLayout;
  hoverTooltip?: string;
}

/**
 * Get human-readable label for VDEV type
 */
export function getVdevTypeLabel(type: VDevType): string {
  return vdevTypeLabels[type] || type;
}
