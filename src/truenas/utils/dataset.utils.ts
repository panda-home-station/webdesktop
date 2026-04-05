/**
 * Dataset Utility Functions
 * Dataset operations and helpers
 */

import { Dataset } from '../types/dataset-types';
import { DatasetType } from '../types/dataset-enum-types';

// Get dataset name from path
export function getDatasetName(dataset: Dataset): string {
  return dataset.name.split('/').pop() || dataset.name;
}

// Check if dataset is a volume
export function isVolume(dataset: Dataset): boolean {
  return dataset.type === DatasetType.Volume;
}

// Check if dataset is a filesystem
export function isFilesystem(dataset: Dataset): boolean {
  return dataset.type === DatasetType.Filesystem;
}

// Check if dataset has children
export function hasChildren(dataset: Dataset): boolean {
  return !!dataset.children && dataset.children.length > 0;
}

// Format bytes
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Get dataset used percentage
export function getDatasetUsedPercentage(dataset: Dataset): number {
  const used = dataset.used?.value || 0;
  const quota = dataset.quota?.value || 0;
  if (quota === 0) return 0;
  return Math.round((used / quota) * 100);
}

// Get dataset icon
export function getDatasetIcon(dataset: Dataset): string {
  if (isVolume(dataset)) {
    return '📦';
  }
  if (isFilesystem(dataset)) {
    return '📁';
  }
  return '📄';
}

// Get dataset icon color
export function getDatasetIconColor(dataset: Dataset): string {
  if (isVolume(dataset)) {
    return '#ff9800';
  }
  if (isFilesystem(dataset)) {
    return '#2196f3';
  }
  return '#9e9e9e';
}
