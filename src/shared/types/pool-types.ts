/**
 * Pool types
 * Ported from webui/src/app/interfaces/pool.interface.ts
 */

import { DeduplicationSetting } from './dedup-enum-types';
import { OnOff } from './on-off-enum-types';
import { PoolScanFunction } from './pool-scan-enum-types';
import { PoolScanState } from './pool-scan-enum-types';
import { PoolStatus } from './pool-status-enum-types';
import { CreateVdevLayout, VDevType } from './vdev-enum-types';
import { VDevItem } from './storage-types';
import { ZfsProperty } from './zfs-property-types';
// ApiTimestamp is defined in system-types.ts as { $date: number }
export { ApiTimestamp } from './system-types';

/**
 * Pool scan/update progress
 */
export interface PoolScanUpdate {
  bytes_issued: number;
  bytes_processed: number;
  bytes_to_process: number;
  end_time: ApiTimestamp;
  errors: number;
  function: PoolScanFunction;
  pause: ApiTimestamp | null;
  percentage: number;
  start_time: ApiTimestamp;
  state: PoolScanState;
  total_secs_left: number | null;
}

/**
 * Pool topology mapping
 */
export type PoolTopology = Record<VDevType, VDevItem[]>;

/**
 * Pool representation
 */
export interface Pool {
  autotrim: ZfsProperty<string>;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encrypt: number;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encryptkey: string;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encryptkey_path: string;
  guid: string;
  healthy: boolean;
  id: number;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  is_decrypted: boolean;
  name: string;
  path: string;
  scan: PoolScanUpdate;
  status: PoolStatus;
  status_code?: string;
  status_detail: string;
  topology: PoolTopology;

  /**
   * Available with extra is_upgraded=true
   */
  is_upgraded?: boolean;

  /**
   * Pool size in bytes
   */
  size: number;

  /**
   * Formatted size string (available with is_upgraded)
   */
  size_str?: string;

  /**
   * Allocated space in bytes (available with is_upgraded)
   */
  allocated?: number;

  /**
   * Formatted allocated string (available with is_upgraded)
   */
  allocated_str?: string;

  /**
   * Free space in bytes (available with is_upgraded)
   */
  free?: number;

  /**
   * Formatted free string (available with is_upgraded)
   */
  free_str?: string;

  /**
   * Freeing space in bytes (available with is_upgraded)
   */
  freeing?: number;

  /**
   * Formatted freeing string (available with is_upgraded)
   */
  freeing_str?: number;

  /**
   * Fragmentation percentage (available with is_upgraded)
   */
  fragmentation?: number;

  algorithm?: ZfsProperty<string, string>;
  dedup_table_quota: string | null;
  dedup_table: number | null;
  dedup_table_size: number;
  all_sed?: boolean;
  warning?: boolean;
}

/**
 * Pool instance (simplified version)
 */
export interface PoolInstance {
  id: number;
  name: string;
  guid: string;
  encrypt: number;
  encryptkey: string;
  encryptkey_path: string;
  is_decrypted: boolean;
  status: PoolStatus;
  path: string;
  scan: PoolScanUpdate | null;
  is_upgraded: boolean;
  healthy: boolean;
  warning: boolean;
  status_detail: string;
  size: number;
  allocated: number;
  free: number;
  freeing: number;
  fragmentation: string;
  autotrim: ZfsProperty<string>;
  topology: PoolTopology;
}

/**
 * Create pool parameters
 */
export interface CreatePool {
  encryption: boolean;
  encryption_options?: {
    generate_key: boolean;
    algorithm: string;
    passphrase?: string;
    key?: string;
  };
  all_sed?: boolean;
  name: string;
  topology: UpdatePoolTopology;
  checksum?: string;
  deduplication?: DeduplicationSetting;
  allow_duplicate_serials?: boolean;
}

/**
 * Update pool parameters
 */
export interface UpdatePool {
  topology?: UpdatePoolTopology;
  autotrim?: OnOff;
  allow_duplicate_serials?: boolean;
  dedup_table_quota?: NewDeduplicationQuotaSetting;
  dedup_table_quota_value?: number;
}

/**
 * Pool topology update parameters
 */
export interface UpdatePoolTopology {
  data?: DataPoolTopologyUpdate[];
  special?: { type: CreateVdevLayout; disks: string[] }[];
  dedup?: { type: CreateVdevLayout; disks: string[] }[];
  cache?: { type: CreateVdevLayout; disks: string[] }[];
  log?: { type: CreateVdevLayout; disks: string[] }[];
  // Note that here spares is a correct name, not spare.
  spares?: string[];
}

/**
 * Data pool topology update
 */
export interface DataPoolTopologyUpdate {
  type: CreateVdevLayout;
  disks: string[];
  draid_data_disks?: number;
  draid_spare_disks?: number;
}

/**
 * Pool attach parameters
 */
export interface PoolAttachParams {
  target_vdev?: string;
  new_disk?: string;
  passphrase: string;
  allow_duplicate_serials?: boolean;
}

/**
 * Pool replace parameters
 */
export interface PoolReplaceParams {
  label: string;
  disk: string;
  force?: boolean;
  passphrase?: string;
  preserve_settings?: boolean;
  preserve_description?: boolean;
}

/**
 * Pool expand parameters type
 */
export type PoolExpandParams = [
  id: number,
  params?: { geli: { passphrase: string } },
];

/**
 * Prune dedup table parameters
 */
export interface PruneDedupTableParams {
  pool_name: string;
  percentage?: number;
  days?: number;
}

/**
 * Pool expand parameters
 */
export interface ExpandPoolParams {
  id: number;
  params?: {
    geli?: {
      passphrase: string;
    };
  };
}

/**
 * Get pool status display color based on status
 */
export function getPoolStatusColor(pool: Pool): string {
  if (pool.healthy) {
    return '#4caf50'; // green
  }
  if (pool.status === PoolStatus.Degraded) {
    return '#ff9800'; // orange
  }
  return '#f44336'; // red
}

/**
 * Get pool status label
 */
export function getPoolStatusLabel(pool: Pool): string {
  if (pool.healthy) {
    return 'Healthy';
  }
  return pool.status_detail || pool.status;
}

/**
 * Dedup quota setting types
 */
export type NewDeduplicationQuotaSetting = 'ENABLED' | 'DISABLED' | 'CUSTOM';

/**
 * Create pool VDEV configuration
 */
export interface VdevConfiguration {
  type: CreateVdevLayout;
  disks: string[];
  draid_data_disks?: number;
  draid_spare_disks?: number;
}

/**
 * Pool creation result
 */
export interface CreatePoolResult {
  pool: Pool;
  warnings?: string[];
}
