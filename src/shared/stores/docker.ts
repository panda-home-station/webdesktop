/**
 * Docker Store
 * Zustand store for Docker configuration and status
 */

import { create } from 'zustand';
import { appService } from '../../truenas/services/app';
import { DockerConfig, DockerStatusData } from '../types/app-types';

interface DockerState {
  // State
  isLoading: boolean;
  config: DockerConfig | null;
  status: DockerStatusData;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  setPool: (pool: string | null, migrateApps?: boolean) => Promise<void>;
  subscribe: () => () => void;
}

export const useDockerStore = create<DockerState>((set) => ({
  // Initial state
  isLoading: false,
  config: null,
  status: {
    status: null,
    description: null,
  },
  error: null,

  // Actions
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const [config, status] = await Promise.all([
        appService.getDockerConfig(),
        appService.getDockerStatus(),
      ]);
      set({ config, status, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setPool: async (pool, migrateApps) => {
    set({ isLoading: true, error: null });
    try {
      await appService.updateDockerConfig({ pool, ...(migrateApps && { migrate_applications: migrateApps }) } as Partial<DockerConfig>);
      // Wait for job completion would be handled by the caller with progress dialog
      // For now, just re-fetch config
      const config = await appService.getDockerConfig();
      set({ config, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  subscribe: () => {
    return appService.subscribeDockerStatus((status) => {
      set({ status });
    });
  },
}));

// Selectors
export const selectDockerConfig = (state: DockerState) => state.config;
export const selectDockerStatus = (state: DockerState) => state.status;
export const selectIsDockerRunning = (state: DockerState) =>
  state.status.status === 'RUNNING';
export const selectSelectedPool = (state: DockerState) => state.config?.pool || null;