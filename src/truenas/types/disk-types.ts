/**
 * Disk types
 * Ported from webui/src/app/interfaces/disk.interface.ts
 */

import { DiskBus } from './disk-bus-enum-types';
import { DiskPowerLevel } from './disk-power-level-enum-types';
import { DiskStandby } from './disk-standby-enum-types';
import { DiskType } from './disk-type-enum-types';
import { DiskWipeMethod } from './disk-wipe-method-enum-types';
import { SedStatus } from './sed-status-enum-types';
import { Alert } from './alert.interface';
import { EnclosureAndSlot, TemperatureAgg } from './storage-types';

/**
 * Disk representation
 */
export interface Disk {
  advpowermgmt: DiskPowerLevel;
  bus: DiskBus;
  description: string;
  devname: string;
  duplicate_serial: string[];
  expiretime: string;
  hddstandby: DiskStandby;
  identifier: string;
  lunid?: string;
  model: string;
  name: string;
  number: number;
  passwd?: string;
  pool: string;
  rotationrate: number | null;
  serial: string;
  size: number;
  subsystem: string;
  transfermode: string;
  type: DiskType;
  zfs_guid: string;
  sed?: boolean | null;
  sed_status?: SedStatus;
}

/**
 * Disk with dashboard-specific properties
 */
export interface StorageDashboardDisk extends Disk {
  alerts: Alert[];
  tempAggregates: TemperatureAgg;
}

/**
 * Additional disk query options
 */
export interface ExtraDiskQueryOptions {
  extra?: {
    /**
     * Will also include expired disks.
     */
    include_expired?: boolean;

    /**
     * Will not hide KMIP password for the disks.
     */
    passwords?: boolean;

    /**
     * Will join pool name for each disk.
     */
    pools?: boolean;

    /**
     * Will include SED status for each disk.
     */
    sed_status?: boolean;
  };
}

/**
 * Disk update parameters
 */
export interface DiskUpdate {
  advpowermgmt?: DiskPowerLevel;
  description?: string;
  hddstandby?: DiskStandby;
  passwd?: string;
  number?: number;
  pool?: string;
}

/**
 * Disk details (unused disks)
 */
export interface DetailsDisk {
  identifier: string;
  name: string;
  sectorsize: number;
  number: number;
  subsystem: string;
  driver: string;
  hctl: string;
  size: number;
  mediasize: number;
  ident: string;
  serial: string;
  model: string;
  descr: string;
  lunid: string;
  bus: DiskBus;
  type: DiskType;
  blocks: number;
  serial_lunid: string;
  rotationrate: number | null;
  sed_status?: SedStatus;
  stripesize: number;
  parts: unknown[];
  dif: boolean;
  exported_zpool: string | null;
  unsupported_md_devices: unknown;
  duplicate_serial: string[];
  devname: string;
  partitions: {
    path: string;
  }[];
  enclosure: EnclosureAndSlot | Record<string, never>;
  vendor: string;
  imported_zpool: string;
}

/**
 * Disk wipe parameters type
 */
export type DiskWipeParams = [
  disk: string,
  method: DiskWipeMethod,
];

/**
 * Disk temperatures mapping
 */
export type DiskTemperatures = Record<string, number | null>;

/**
 * Disk temperature aggregation
 */
export type DiskTemperatureAgg = Record<string, TemperatureAgg>;

/**
 * Disk details parameters
 */
export interface DiskDetailsParams {
  join_partitions?: boolean;
}

/**
 * Disk details response
 */
export interface DiskDetailsResponse {
  used: DetailsDisk[];
  unused: DetailsDisk[];
}

/**
 * Check if disk is available (not in a pool)
 */
export function isDiskAvailable(disk: Disk | DetailsDisk): boolean {
  return !disk.pool || disk.pool === '';
}

/**
 * Get disk display name
 */
export function getDiskDisplayName(disk: Disk | DetailsDisk): string {
  if (disk.description && disk.description.trim()) {
    return disk.description;
  }
  return disk.name;
}

/**
 * Check if disk is SED (Self-Encrypting Drive)
 */
export function isSedDisk(disk: Disk | DetailsDisk): boolean {
  return !!disk.sed;
}

/**
 * Check if disk is unlocked
 */
export function isDiskUnlocked(disk: Disk | DetailsDisk): boolean {
  return disk.sed_status === SedStatus.Available ||
         disk.sed_status === SedStatus.Unlocked;
}

/**
 * Get disk type label
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
 * Get disk bus label
 */
export function getDiskBusLabel(bus: DiskBus): string {
  switch (bus) {
    case DiskBus.Sata:
      return 'SATA';
    case DiskBus.Sas:
      return 'SAS';
    case DiskBus.Scsci:
      return 'SCSI';
    case DiskBus.Usb:
      return 'USB';
    case DiskBus.Ide:
      return 'IDE';
    case DiskBus.Nvme:
      return 'NVMe';
    default:
      return bus;
  }
}
