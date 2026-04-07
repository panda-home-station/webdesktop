/**
 * Topology Utility Functions
 * VDEV topology operations
 */

import { VDevItem, TopologyDisk } from '../types/storage-types';
import { TopologyItemType } from '../types/vdev-enum-types';

// Check if item is a topology disk
export function isTopologyDisk(item: VDevItem): item is TopologyDisk {
  return item.type === TopologyItemType.Disk;
}

// Convert topology to flat disk list
export function topologyToDisks(topology: VDevItem[]): TopologyDisk[] {
  const disks: TopologyDisk[] = [];

  function traverse(item: VDevItem) {
    if (isTopologyDisk(item)) {
      disks.push(item);
    } else if (item.children) {
      item.children.forEach(traverse);
    }
  }

  topology.forEach(traverse);
  return disks;
}

// Convert topology to payload for API calls
export function topologyToPayload(topology: VDevItem[]): unknown {
  // This would need to be implemented based on the API requirements
  return topology;
}
