/**
 * Topology Utilities
 * Functions for converting topology to API payload
 */

import { CreateVdevLayout, VDevType } from '@truenas/types/vdev-enum-types'
import { UpdatePoolTopology, DataPoolTopologyUpdate } from '@truenas/types/pool'
import { PoolWizardTopologyCategory, isDraidLayout } from '../store/poolWizardStore'

/**
 * Convert topology state to API payload
 */
export function topologyToPayload(topology: Record<VDevType, PoolWizardTopologyCategory>): UpdatePoolTopology {
  const payload: UpdatePoolTopology = {}

  Object.entries(topology).forEach(([vdevType, category]) => {
    // Skip empty categories
    if (!category.vdevs || category.vdevs.length === 0) {
      return
    }

    // Handle spare - it's a flat list of disk names
    if (vdevType === VDevType.Spare) {
      payload.spares = category.vdevs.flatMap((vdev) =>
        vdev.map((disk) => disk.devname)
      )
      return
    }

    // Handle other vdev types
    const vdevEntries: DataPoolTopologyUpdate[] = category.vdevs.map((vdev) => {
      const entry: DataPoolTopologyUpdate = {
        type: category.layout!,
        disks: vdev.map((disk) => disk.devname),
      }

      // Add dRAID specific fields
      if (isDraidLayout(category.layout)) {
        entry.draid_data_disks = category.draidDataDisks ?? undefined
        entry.draid_spare_disks = category.draidSpareDisks ?? undefined
      }

      return entry
    })

    // Map VDevType to payload key
    switch (vdevType) {
      case VDevType.Data:
        payload.data = vdevEntries
        break
      case VDevType.Log:
        payload.log = vdevEntries
        break
      case VDevType.Special:
        payload.special = vdevEntries
        break
      case VDevType.Dedup:
        payload.dedup = vdevEntries
        break
      case VDevType.Cache:
        payload.cache = vdevEntries
        break
    }
  })

  return payload
}

/**
 * Get total disk count from topology
 */
export function getTotalDiskCount(topology: Record<VDevType, PoolWizardTopologyCategory>): number {
  let count = 0
  Object.values(topology).forEach((category) => {
    category.vdevs.forEach((vdev) => {
      count += vdev.length
    })
  })
  return count
}

/**
 * Check if topology is empty
 */
export function isTopologyEmpty(topology: Record<VDevType, PoolWizardTopologyCategory>): boolean {
  return Object.values(topology).every((category) => category.vdevs.length === 0)
}

/**
 * Get non-empty topology categories
 */
export function getNonEmptyCategories(
  topology: Record<VDevType, PoolWizardTopologyCategory>
): Array<{ type: VDevType; category: PoolWizardTopologyCategory }> {
  return Object.entries(topology)
    .filter(([, category]) => category.vdevs.length > 0)
    .map(([type, category]) => ({ type: type as VDevType, category }))
}

/**
 * Calculate estimated pool capacity (simplified)
 */
export function estimatePoolCapacity(
  topology: Record<VDevType, PoolWizardTopologyCategory>
): number {
  let totalCapacity = 0

  Object.entries(topology).forEach(([vdevType, category]) => {
    if (vdevType === VDevType.Spare || category.vdevs.length === 0) {
      return
    }

    let categoryCapacity = 0
    category.vdevs.forEach((vdev) => {
      // Sum disk sizes
      const vdevCapacity = vdev.reduce((sum, disk) => sum + disk.size, 0)
      categoryCapacity += vdevCapacity
    })

    // Apply redundancy factor
    if (category.layout === CreateVdevLayout.Mirror) {
      categoryCapacity = categoryCapacity / 2
    } else if (category.layout?.startsWith('RAIDZ')) {
      const parityCount = category.layout === 'RAIDZ1' ? 1 : category.layout === 'RAIDZ2' ? 2 : 3
      categoryCapacity = categoryCapacity * (vdev[0]?.size ? (vdev[0].size - parityCount * vdev[0].size / vdev.length) / vdev[0].size : 0.7)
    }

    totalCapacity += categoryCapacity
  })

  return totalCapacity
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Check if a category has valid configuration
 */
export function isCategoryValid(
  type: VDevType,
  category: PoolWizardTopologyCategory
): boolean {
  // Data is always required
  if (type === VDevType.Data) {
    return category.layout !== null && category.vdevs.length > 0
  }

  // Optional categories are valid if they have no layout or no vdevs
  if (!category.layout || category.vdevs.length === 0) {
    return true
  }

  // If they have a layout, they should have vdevs
  return category.vdevs.length > 0
}
