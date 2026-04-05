/**
 * Storage Dashboard Store
 * Manages storage dashboard state with Zustand
 */

import { create } from 'zustand';
import { poolService } from '../services/pool';
import { diskService } from '../services/disk';
import { datasetService } from '../services/dataset';
import { Pool } from '../types/pool-types';
import { StorageDashboardDisk } from '../types/disk-types';
import { Dataset } from '../types/dataset-types';
import { ScrubTask } from '../types/pool-scrub-types';

interface StorageDashboardState {
  // Loading states
  isLoading: boolean;
  isLoadingPoolDetails: boolean;
  isRefreshing: boolean;

  // Data
  pools: Pool[];
  disks: StorageDashboardDisk[];
  scrubs: ScrubTask[];
  rootDatasets: Record<string, Dataset>;
  selectedPool: Pool | null;

  // Error
  error: string | null;

  // Actions
  loadDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  selectPool: (pool: Pool | null) => void;
  createPool: (params: unknown) => Promise<void>;
}

export const useStorageDashboardStore = create<StorageDashboardState>((set, get) => ({
  // Initial state
  isLoading: false,
  isLoadingPoolDetails: false,
  isRefreshing: false,
  pools: [],
  disks: [],
  scrubs: [],
  rootDatasets: {},
  selectedPool: null,
  error: null,

  // Load dashboard data
  loadDashboard: async () => {
    set({ isLoading: true, isLoadingPoolDetails: true, error: null });
    try {
      const [pools, rootDatasets, disks, scrubs] = await Promise.all([
        poolService.query(),
        datasetService.query([]),
        diskService.query(),
        poolService.scrubQuery(),
      ]);

      set({
        isLoading: false,
        isLoadingPoolDetails: false,
        pools,
        rootDatasets: rootDatasets.reduce((acc, ds) => ({ ...acc, [ds.id]: ds }), {}),
        disks,
        scrubs,
      });
    } catch (error) {
      set({ isLoading: false, isLoadingPoolDetails: false, error: String(error) });
    }
  },

  // Refresh dashboard data
  refreshDashboard: async () => {
    set({ isRefreshing: true, error: null });
    try {
      await get().loadDashboard();
    } finally {
      set({ isRefreshing: false });
    }
  },

  // Select pool
  selectPool: (pool) => {
    set({ selectedPool: pool });
  },

  // Create pool
  createPool: async (params) => {
    try {
      await poolService.create(params);
      await get().loadDashboard();
    } catch (error) {
      throw error;
    }
  },
}));
