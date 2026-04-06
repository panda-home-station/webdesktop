/**
 * Dataset Service
 * Ported from webui/src/app/services/dataset.service.ts
 */

import {
  Dataset,
  DatasetCreate,
  DatasetDetails,
  DatasetUpdate,
  ExtraDatasetQueryOptions,
} from '../types/dataset-types';
import { truenasApi } from '../api';

/**
 * Dataset API Service
 * Handles all dataset-related API calls
 */
export class DatasetService {
  /**
   * Query datasets with optional filters
   */
  async query(filters?: unknown[][], options?: ExtraDatasetQueryOptions): Promise<Dataset[]> {
    if (options) {
      return truenasApi.call('pool.dataset.query', filters || [], options) as Promise<Dataset[]>;
    }
    return truenasApi.call('pool.dataset.query', filters || []) as Promise<Dataset[]>;
  }

  /**
   * Get a single dataset by ID
   */
  async get(id: string): Promise<DatasetDetails> {
    const result = await truenasApi.call('pool.dataset.query', [['id', '=', id]], { extra: { retrieve_children: false } }) as Promise<DatasetDetails[]>;
    return result[0] as DatasetDetails;
  }

  /**
   * Create a new dataset
   */
  async create(params: DatasetCreate): Promise<Dataset> {
    return truenasApi.call('pool.dataset.create', params) as Promise<Dataset>;
  }

  /**
   * Update dataset settings
   */
  async update(id: string, params: DatasetUpdate): Promise<Dataset> {
    return truenasApi.call('pool.dataset.update', id, params) as Promise<Dataset>;
  }

  /**
   * Delete a dataset
   */
  async delete(id: string, options?: { recursive?: boolean; force?: boolean }): Promise<unknown> {
    return truenasApi.call('pool.dataset.delete', id, options);
  }

  /**
   * Rename a dataset
   */
  async rename(id: string, newName: string): Promise<Dataset> {
    return truenasApi.call('pool.dataset.rename', id, newName) as Promise<Dataset>;
  }

  /**
   * Mount a dataset
   */
  async mount(id: string): Promise<unknown> {
    return truenasApi.call('pool.dataset.mount', id);
  }

  /**
   * Unmount a dataset
   */
  async unmount(id: string, options?: { force?: boolean }): Promise<unknown> {
    return truenasApi.call('pool.dataset.unmount', id, options);
  }

  /**
   * Unlock encrypted dataset
   */
  async unlock(id: string, options: { unlock_key: string; recursive?: boolean }): Promise<unknown> {
    return truenasApi.call('pool.dataset.unlock', id, options);
  }

  /**
   * Lock encrypted dataset
   */
  async lock(id: string, options?: { force_umount?: boolean }): Promise<unknown> {
    return truenasApi.call('pool.dataset.lock', id, options);
  }

  /**
   * Set quota
   */
  async setQuota(id: string, quota?: number | null, quota_warning?: number | null, quota_critical?: number | null): Promise<unknown> {
    return truenasApi.call('pool.dataset.set_quota', id, {
      quota,
      quota_warning,
      quota_critical,
    });
  }

  /**
   * Set refquota
   */
  async setRefquota(id: string, refquota?: number | null, refquota_warning?: number | null, refquota_critical?: number | null): Promise<unknown> {
    return truenasApi.call('pool.dataset.set_refquota', id, {
      refquota,
      refquota_warning,
      refquota_critical,
    });
  }

  /**
   * Set reservation
   */
  async setReservation(id: string, reservation?: number | null): Promise<unknown> {
    return truenasApi.call('pool.dataset.set_reservation', id, { reservation });
  }

  /**
   * Set refreservation
   */
  async setRefreservation(id: string, refreservation?: number | null): Promise<unknown> {
    return truenasApi.call('pool.dataset.set_refreservation', id, { refreservation });
  }

  /**
   * Get used space
   */
  async getUsedSpace(id: string): Promise<number> {
    const dataset = await this.get(id);
    return dataset.used.parsed as number;
  }

  /**
   * Get available space
   */
  async getAvailableSpace(id: string): Promise<number> {
    const dataset = await this.get(id);
    return dataset.available.parsed as number;
  }

  /**
   * Subscribe to dataset changes
   */
  subscribeToChanges(callback: (data: { id: string; fields: Record<string, unknown> }) => void): () => void {
    return truenasApi.subscribe('pool.dataset.query', callback) as () => void;
  }
}

// Singleton instance
export const datasetService = new DatasetService();
