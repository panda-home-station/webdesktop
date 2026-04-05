/**
 * Dataset enums
 * Ported from webui/src/app/enums/dataset.enum.ts
 */

/**
 * Dataset ACL type
 */
export enum DatasetAclType {
  Nfs4 = 'NFS4',
  Off = 'OFF',
  Windows = 'WINDOWS',
}

/**
 * Dataset case sensitivity
 */
export enum DatasetCaseSensitivity {
  Insensitive = 'INSENSITIVE',
  Mixed = 'MIXED',
  Sensitive = 'SENSITIVE',
}

/**
 * Dataset checksum
 */
export enum DatasetChecksum {
  Fnv4 = 'FNV4',
  Off = 'OFF',
  Lz4 = 'LZ4',
  Sha256 = 'SHA256',
  Blake3 = 'BLAKE3',
  Edonr = 'EDONR',
  Skein = 'SKEIN',
}

/**
 * Dataset preset
 */
export enum DatasetPreset {
  AppData = 'APP_DATA',
  Generic = 'GENERIC',
  Home = 'HOME',
  Iocage = 'IOCGAGE',
  Iscsi = 'ISCSI',
  MapAuto = 'MAP_AUTO',
  MapFiles = 'MAP_FILES',
  MapLegacy = 'MAP_LEGACY',
  MapRox = 'MAP_ROX',
  MapRw = 'MAP_RW',
  MapRx = 'MAP_RX',
  Multimedia = 'MULTIMEDIA',
  TimeMachineShare = 'TIME_MACHINE_SHARE',
  WindowsFiles = 'WINDOWS_FILES',
  WindowsShares = 'WINDOWS_SHARES',
}

/**
 * Dataset record size
 */
export enum DatasetRecordSize {
  B512 = '512',
  K1 = '1K',
  K2 = '2K',
  K4 = '4K',
  K8 = '8K',
  K16 = '16K',
  K32 = '32K',
  K64 = '64K',
  K128 = '128K',
  K256 = '256K',
  K512 = '512K',
  M1 = '1M',
}

/**
 * Dataset snapshot device
 */
export enum DatasetSnapdev {
  Hidden = 'HIDDEN',
  Visible = 'VISIBLE',
}

/**
 * Dataset snapshot directory
 */
export enum DatasetSnapdir {
  Hidden = 'HIDDEN',
  Visible = 'VISIBLE',
}

/**
 * Dataset sync setting
 */
export enum DatasetSync {
  Always = 'ALWAYS',
  Standard = 'STANDARD',
  Disabled = 'DISABLED',
}

/**
 * Dataset type
 */
export enum DatasetType {
  Filesystem = 'FILESYSTEM',
  Volume = 'VOLUME',
}

/**
 * Dataset volume block size
 */
export enum DatasetVolumeBlockSize {
  B512 = '512',
  K1 = '1K',
  K2 = '2K',
  K4 = '4K',
  K8 = '8K',
  K16 = '16K',
  K32 = '32K',
  K64 = '64K',
  K128 = '128K',
}

/**
 * Get dataset type display name
 */
export function getDatasetTypeLabel(type: DatasetType): string {
  switch (type) {
    case DatasetType.Filesystem:
      return 'Filesystem';
    case DatasetType.Volume:
      return 'Volume';
    default:
      return type;
  }
}

/**
 * Get dataset type icon
 */
export function getDatasetTypeIcon(type: DatasetType): string {
  switch (type) {
    case DatasetType.Filesystem:
      return 'folder';
    case DatasetType.Volume:
      return 'hard_drive';
    default:
      return 'file';
  }
}

/**
 * Get dataset preset label
 */
export function getDatasetPresetLabel(preset: DatasetPreset): string {
  switch (preset) {
    case DatasetPreset.Generic:
      return 'Generic';
    case DatasetPreset.AppData:
      return 'App Data';
    case DatasetPreset.Home:
      return 'Home';
    case DatasetPreset.Multimedia:
      return 'Multimedia';
    case DatasetPreset.WindowsFiles:
      return 'Windows Files';
    case DatasetPreset.WindowsShares:
      return 'Windows Shares';
    default:
      return preset;
  }
}
