/**
 * Network Service
 * Handles network-related API calls for TrueNAS
 */

import { truenasApi } from '../api';
import type {
  NetworkInterface,
  NetworkConfigurationConfig,
  NetworkSummary,
  StaticRoute,
  IpmiLan,
  IpmiUpdate,
  ServicesRestartedOnSync,
} from '../../shared/types/network-types';

export class NetworkService {
  // ==================== Interface Operations ====================

  /**
   * Query all network interfaces
   */
  async queryInterfaces(): Promise<NetworkInterface[]> {
    return truenasApi.call('interface.query') as Promise<NetworkInterface[]>;
  }

  /**
   * Create a network interface
   */
  async createInterface(data: Record<string, unknown>): Promise<NetworkInterface> {
    return truenasApi.call('interface.create', [data]) as Promise<NetworkInterface>;
  }

  /**
   * Update a network interface
   */
  async updateInterface(id: string, data: Record<string, unknown>): Promise<NetworkInterface> {
    return truenasApi.call('interface.update', [id, data]) as Promise<NetworkInterface>;
  }

  /**
   * Delete a network interface
   */
  async deleteInterface(id: string): Promise<boolean> {
    return truenasApi.call('interface.delete', [id]) as Promise<boolean>;
  }

  // ==================== Pending Changes Operations ====================

  /**
   * Check if there are pending changes
   */
  async hasPendingChanges(): Promise<boolean> {
    return truenasApi.call('interface.has_pending_changes') as Promise<boolean>;
  }

  /**
   * Get checkin waiting seconds
   */
  async checkinWaiting(): Promise<number | null> {
    return truenasApi.call('interface.checkin_waiting') as Promise<number | null>;
  }

  /**
   * Get services restarted on sync
   */
  async getServicesRestartedOnSync(): Promise<ServicesRestartedOnSync[]> {
    return truenasApi.call('interface.services_restarted_on_sync') as Promise<ServicesRestartedOnSync[]>;
  }

  /**
   * Commit pending changes
   */
  async commitChanges(options: { checkin_timeout?: number }): Promise<void> {
    return truenasApi.call('interface.commit', [options]) as Promise<void>;
  }

  /**
   * Checkin now (finalize commit)
   */
  async checkin(): Promise<void> {
    return truenasApi.call('interface.checkin') as Promise<void>;
  }

  /**
   * Rollback pending changes
   */
  async rollback(): Promise<void> {
    return truenasApi.call('interface.rollback') as Promise<void>;
  }

  /**
   * Cancel rollback
   */
  async cancelRollback(): Promise<void> {
    return truenasApi.call('interface.cancel_rollback') as Promise<void>;
  }

  // ==================== Network Configuration ====================

  /**
   * Get network general summary
   */
  async getGeneralSummary(): Promise<NetworkSummary> {
    return truenasApi.call('network.general.summary') as Promise<NetworkSummary>;
  }

  /**
   * Get network configuration
   */
  async getConfiguration(): Promise<NetworkConfigurationConfig> {
    return truenasApi.call('network.configuration.config') as Promise<NetworkConfigurationConfig>;
  }

  /**
   * Update network configuration
   */
  async updateConfiguration(config: Record<string, unknown>): Promise<void> {
    return truenasApi.call('network.configuration.update', [config]) as Promise<void>;
  }

  /**
   * Get activity choices for outbound network
   */
  async getActivityChoices(): Promise<Array<{ label: string; value: string }>> {
    return truenasApi.call('network.configuration.activity_choices') as Promise<Array<{ label: string; value: string }>>;
  }

  // ==================== Static Routes ====================

  /**
   * Query static routes
   */
  async queryStaticRoutes(): Promise<StaticRoute[]> {
    return truenasApi.call('staticroute.query') as Promise<StaticRoute[]>;
  }

  /**
   * Create static route
   */
  async createStaticRoute(data: { destination: string; gateway: string; description?: string }): Promise<StaticRoute> {
    return truenasApi.call('staticroute.create', [data]) as Promise<StaticRoute>;
  }

  /**
   * Update static route
   */
  async updateStaticRoute(id: number, data: { destination?: string; gateway?: string; description?: string }): Promise<StaticRoute> {
    return truenasApi.call('staticroute.update', [id, data]) as Promise<StaticRoute>;
  }

  /**
   * Delete static route
   */
  async deleteStaticRoute(id: number): Promise<boolean> {
    return truenasApi.call('staticroute.delete', [id]) as Promise<boolean>;
  }

  // ==================== IPMI ====================

  /**
   * Check if IPMI is loaded
   */
  async isIpmiLoaded(): Promise<boolean> {
    return truenasApi.call('ipmi.is_loaded') as Promise<boolean>;
  }

  /**
   * Query IPMI LAN info
   */
  async queryIpmiLan(): Promise<IpmiLan[]> {
    return truenasApi.call('ipmi.lan.query') as Promise<IpmiLan[]>;
  }

  /**
   * Update IPMI
   */
  async updateIpmi(id: number, data: IpmiUpdate): Promise<void> {
    return truenasApi.call('ipmi.lan.update', [id, data]) as Promise<void>;
  }

  /**
   * Query IPMI events
   */
  async queryIpmiEvents(): Promise<unknown[]> {
    return truenasApi.call('ipmi.lan.events') as Promise<unknown[]>;
  }

  // ==================== HA ====================

  /**
   * Check if HA is enabled
   */
  async isHaEnabled(): Promise<boolean> {
    try {
      const [licensed, status, config] = await Promise.all([
        truenasApi.call('failover.licensed') as Promise<boolean>,
        truenasApi.call('failover.status') as Promise<string>,
        truenasApi.call('failover.config') as Promise<{ disabled: boolean } | null>,
      ]);
      return licensed && status !== 'SINGLE' && !config?.disabled;
    } catch {
      return false;
    }
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to realtime reporting updates
   */
  subscribeRealtime(callback: (data: unknown) => void): () => void {
    return truenasApi.subscribe('reporting.realtime', callback);
  }
}

// Singleton instance
export const networkService = new NetworkService();