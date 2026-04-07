/**
 * Storage types
 * Ported from webui/src/app/interfaces/storage.interface.ts
 */

import { TopologyItemType } from './vdev-enum-types';
import { TopologyItemStatus } from './vdev-status-enum';
import { ZfsProperty } from './zfs-property-types';

/**
 * Statistics for topology items (VDEVs and disks)
 */
export interface TopologyItemStats {
  timestamp: number;
  read_errors: number;
  write_errors: number;
  checksum_errors: number;
  ops: number[];
  bytes: number[];
  size: number;
  allocated: number;
  fragmentation: number;
  self_healed: number;
  configured_ashift: number;
  logical_ashift: number;
  physical_ashift: number;
  draid_data_disks?: number;
  draid_spare_disks?: number;
  draid_parity?: number;
}

/**
 * Enclosure and slot information for a disk
 */
export interface EnclosureAndSlot {
  drive_bay_number: number;
  id: string; // Enclosure id.
}

/**
 * Temperature aggregation data
 */
export interface TemperatureAgg {
  min: number;
  max: number;
  avg: number;
}

/**
 * As returned by pool.query under topology[<vdevtype>]
 */
export type VDevItem = (VDev | TopologyDisk) & { isRoot?: boolean };

/**
 * VDEV (Virtual Device) in pool topology
 * Represents a parity group like Mirror, RAIDZ, etc.
 */
export interface VDev {
  type: Exclude<TopologyItemType, TopologyItemType.Disk>;
  children: TopologyDisk[];
  guid: string;
  name: string;
  path: string;
  stats: TopologyItemStats;
  status: TopologyItemStatus;
  unavail_disk: unknown;
  disk?: string;
}

/**
 * Topology disk representation
 * Represents an actual physical disk in the topology
 */
export interface TopologyDisk {
  type: TopologyItemType.Disk;
  children: TopologyDisk[];
  device: string;
  disk: string;
  guid: string;
  name: string;
  path: string;
  stats: TopologyItemStats;
  status: TopologyItemStatus;
  unavail_disk: unknown;
}

/**
 * Type guard to check if item is a TopologyDisk
 */
export function isTopologyDisk(topologyItem: VDevItem): topologyItem is TopologyDisk {
  return topologyItem.type === TopologyItemType.Disk;
}

/**
 * Type guard to check if item is a VDev
 */
export function isVdev(topologyItem: VDevItem): topologyItem is VDev {
  return topologyItem.type !== TopologyItemType.Disk;
}

/**
 * As returned by snapshot.query
 */
export interface Snapshot {
  name: string;
  snapshot: string;
  dataset: string;
  created?: string;
  properties?: ZfsProperties;
  referenced?: string;
  used?: string;
}

/**
 * ZFS properties for snapshots
 */
export interface ZfsProperties {
  acltype: ZfsProperty<string>;
  casesensitivity: ZfsProperty<string>;
  clones: ZfsProperty<string>;
  compressratio: ZfsProperty<string>;
  context: ZfsProperty<string>;
  createtxg: ZfsProperty<string>;
  creation: ZfsProperty<string>;
  defcontext: ZfsProperty<string>;
  defer_destroy: ZfsProperty<string>;
  devices: ZfsProperty<string>;
  encryption: ZfsProperty<string>;
  encryptionroot: ZfsProperty<string>;
  exec: ZfsProperty<string>;
  fscontext: ZfsProperty<string>;
  guid: ZfsProperty<string>;
  inconsistent: ZfsProperty<string>;
  ivsetguid: ZfsProperty<string>;
  keyguid: ZfsProperty<string>;
  keystatus: ZfsProperty<string>;
  logicalreferenced: ZfsProperty<string>;
  mlslabel: ZfsProperty<string>;
  name: ZfsProperty<string>;
  nbmand: ZfsProperty<string>;
  normalization: ZfsProperty<string>;
  numclones: ZfsProperty<string>;
  objsetid: ZfsProperty<string>;
  primarycache: ZfsProperty<string>;
  redact_snaps: ZfsProperty<string>;
  redacted: ZfsProperty<string>;
  refcompressratio: ZfsProperty<string>;
  referenced: ZfsProperty<string>;
  remaptxg: ZfsProperty<string>;
  rootcontext: ZfsProperty<string>;
  secondarycache: ZfsProperty<string>;
  setuid: ZfsProperty<string>;
  type: ZfsProperty<string>;
  unique: ZfsProperty<string>;
  used: ZfsProperty<string>;
  useraccounting: ZfsProperty<string>;
  userrefs: ZfsProperty<string>;
  utf8only: ZfsProperty<string>;
  version: ZfsProperty<string>;
  volsize: ZfsProperty<string>;
  written: ZfsProperty<string>;
}

/**
 * Get all disks from a VDevItem tree
 */
export function getDisksFromTopology(item: VDevItem): TopologyDisk[] {
  const disks: TopologyDisk[] = [];

  function traverse(node: VDevItem): void {
    if (isTopologyDisk(node)) {
      disks.push(node);
    } else {
      // VDev - traverse children
      node.children.forEach(traverse);
    }
  }

  traverse(item);
  return disks;
}

/**
 * Check if VDev has any errors in its stats
 */
export function hasVdevErrors(stats: TopologyItemStats): boolean {
  return (
    stats.read_errors > 0 ||
    stats.write_errors > 0 ||
    stats.checksum_errors > 0
  );
}

/**
 * Calculate total size of a VDevItem tree
 */
export function calculateTreeSize(item: VDevItem): number {
  if (isTopologyDisk(item)) {
    return item.stats.size;
  }
  // For VDev, use the stats size directly
  return item.stats.size;
}

/**
 * Calculate total allocated size of a VDevItem tree
 */
export function calculateTreeAllocated(item: VDevItem): number {
  if (isTopologyDisk(item)) {
    return item.stats.allocated;
  }
  return item.stats.allocated;
}
