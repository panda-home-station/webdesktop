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
      categoryCapacity += calculateVdevUsableCapacity(vdev, category.layout)
    })

    totalCapacity += categoryCapacity
  })

  return totalCapacity
}

/**
 * Calculate usable capacity for a single vdev based on its layout
 * - Mirror: returns the smallest disk's size
 * - RAIDZ: returns (smallest disk size) * (disk count - parity)
 * - Stripe/DRAID: returns sum of all disk sizes minus parity overhead
 */
export function calculateVdevUsableCapacity(
  disks: { size: number }[],
  layout: CreateVdevLayout | null
): number {
  if (disks.length === 0 || !layout) return 0

  const smallestDisk = disks.reduce((min, disk) =>
    disk.size < min.size ? disk : min, disks[0])

  if (!smallestDisk) return 0

  const diskCount = disks.length
  const totalSize = disks.reduce((sum, d) => sum + d.size, 0)

  switch (layout) {
    case CreateVdevLayout.Stripe:
      return totalSize
    case CreateVdevLayout.Mirror:
      // Mirror: usable = smallest disk size (all disks store identical data)
      return smallestDisk.size
    case CreateVdevLayout.Raidz1:
      return smallestDisk.size * (diskCount - 1)
    case CreateVdevLayout.Raidz2:
      return smallestDisk.size * (diskCount - 2)
    case CreateVdevLayout.Raidz3:
      return smallestDisk.size * (diskCount - 3)
    case CreateVdevLayout.Draid1:
      return smallestDisk.size * (diskCount - 1)
    case CreateVdevLayout.Draid2:
      return smallestDisk.size * (diskCount - 2)
    case CreateVdevLayout.Draid3:
      return smallestDisk.size * (diskCount - 3)
    default:
      return totalSize
  }
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
