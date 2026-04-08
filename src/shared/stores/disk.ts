/**
 * Disk Store
 * Manages disk state and operations
 */

import { create } from 'zustand';
import { diskService } from '../../truenas/services/disk';
import { StorageDashboardDisk } from '../types/disk-types';

interface DiskState {
  // Loading state
  isLoading: boolean;

  // Data
  disks: StorageDashboardDisk[];
  selectedDisk: StorageDashboardDisk | null;

  // Error
  error: string | null;

  // Actions
  loadDisks: () => Promise<void>;
  selectDisk: (disk: StorageDashboardDisk | null) => void;
  updateDisk: (id: string, params: unknown) => Promise<void>;
  wipeDisk: (id: string) => Promise<void>;
}

export const useDiskStore = create<DiskState>((set, get) => ({
  // Initial state
  isLoading: false,
  disks: [],
  selectedDisk: null,
  error: null,

  // Load disks
  loadDisks: async () => {
    set({ isLoading: true, error: null });
    try {
      const disks = await diskService.query();
      set({ isLoading: false, disks });
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  // Select disk
  selectDisk: (disk) => {
    set({ selectedDisk: disk });
  },

  // Update disk
  updateDisk: async (id, params) => {
    await diskService.update(id, params);
    await get().loadDisks();
  },

  // Wipe disk
  wipeDisk: async (id) => {
    await diskService.wipe(id);
    await get().loadDisks();
  },
}));
