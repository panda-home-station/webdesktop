/**
 * System Service
 * Handles system-related API calls
 */

import { truenasApi } from '../api';
import {
  SystemInfo,
  NetworkInterface,
  ReportingRealtimeUpdate,
} from '../../shared/types/system-types';

/**
 * System API Service
 * Handles system info, network, and reporting-related API calls
 */
export class SystemService {
  /**
   * Get system information from system.info API
   * This includes cores, physical_cores, model, physmem, etc.
   */
  async getSystemInfo(): Promise<SystemInfo> {
    return truenasApi.call('system.info') as Promise<SystemInfo>;
  }

  /**
   * Get hostname
   */
  async getHostname(): Promise<string> {
    return truenasApi.call('system.hostname') as Promise<string>;
  }

  /**
   * Get system version
   */
  async getVersion(): Promise<string> {
    return truenasApi.call('system.version') as Promise<string>;
  }

  /**
   * Get system version short
   */
  async getVersionShort(): Promise<string> {
    return truenasApi.call('system.version_short') as Promise<string>;
  }

  /**
   * Get system uptime
   */
  async getUptime(): Promise<string> {
    return truenasApi.call('system.uptime') as Promise<string>;
  }

  /**
   * Query network interfaces
   */
  async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    return truenasApi.call('interface.query') as Promise<NetworkInterface[]>;
  }

  /**
   * Query pools
   */
  async getPools(): Promise<unknown[]> {
    return truenasApi.call('pool.query') as Promise<unknown[]>;
  }

  /**
   * Subscribe to realtime reporting updates
   */
  subscribeRealtime(callback: (data: ReportingRealtimeUpdate) => void): () => void {
    return truenasApi.subscribe('reporting.realtime', callback as (data: unknown) => void);
  }
}

// Singleton instance
export const systemService = new SystemService();
