/**
 * Dataset types
 * Ported from webui/src/app/interfaces/dataset.interface.ts
 */

import { AclMode } from './acl-mode-enum-types';
import {
  DatasetAclType,
  DatasetCaseSensitivity,
  DatasetChecksum,
  DatasetPreset,
  DatasetRecordSize,
  DatasetSnapdev,
  DatasetSnapdir,
  DatasetSync,
  DatasetType,
  DatasetVolumeBlockSize,
} from './dataset-enum-types';
import { DeduplicationSetting } from './dedup-enum-types';
import { EncryptionKeyFormat } from './encryption-key-format-enum-types';
import { IscsiExtentType } from './iscsi-enum-types';
import { OnOff } from './on-off-enum-types';
import { YesNo } from './yes-no-enum-types';
import { ZfsProperty } from './zfs-property-types';

/**
 * Base interface for dataset share summaries from middleware
 */
export interface DatasetShareSummary {
  enabled: boolean;
  path: string;
}

/**
 * Named share summary (SMB, WebShare)
 */
export interface NamedDatasetShareSummary extends DatasetShareSummary {
  share_name: string;
}

/**
 * Dataset representation
 */
export interface Dataset {
  available: ZfsProperty<string, number>;
  compression: ZfsProperty<string, string>;
  compressratio: ZfsProperty<string, string>;
  deduplication: ZfsProperty<DeduplicationSetting, string>;
  encrypted: boolean;
  encryption_algorithm: ZfsProperty<string | null>;
  encryption_root: string;
  id: string;
  key_format: ZfsProperty<EncryptionKeyFormat | null>;
  key_loaded: boolean;
  locked: boolean;
  mountpoint: string;
  mounted: ZfsProperty<YesNo, boolean>;
  name: string;
  pool: string;
  readonly: ZfsProperty<OnOff, boolean>;
  used: ZfsProperty<string, number>;
  usedbychildren: ZfsProperty<string, number>;
  usedbydataset: ZfsProperty<string, number>;
  usedbyrefreservation: ZfsProperty<string, number>;
  usedbysnapshots: ZfsProperty<string, number>;
  type: DatasetType;
  aclmode: ZfsProperty<AclMode, string>;
  acltype: ZfsProperty<DatasetAclType, string>;
  atime: ZfsProperty<OnOff, boolean>;
  casesensitivity: ZfsProperty<DatasetCaseSensitivity, string>;
  copies: ZfsProperty<string, number>;
  exec: ZfsProperty<OnOff, boolean>;
  origin: ZfsProperty<string>;
  pbkdf2iters: ZfsProperty<string, string>;
  quota: ZfsProperty<number>;
  recordsize: ZfsProperty<string, number>;
  refquota: ZfsProperty<number>;
  refreservation: ZfsProperty<number>;
  reservation: ZfsProperty<string, number>;
  snapdev: ZfsProperty<DatasetSnapdev, string>;
  snapdir: ZfsProperty<DatasetSnapdir, string>;
  share_type: ZfsProperty<DatasetPreset, string>;
  special_small_block_size: ZfsProperty<string>;
  sync: ZfsProperty<DatasetSync, string>;
  checksum: ZfsProperty<DatasetChecksum>;

  // Absent if extra.retrieve_children is false

  children?: Dataset[];

  user_properties?: Record<string, ZfsProperty<string, string | number>>;

  // Present for type === DatasetType.Volume
  volsize?: ZfsProperty<string, number>;
  volblocksize?: ZfsProperty<string, number>;
}

/**
 * Extra dataset query options
 */
export interface ExtraDatasetQueryOptions {
  extra?: {
    retrieve_children?: boolean;
    flat?: boolean;
    properties?: string[];
  };
}

/**
 * Dataset create parameters
 */
export interface DatasetCreate {
  name: string;
  type?: DatasetType;
  volsize?: number;
  volblocksize?: DatasetVolumeBlockSize;
  sparse?: boolean;
  force_size?: boolean;
  comments?: string;
  sync?: DatasetSync;
  compression?: string;
  atime?: OnOff;
  exec?: OnOff;
  managedby?: string;
  quota?: number;
  quota_warning?: number;
  quota_critical?: number;
  refquota?: number;
  refquota_warning?: number;
  refquota_critical?: number;
  reservation?: number;
  refreservation?: number;
  special_small_block_size?: number;
  copies?: number;
  snapdir?: DatasetSnapdir;
  snapdev?: DatasetSnapdev;
  deduplication?: string;
  checksum?: DatasetChecksum;
  readonly?: OnOff;
  recordsize?: string;
  casesensitivity?: DatasetCaseSensitivity;
  aclmode?: AclMode;
  acltype?: DatasetAclType;
  share_type?: DatasetPreset;
  encryption_options?: {
    generate_key?: boolean;
    pbkdf2iters?: number;
    algorithm?: string;
    passphrase?: string;
    key?: string;
  };
  encryption?: boolean;
  inherit_encryption?: boolean;
  user_properties?: { key: string; value: string }[];
  create_ancestors?: boolean;
}

/**
 * Dataset update parameters
 */
export interface DatasetUpdate {
  volsize?: number;
  force_size?: boolean;
  comments?: string;
  sync?: DatasetSync;
  compression?: string;
  atime?: OnOff;
  exec?: OnOff;
  managedby?: string;
  quota?: number;
  quota_warning?: number;
  quota_critical?: number;
  refquota?: number;
  refquota_warning?: number;
  refquota_critical?: number;
  reservation?: number;
  refreservation?: number;
  special_small_block_size?: number;
  copies?: number;
  snapdir?: DatasetSnapdir;
  snapdev?: DatasetSnapdev;
  deduplication?: DeduplicationSetting;
  checksum?: DatasetChecksum;
  readonly?: OnOff;
  recordsize?: DatasetRecordSize;
  aclmode?: AclMode;
  acltype?: DatasetAclType;
  user_properties?: Record<string, string>;
  create_ancestors?: boolean;
  user_properties_update?: { key: string; value: string; remove?: boolean }[];
}

/**
 * Dataset details
 */
export interface DatasetDetails {
  id: string;
  encrypted: boolean;
  available: ZfsProperty<string, number>;
  encryption_algorithm: ZfsProperty<string>;
  encryption_root: string;
  key_format: ZfsProperty<EncryptionKeyFormat>;
  key_loaded: boolean;
  locked: boolean;
  readonly: ZfsProperty<OnOff, boolean>;
  mountpoint: string;
  mounted: ZfsProperty<YesNo, boolean>;
  name: string;
  pool: string;
  type: DatasetType;
  used: ZfsProperty<string, number>;
  usedbychildren: ZfsProperty<string, number>;
  usedbydataset: ZfsProperty<string, number>;
  usedbysnapshots: ZfsProperty<string, number>;
  quota: ZfsProperty<string, number>;
  refquota: ZfsProperty<string, number>;
  refreservation: ZfsProperty<string, number>;
  reservation: ZfsProperty<string, number>;
  snapshot_count?: number;
  replication_tasks_count?: number;
  snapshot_tasks_count?: number;
  cloudsync_tasks_count?: number;
  rsync_tasks_count?: number;
  smb_shares?: NamedDatasetShareSummary[];
  nfs_shares?: DatasetShareSummary[];
  iscsi_shares?: (DatasetShareSummary & { type: IscsiExtentType })[];
  nvmet_shares?: DatasetShareSummary[];
  vms?: { name: string; path: string }[];
  apps?: { name: string; path: string }[];
  containers?: { name: string; path: string }[];
  webshare_shares?: NamedDatasetShareSummary[];
  children?: DatasetDetails[];
  volsize?: ZfsProperty<string, number>; // Present for type === DatasetType.Volume
  thick_provisioned?: boolean; // Present for type === DatasetType.Volume
  atime: ZfsProperty<OnOff, boolean>;
  casesensitivity: ZfsProperty<DatasetCaseSensitivity, string>;
  origin: ZfsProperty<string>;
  sync: ZfsProperty<string>;
  compression: ZfsProperty<string>;
  compressratio: ZfsProperty<string>;
  deduplication: ZfsProperty<string>;
  user_properties?: Record<string, ZfsProperty<string, string | number>>;
}

/**
 * Disk space key
 */
export enum DiskSpaceKey {
  UsedByDataset = 'usedbydataset',
  UsedByChildren = 'usedbychildren',
}

/**
 * Disk space mapping
 */
export type DiskSpace = Partial<Record<DiskSpaceKey, number>>;

/**
 * Swatch colors for disk space visualization
 */
export type SwatchColors = Partial<Record<DiskSpaceKey, { backgroundColor: string }>>;

/**
 * Get dataset name from full path
 */
export function getDatasetName(dataset: Dataset | DatasetDetails): string {
  const parts = dataset.name.split('/');
  return parts[parts.length - 1];
}

/**
 * Get dataset parent name
 */
export function getDatasetParentName(dataset: Dataset | DatasetDetails): string | null {
  const parts = dataset.name.split('/');
  if (parts.length <= 1) {
    return null;
  }
  parts.pop();
  return parts.join('/');
}

/**
 * Check if dataset is a volume
 */
export function isVolume(dataset: Dataset | DatasetDetails): boolean {
  return dataset.type === DatasetType.Volume;
}

/**
 * Check if dataset is a filesystem
 */
export function isFilesystem(dataset: Dataset | DatasetDetails): boolean {
  return dataset.type === DatasetType.Filesystem;
}

/**
 * Check if dataset has shares
 */
export function datasetHasShares(dataset: DatasetDetails): boolean {
  return (
    (dataset.smb_shares && dataset.smb_shares.length > 0) ||
    (dataset.nfs_shares && dataset.nfs_shares.length > 0) ||
    (dataset.iscsi_shares && dataset.iscsi_shares.length > 0) ||
    (dataset.nvmet_shares && dataset.nvmet_shares.length > 0) ||
    (dataset.webshare_shares && dataset.webshare_shares.length > 0)
  );
}

/**
 * Check if dataset is encrypted
 */
export function isDatasetEncrypted(dataset: Dataset | DatasetDetails): boolean {
  return dataset.encrypted;
}
