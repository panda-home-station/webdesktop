/**
 * Pool Service
 * Ported from webui/src/app/services/pool.service.ts
 */

import { truenasApi } from '../api';
import {
  CreatePool,
  CreatePoolResult,
  Pool,
  PoolAttachParams,
  PoolExpandParams,
  PoolReplaceParams,
  PoolScanUpdate,
  ScrubTask,
  UpdatePool,
} from '../types/pool-types';

/**
 * Pool API Service
 * Handles all pool-related API calls
 */
export class PoolService {
  /**
   * Query pools with optional filters
   */
  async query(filters?: unknown[][]): Promise<Pool[]> {
    return truenasApi.call('pool.query', filters || []) as Promise<Pool[]>;
  }

  /**
   * Get a single pool by ID
   */
  async get(id: number): Promise<Pool> {
    const result = await truenasApi.call('pool.query', [['id', '=', id]], { extra: { is_upgraded: true } }) as Promise<Pool[]>;
    return result[0] as Pool;
  }

  /**
   * Create a new pool
   */
  async create(params: CreatePool): Promise<CreatePoolResult> {
    return truenasApi.call('pool.create', params) as Promise<CreatePoolResult>;
  }

  /**
   * Update pool settings
   */
  async update(id: number, params: UpdatePool): Promise<Pool> {
    return truenasApi.call('pool.update', id, params) as Promise<Pool>;
  }

  /**
   * Delete a pool
   */
  async delete(id: number, options?: { cascade?: boolean }): Promise<unknown> {
    return truenasApi.call('pool.delete', id, options);
  }

  /**
   * Export a pool
   */
  async export(id: number, options?: { force?: boolean }): Promise<unknown> {
    return truenasApi.call('pool.export', id, options);
  }

  /**
   * Import a pool
   */
  async importPool(guid: string): Promise<unknown> {
    return truenasApi.call('pool.import', guid);
  }

  /**
   * Attach disk to pool
   */
  async attach(params: PoolAttachParams): Promise<Pool> {
    return truenasApi.call('pool.attach', params) as Promise<Pool>;
  }

  /**
   * Replace disk in pool
   */
  async replace(params: PoolReplaceParams): Promise<Pool> {
    return truenasApi.call('pool.replace', params) as Promise<Pool>;
  }

  /**
   * Detach disk from pool
   */
  async detach(label: string, options?: { force?: boolean }): Promise<Pool> {
    return truenasApi.call('pool.detach', label, options) as Promise<Pool>;
  }

  /**
   * Offline a disk in pool
   */
  async offline(label: string): Promise<Pool> {
    return truenasApi.call('pool.offline', label) as Promise<Pool>;
  }

  /**
   * Online a disk in pool
   */
  async online(label: string): Promise<Pool> {
    return truenasApi.call('pool.online', label) as Promise<Pool>;
  }

  /**
   * Remove VDEV from pool
   */
  async remove(guid: string): Promise<Pool> {
    return truenasApi.call('pool.remove', guid) as Promise<Pool>;
  }

  /**
   * Scrub a pool
   */
  async scrub(id: number): Promise<Pool> {
    return truenasApi.call('pool.scrub', id) as Promise<Pool>;
  }

  /**
   * Query scrub tasks
   */
  async scrubQuery(filters?: unknown[][]): Promise<ScrubTask[]> {
    return truenasApi.call('pool.scrub.query', filters || []) as Promise<ScrubTask[]>;
  }

  /**
   * Create scrub task
   */
  async scrubCreate(params: unknown): Promise<ScrubTask> {
    return truenasApi.call('pool.scrub.create', params) as Promise<ScrubTask>;
  }

  /**
   * Update scrub task
   */
  async scrubUpdate(id: number, params: unknown): Promise<ScrubTask> {
    return truenasApi.call('pool.scrub.update', id, params) as Promise<ScrubTask>;
  }

  /**
   * Delete scrub task
   */
  async scrubDelete(id: number): Promise<unknown> {
    return truenasApi.call('pool.scrub.delete', id);
  }

  /**
   * Get pool scan status
   */
  async getScanStatus(id: number): Promise<PoolScanUpdate> {
    return truenasApi.call('pool.get_scan', id) as Promise<PoolScanUpdate>;
  }

  /**
   * Start pool scan
   */
  async startScan(id: number): Promise<Pool> {
    return truenasApi.call('pool.start_scan', id) as Promise<Pool>;
  }

  /**
   * Stop pool scan
   */
  async stopScan(id: number): Promise<Pool> {
    return truenasApi.call('pool.stop_scan', id) as Promise<Pool>;
  }

  /**
   * Expand pool
   */
  async expand(params: PoolExpandParams): Promise<Pool> {
    return truenasApi.call('pool.expand', params) as Promise<Pool>;
  }

  /**
   * Unlock encrypted pool
   */
  async unlock(id: number, options: { geli: { passphrase: string } }): Promise<Pool> {
    return truenasApi.call('pool.unlock', id, options) as Promise<Pool>;
  }

  /**
   * Lock encrypted pool
   */
  async lock(id: number): Promise<Pool> {
    return truenasApi.call('pool.lock', id) as Promise<Pool>;
  }

  /**
   * Subscribe to pool changes
   */
  subscribeToChanges(callback: (data: { id: number; fields: Record<string, unknown> }) => void): () => void {
    return truenasApi.subscribe('pool.query', callback) as () => void;
  }

  /**
   * Subscribe to scan status changes
   */
  subscribeToScanChanges(callback: (data: { id: number; fields: Record<string, unknown> }) => void): () => void {
    return truenasApi.subscribe('pool.get_scan', callback) as () => void;
  }

  /**
   * Get encryption algorithm choices
   */
  async getEncryptionAlgorithmChoices(): Promise<Record<string, string>> {
    return truenasApi.call('pool.dataset.encryption_algorithm_choices') as Promise<Record<string, string>>;
  }
}

// Singleton instance
export const poolService = new PoolService();
