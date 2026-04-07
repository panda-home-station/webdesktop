/**
 * VDEVs Store
 * Manages VDEV topology state
 */

import { create } from 'zustand';
import { poolService } from '../../truenas/services/pool';
import { VDevItem, TopologyDisk } from '../types/storage-types';
import { VDevType } from '../types/vdev-enum-types';

interface VdevsState {
  // Loading state
  isLoading: boolean;

  // Data
  nodes: VDevItem[];
  diskDictionary: Record<string, TopologyDisk>;
  selectedNode: VDevItem | null;
  selectedPoolId: number | null;

  // Error
  error: string | null;

  // Actions
  loadNodes: (poolId: number) => Promise<void>;
  selectNode: (node: VDevItem | null) => void;
  selectPool: (poolId: number) => void;
}

export const useVdevsStore = create<VdevsState>((set, get) => ({
  // Initial state
  isLoading: false,
  nodes: [],
  diskDictionary: {},
  selectedNode: null,
  selectedPoolId: null,
  error: null,

  // Load VDEV nodes for a pool
  loadNodes: async (poolId) => {
    set({ isLoading: true, error: null, selectedPoolId: poolId });
    try {
      const pool = await poolService.query([['id', '=', poolId]]);
      if (pool.length > 0) {
        const topology = pool[0].topology || [];
        const diskDictionary: Record<string, TopologyDisk> = {};

        // Flatten disks into dictionary
        function traverse(items: VDevItem[]) {
          items.forEach(item => {
            if (item.type === VDevType.Disk) {
              diskDictionary[item.guid] = item as TopologyDisk;
            } else if (item.children) {
              traverse(item.children);
            }
          });
        }
        traverse(topology);

        set({
          isLoading: false,
          nodes: topology,
          diskDictionary,
        });
      }
    } catch (error) {
      set({ isLoading: false, error: String(error) });
    }
  },

  // Select node
  selectNode: (node) => {
    set({ selectedNode: node });
  },

  // Select pool
  selectPool: (poolId) => {
    set({ selectedPoolId: poolId });
  },
}));
