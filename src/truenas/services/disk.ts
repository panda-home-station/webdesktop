/**
 * Disk Service
 * Ported from webui/src/app/services/disk.service.ts
 */

import {
  DetailsDisk,
  Disk,
  DiskDetailsParams,
  DiskDetailsResponse,
  DiskDetailsResponse,
  DiskTemperatures,
  DiskTemperatureAgg,
  DiskUpdate,
  DiskWipeParams,
  ExtraDiskQueryOptions,
} from '../types/disk-types';
import { TemperatureAgg } from '../types/storage-types';
import { truenasApi } from '../api';
import { Alert } from '../types/alert.interface';

/**
 * Disk API Service
 * Handles all disk-related API calls
 */
export class DiskService {
  /**
   * Query disks with optional filters
   */
  async query(filters?: unknown[][], options?: ExtraDiskQueryOptions): Promise<Disk[]> {
    return truenasApi.call('disk.query', [filters || [], options]) as Promise<Disk[]>;
  }

  /**
   * Get disk details (both used and unused)
   */
  async details(options?: DiskDetailsParams): Promise<DiskDetailsResponse> {
    return truenasApi.call('disk.details', [options]) as Promise<DiskDetailsResponse>;
  }

  /**
   * Update disk settings
   */
  async update(identifier: string, params: DiskUpdate): Promise<Disk> {
    return truenasApi.call('disk.update', [identifier, params]) as Promise<Disk>;
  }

  /**
   * Wipe a disk
   */
  async wipe(params: DiskWipeParams): Promise<unknown> {
    return truenasApi.call('disk.wipe', params);
  }

  /**
   * Format a disk
   */
  async format(devname: string): Promise<unknown> {
    return truenasApi.call('disk.format', [devname]);
  }

  /**
   * Get disk temperatures
   */
  async getTemperatures(devnames: string[]): Promise<DiskTemperatures> {
    return truenasApi.call('disk.temperatures', [devnames]) as Promise<DiskTemperatures>;
  }

  /**
   * Get temperature alerts for disks
   */
  async temperatureAlerts(devnames: string[]): Promise<Alert[]> {
    return truenasApi.call('alert.list', [['klass', '=', 'DiskTemperature'], ['args.devname', 'in', devnames]]) as Promise<Alert[]>;
  }

  /**
   * Get temperature aggregates for disks
   */
  async temperatureAgg(devnames: string[], days?: number): Promise<DiskTemperatureAgg> {
    return truenasApi.call('reporting.disk_temperature_agg', [devnames], { days }) as Promise<DiskTemperatureAgg>;
  }
}

// Singleton instance
export const diskService = new DiskService();
