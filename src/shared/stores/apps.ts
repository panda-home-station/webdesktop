/**
 * Apps Store
 * Zustand store for managing installed and available apps
 */

import { create } from 'zustand';
import { appService } from '../../truenas/services/app';
import { App, AppCreate, AppStats, AvailableApp, ContainerImage, DockerRegistry } from '../types/app-types';

interface AppsState {
  // Installed Apps
  installedApps: App[];
  installedAppsLoading: boolean;
  installedAppsError: string | null;

  // Available Apps
  availableApps: AvailableApp[];
  availableAppsLoading: boolean;
  availableAppsError: string | null;
  categories: string[];

  // Container Images
  containerImages: ContainerImage[];
  containerImagesLoading: boolean;

  // Registries
  registries: DockerRegistry[];
  registriesLoading: boolean;

  // Stats
  appStats: Record<string, AppStats>;
  statsLoading: boolean;

  // Actions
  loadInstalledApps: () => Promise<void>;
  loadAvailableApps: (filters?: { categories?: string[]; sort?: string }) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadContainerImages: () => Promise<void>;
  loadRegistries: () => Promise<void>;
  loadAppStats: (name: string) => Promise<void>;

  startApp: (name: string) => Promise<void>;
  stopApp: (name: string) => Promise<void>;
  restartApp: (name: string) => Promise<void>;
  deleteApp: (name: string, options?: { remove_images?: boolean; remove_ix_volumes?: boolean }) => Promise<void>;
  installApp: (params: AppCreate) => Promise<Job<void>>;

  pullImage: (
    registry: string,
    imageName: string,
    tag: string,
    onProgress?: (progress: { percent: number; description?: string }) => void
  ) => Promise<void>;
  deleteImage: (imageId: string, force?: boolean) => Promise<void>;

  createRegistry: (registry: Omit<DockerRegistry, 'id'>) => Promise<void>;
  updateRegistry: (id: string, registry: Partial<DockerRegistry>) => Promise<void>;
  deleteRegistry: (id: string) => Promise<void>;

  subscribeToChanges: () => () => void;
}

export const useAppsStore = create<AppsState>((set, get) => ({
  // Initial state - Installed Apps
  installedApps: [],
  installedAppsLoading: false,
  installedAppsError: null,

  // Initial state - Available Apps
  availableApps: [],
  availableAppsLoading: false,
  availableAppsError: null,
  categories: [],

  // Initial state - Container Images
  containerImages: [],
  containerImagesLoading: false,

  // Initial state - Registries
  registries: [],
  registriesLoading: false,

  // Initial state - Stats
  appStats: {},
  statsLoading: false,

  // Actions - Load Installed Apps
  loadInstalledApps: async () => {
    set({ installedAppsLoading: true, installedAppsError: null });
    try {
      const apps = await appService.query();
      set({ installedApps: apps, installedAppsLoading: false });
    } catch (error) {
      set({ installedAppsError: (error as Error).message, installedAppsLoading: false });
    }
  },

  // Actions - Load Available Apps
  loadAvailableApps: async (filters) => {
    set({ availableAppsLoading: true, availableAppsError: null });
    try {
      const queryFilters: unknown[][] = [];

      if (filters?.categories?.length) {
        queryFilters.push(['OR', ...filters.categories.map((c) => ['categories', 'rin', c])]);
      }

      const options = filters?.sort ? { order_by: [filters.sort] } : {};

      const apps = await appService.getAvailable(queryFilters, options);
      set({ availableApps: apps, availableAppsLoading: false });
    } catch (error) {
      set({ availableAppsError: (error as Error).message, availableAppsLoading: false });
    }
  },

  // Actions - Load Categories
  loadCategories: async () => {
    try {
      const categories = await appService.getCategories();
      set({ categories });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  },

  // Actions - Load Container Images
  loadContainerImages: async () => {
    set({ containerImagesLoading: true });
    try {
      const images = await appService.getContainerImages();
      set({ containerImages: images, containerImagesLoading: false });
    } catch {
      set({ containerImagesLoading: false });
    }
  },

  // Actions - Load Registries
  loadRegistries: async () => {
    set({ registriesLoading: true });
    try {
      const registries = await appService.getRegistries();
      set({ registries: registries, registriesLoading: false });
    } catch {
      set({ registriesLoading: false });
    }
  },

  // Actions - Load App Stats
  loadAppStats: async (name) => {
    try {
      const stats = await appService.getStats(name);
      set((state) => ({
        appStats: { ...state.appStats, [name]: stats },
      }));
    } catch (error) {
      console.error(`Failed to load stats for ${name}:`, error);
    }
  },

  // Actions - Start App
  startApp: async (name) => {
    await appService.start(name);
    // The subscription will update the state
  },

  // Actions - Stop App
  stopApp: async (name) => {
    await appService.stop(name);
  },

  // Actions - Restart App
  restartApp: async (name) => {
    await appService.restart(name);
  },

  // Actions - Delete App
  deleteApp: async (name, options) => {
    await appService.delete(name, options);
    // Refresh the list after deletion
    get().loadInstalledApps();
  },

  // Actions - Install App
  installApp: async (params) => {
    const job = await appService.create(params);
    return job;
  },

  // Actions - Pull Image
  pullImage: async (registry, imageName, tag, onProgress) => {
    await appService.pullImage(registry, imageName, tag, onProgress);
    // Refresh images after pull
    get().loadContainerImages();
  },

  // Actions - Delete Image
  deleteImage: async (imageId, force) => {
    await appService.deleteImage(imageId, { force });
    // Refresh images after deletion
    get().loadContainerImages();
  },

  // Actions - Create Registry
  createRegistry: async (registry) => {
    await appService.createRegistry(registry);
    get().loadRegistries();
  },

  // Actions - Update Registry
  updateRegistry: async (id, registry) => {
    await appService.updateRegistry(id, registry);
    get().loadRegistries();
  },

  // Actions - Delete Registry
  deleteRegistry: async (id) => {
    await appService.deleteRegistry(id);
    get().loadRegistries();
  },

  // Actions - Subscribe to changes
  subscribeToChanges: () => {
    const unsubscribe = appService.subscribe(() => {
      // Refresh installed apps when changes are detected
      get().loadInstalledApps();
    });

    const unsubscribeJobs = appService.subscribeJobs(
      (event) => {
        if (['app.start', 'app.stop', 'app.redeploy', 'app.delete', 'app.upgrade', 'app.create'].includes(event.fields.method)) {
          get().loadInstalledApps();
        }
      },
      ['app.start', 'app.stop', 'app.redeploy', 'app.delete', 'app.upgrade', 'app.create']
    );

    return () => {
      unsubscribe();
      unsubscribeJobs();
    };
  },
}));

// Selectors
export const selectInstalledApps = (state: AppsState) => state.installedApps;
export const selectAvailableApps = (state: AppsState) => state.availableApps;
export const selectCategories = (state: AppsState) => state.categories;
export const selectContainerImages = (state: AppsState) => state.containerImages;
export const selectRegistries = (state: AppsState) => state.registries;
export const selectAppStats = (state: AppsState) => state.appStats;