/**
 * App Service
 * Service for interacting with Docker Apps API
 */

import { truenasApi } from '../api';
import {
  App,
  AppStats,
  AppCreate,
  AvailableApp,
  CatalogApp,
  ContainerImage,
  DockerConfig,
  DockerRegistry,
  DockerStatusData,
  Job,
  Pool,
} from '../../shared/types/app-types';

// TODO: Remove this ignore when we have proper config
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const window = (globalThis as any).window;

/**
 * App Service
 * Handles all Docker Apps related API calls
 */
export class AppService {
  /**
   * Query installed apps
   */
  async query(filters?: unknown[][], extra?: unknown): Promise<App[]> {
    return truenasApi.call('app.query', filters || [], {
      extra: {
        retrieve_config: true,
        host_ip: window?.location?.hostname || 'localhost',
        ...extra,
      },
    }) as Promise<App[]>;
  }

  /**
   * Get app by name
   */
  async get(name: string): Promise<App[]> {
    return truenasApi.call('app.query', [['name', '=', name]], {
      extra: {
        include_app_schema: true,
        retrieve_config: true,
        host_ip: window?.location?.hostname || 'localhost',
      },
    }) as Promise<App[]>;
  }

  /**
   * Get available apps (catalog)
   */
  async getAvailable(filters?: unknown[][], options?: unknown): Promise<AvailableApp[]> {
    return truenasApi.call('app.available', filters || [], options) as Promise<AvailableApp[]>;
  }

  /**
   * Get latest apps
   */
  async getLatest(filters?: unknown[][], options?: unknown): Promise<AvailableApp[]> {
    return truenasApi.call('app.latest', filters || [], options) as Promise<AvailableApp[]>;
  }

  /**
   * Get all app categories
   */
  async getCategories(): Promise<string[]> {
    return truenasApi.call('app.categories') as Promise<string[]>;
  }

  /**
   * Get catalog app details
   */
  async getCatalogDetails(name: string, train: string): Promise<unknown> {
    return truenasApi.call('catalog.get_app_details', name, { train }) as Promise<unknown>;
  }

  /**
   * Get catalog app details (typed version)
   */
  async getCatalogAppDetails(name: string, train: string): Promise<CatalogApp> {
    return truenasApi.call('catalog.get_app_details', name, { train }) as Promise<CatalogApp>;
  }

  /**
   * Create (install) an app
   */
  create(params: AppCreate): Promise<Job<void>> {
    return truenasApi.job<void>('app.create', [params]) as Promise<Job<void>>;
  }

  /**
   * Get similar apps
   */
  async getSimilar(app: AvailableApp): Promise<AvailableApp[]> {
    return truenasApi.call('app.similar', [app.name, app.train]) as Promise<AvailableApp[]>;
  }

  /**
   * Get app upgrade summary
   */
  async getUpgradeSummary(name: string, appVersion?: string): Promise<unknown> {
    const payload = [name];
    if (appVersion) {
      payload.push({ app_version: appVersion });
    }
    return truenasApi.call('app.upgrade_summary', payload) as Promise<unknown>;
  }

  /**
   * Start an app
   */
  start(name: string): Promise<Job<void>> {
    return truenasApi.job<void>('app.start', [name]) as Promise<Job<void>>;
  }

  /**
   * Stop an app
   */
  stop(name: string): Promise<Job<void>> {
    return truenasApi.job<void>('app.stop', [name]) as Promise<Job<void>>;
  }

  /**
   * Restart/redeploy an app
   */
  restart(name: string): Promise<Job<void>> {
    return truenasApi.job<void>('app.redeploy', [name]) as Promise<Job<void>>;
  }

  /**
   * Delete an app
   */
  delete(name: string, options?: {
    remove_images?: boolean;
    remove_ix_volumes?: boolean;
    force_remove_ix_volumes?: boolean;
  }): Promise<Job<void>> {
    return truenasApi.job<void>('app.delete', [name, options || {}]) as Promise<Job<void>>;
  }

  /**
   * Bulk delete apps
   */
  bulkDelete(operations: [string, unknown][]): Promise<Job<void>> {
    return truenasApi.job<void>('core.bulk', ['app.delete', operations]) as Promise<Job<void>>;
  }

  /**
   * Upgrade an app
   */
  upgrade(name: string, options?: { app_version?: string }): Promise<Job<void>> {
    const payload: [string, unknown?] = [name];
    if (options) {
      payload.push(options);
    }
    return truenasApi.job<void>('app.upgrade', payload) as Promise<Job<void>>;
  }

  /**
   * Get app stats
   */
  async getStats(name: string): Promise<AppStats> {
    return truenasApi.call('app.statistics', [name]) as Promise<AppStats>;
  }

  /**
   * Check if ix volume exists for app
   */
  async ixVolumeExists(appName: string): Promise<boolean> {
    return truenasApi.call('app.ix_volume.exists', [appName]) as Promise<boolean>;
  }

  /**
   * Get pool list
   */
  async getPools(): Promise<Pool[]> {
    return truenasApi.call('pool.query') as Promise<Pool[]>;
  }

  /**
   * Get Docker config
   */
  async getDockerConfig(): Promise<DockerConfig> {
    return truenasApi.call('docker.config') as Promise<DockerConfig>;
  }

  /**
   * Update Docker config
   */
  updateDockerConfig(config: Partial<DockerConfig>): Promise<Job<DockerConfig>> {
    return truenasApi.job<DockerConfig>('docker.update', [config]) as Promise<Job<DockerConfig>>;
  }

  /**
   * Get Docker status
   */
  async getDockerStatus(): Promise<DockerStatusData> {
    return truenasApi.call('docker.status') as Promise<DockerStatusData>;
  }

  /**
   * Query container images
   */
  async getContainerImages(): Promise<ContainerImage[]> {
    return truenasApi.call('container.image.query') as Promise<ContainerImage[]>;
  }

  /**
   * Pull container image
   */
  pullImage(
    registry: string,
    imageName: string,
    tag: string,
    onProgress?: (progress: { percent: number; description?: string }) => void
  ): Promise<Job<void>> {
    return truenasApi.job<void>(
      'container.image.pull',
      [{ registry, image_name: imageName, tag }],
      onProgress
    ) as Promise<Job<void>>;
  }

  /**
   * Delete container image
   */
  deleteImage(imageId: string, options?: { force?: boolean }): Promise<void> {
    return truenasApi.call('container.image.delete', [imageId, options || {}]) as Promise<void>;
  }

  /**
   * Query docker registries
   */
  async getRegistries(): Promise<DockerRegistry[]> {
    return truenasApi.call('docker.registry.query') as Promise<DockerRegistry[]>;
  }

  /**
   * Create docker registry
   */
  createRegistry(registry: Omit<DockerRegistry, 'id'>): Promise<DockerRegistry> {
    return truenasApi.call('docker.registry.create', [registry]) as Promise<DockerRegistry>;
  }

  /**
   * Update docker registry
   */
  updateRegistry(id: string, registry: Partial<DockerRegistry>): Promise<DockerRegistry> {
    return truenasApi.call('docker.registry.update', [id, registry]) as Promise<DockerRegistry>;
  }

  /**
   * Delete docker registry
   */
  deleteRegistry(id: string): Promise<boolean> {
    return truenasApi.call('docker.registry.delete', [id]) as Promise<boolean>;
  }

  /**
   * Subscribe to app changes
   */
  subscribe(callback: (data: { fields: unknown }) => void): () => void {
    return truenasApi.subscribe('app.query', callback) as () => void;
  }

  /**
   * Subscribe to docker status changes
   */
  subscribeDockerStatus(callback: (data: DockerStatusData) => void): () => void {
    return truenasApi.subscribe('docker.state', (data: unknown) => {
      const event = data as { fields?: DockerStatusData };
      if (event.fields) {
        callback(event.fields);
      }
    }) as () => void;
  }

  /**
   * Subscribe to job updates
   */
  subscribeJobs(
    callback: (data: { fields: { method: string; arguments: unknown[]; result?: unknown } }) => void,
    filterMethod?: string[]
  ): () => void {
    const unsubscribe = truenasApi.subscribe('core.get_jobs', (data: unknown) => {
      const event = data as { fields: { method: string; arguments: unknown[]; result?: unknown } };
      if (!filterMethod || filterMethod.includes(event.fields.method)) {
        callback(event);
      }
    }) as () => void;
    return unsubscribe;
  }
}

// Singleton instance
export const appService = new AppService();