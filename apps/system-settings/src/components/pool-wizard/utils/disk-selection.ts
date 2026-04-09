/**
 * Disk Selection Utilities
 * Automatic disk selection algorithms for pool creation
 */

import { DetailsDisk } from '@truenas/types/disk-types'
import { CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { minDisksPerLayout, isDraidLayout } from '../store/poolWizardStore'

export interface DiskSelectionOptions {
  layout: CreateVdevLayout
  diskSize: number | null
  diskType: DiskType | null
  treatDiskSizeAsMinimum: boolean
  width: number | null
  vdevsNumber: number | null
  draidDataDisks: number | null
  draidSpareDisks: number | null
}

export interface DiskSelectionResult {
  vdevs: DetailsDisk[][]
  unusedDisks: DetailsDisk[]
  suggestedWidth: number
  suggestedVdevsNumber: number
}

/**
 * Group disks by size and type
 */
function groupDisksBySizeAndType(
  disks: DetailsDisk[]
): Map<string, DetailsDisk[]> {
  const groups = new Map<string, DetailsDisk[]>()

  disks.forEach((disk) => {
    const key = `${disk.type}-${disk.size}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(disk)
  })

  return groups
}

/**
 * Filter disks by size and type
 */
function filterDisks(
  disks: DetailsDisk[],
  size: number | null,
  diskType: DiskType | null,
  treatAsMinimum: boolean
): DetailsDisk[] {
  return disks.filter((disk) => {
    const sizeMatch = treatAsMinimum
      ? disk.size >= (size ?? 0)
      : size === null || disk.size === size

    const typeMatch = diskType === null || disk.type === diskType

    return sizeMatch && typeMatch
  })
}

/**
 * Sort disks for allocation (prioritize same-size disks)
 */
function sortDisksForAllocation(disks: DetailsDisk[]): DetailsDisk[] {
  return [...disks].sort((a, b) => {
    // Sort by type first (SSD before HDD)
    if (a.type !== b.type) {
      return a.type === DiskType.Ssd ? -1 : 1
    }
    // Then by size
    return b.size - a.size
  })
}

/**
 * Calculate width options for a layout
 */
export function calculateWidthOptions(
  layout: CreateVdevLayout,
  availableDiskCount: number
): number[] {
  const minDisks = minDisksPerLayout[layout]
  const options: number[] = []

  // For Mirror, only even numbers
  const maxWidth = Math.min(availableDiskCount, 12)

  for (let width = minDisks; width <= maxWidth; width++) {
    if (layout === CreateVdevLayout.Mirror && width % 2 !== 0) {
      continue
    }
    options.push(width)
  }

  return options
}

/**
 * Calculate vdevs number options
 */
export function calculateVdevsOptions(
  width: number,
  availableDiskCount: number,
  isSingleVdev: boolean = false
): number[] {
  const maxVdevs = isSingleVdev ? 1 : Math.floor(availableDiskCount / width)
  const options: number[] = []

  for (let i = 1; i <= maxVdevs; i++) {
    options.push(i)
  }

  return options
}

/**
 * Calculate dRAID children options
 */
export function calculateDraidChildrenOptions(
  dataDevices: number,
  parityDisks: number,
  spareDisks: number,
  availableDiskCount: number
): number[] {
  const minChildren = dataDevices + parityDisks + spareDisks
  const options: number[] = []

  for (let children = minChildren; children <= Math.min(availableDiskCount, 255); children++) {
    options.push(children)
  }

  return options
}

/**
 * Automatic disk selection for non-dRAID layouts
 */
function selectDisksForNonDraid(
  availableDisks: DetailsDisk[],
  options: DiskSelectionOptions
): DiskSelectionResult {
  const minDisks = minDisksPerLayout[options.layout]

  // Filter disks by size and type
  const filteredDisks = filterDisks(
    availableDisks,
    options.diskSize,
    options.diskType,
    options.treatDiskSizeAsMinimum
  )

  // Sort disks for allocation
  const sortedDisks = sortDisksForAllocation(filteredDisks)

  // Calculate width and vdevs number
  let width = options.width ?? minDisks
  let vdevsNumber = options.vdevsNumber ?? 1

  // Adjust if necessary
  if (width > sortedDisks.length) {
    width = Math.max(minDisks, sortedDisks.length)
  }

  if (vdevsNumber * width > sortedDisks.length) {
    vdevsNumber = Math.floor(sortedDisks.length / width)
    if (vdevsNumber < 1) vdevsNumber = 1
  }

  // Allocate disks to vdevs
  const vdevs: DetailsDisk[][] = []
  let diskIndex = 0

  for (let v = 0; v < vdevsNumber; v++) {
    const vdev: DetailsDisk[] = []
    for (let d = 0; d < width && diskIndex < sortedDisks.length; d++) {
      vdev.push(sortedDisks[diskIndex++])
    }
    if (vdev.length === width) {
      vdevs.push(vdev)
    }
  }

  // Remaining disks
  const unusedDisks = sortedDisks.slice(diskIndex)

  return {
    vdevs,
    unusedDisks,
    suggestedWidth: width,
    suggestedVdevsNumber: vdevs.length,
  }
}

/**
 * Automatic disk selection for dRAID layouts
 */
function selectDisksForDraid(
  availableDisks: DetailsDisk[],
  options: DiskSelectionOptions
): DiskSelectionResult {
  const parityMap: Record<string, number> = {
    [CreateVdevLayout.Draid1]: 1,
    [CreateVdevLayout.Draid2]: 2,
    [CreateVdevLayout.Draid3]: 3,
  }
  const parityDisks = parityMap[options.layout] ?? 1

  // Filter disks by size and type
  const filteredDisks = filterDisks(
    availableDisks,
    options.diskSize,
    options.diskType,
    options.treatDiskSizeAsMinimum
  )

  // Sort disks
  const sortedDisks = sortDisksForAllocation(filteredDisks)

  // Calculate dRAID parameters
  const dataDevices = options.draidDataDisks ?? 8
  const spareDevices = options.draidSpareDisks ?? 0
  const childrenPerGroup = dataDevices + parityDisks + spareDevices

  // Calculate number of vdevs we can create
  const maxVdevs = options.vdevsNumber ?? 1
  const disksNeededPerVdev = childrenPerGroup
  const maxPossibleVdevs = Math.floor(sortedDisks.length / disksNeededPerVdev)
  const actualVdevs = Math.min(maxVdevs, maxPossibleVdevs)

  // Allocate disks
  const vdevs: DetailsDisk[][] = []
  let diskIndex = 0

  for (let v = 0; v < actualVdevs; v++) {
    const vdev: DetailsDisk[] = []
    for (let d = 0; d < childrenPerGroup && diskIndex < sortedDisks.length; d++) {
      vdev.push(sortedDisks[diskIndex++])
    }
    if (vdev.length === childrenPerGroup) {
      vdevs.push(vdev)
    }
  }

  // Remaining disks
  const unusedDisks = sortedDisks.slice(diskIndex)

  return {
    vdevs,
    unusedDisks,
    suggestedWidth: childrenPerGroup,
    suggestedVdevsNumber: vdevs.length,
  }
}

/**
 * Main automatic disk selection function
 */
export function automaticDiskSelection(
  availableDisks: DetailsDisk[],
  options: DiskSelectionOptions
): DiskSelectionResult {
  if (availableDisks.length === 0 || !options.layout) {
    return {
      vdevs: [],
      unusedDisks: [],
      suggestedWidth: 0,
      suggestedVdevsNumber: 0,
    }
  }

  if (isDraidLayout(options.layout)) {
    return selectDisksForDraid(availableDisks, options)
  }

  return selectDisksForNonDraid(availableDisks, options)
}

/**
 * Get available disk sizes
 */
export function getAvailableDiskSizes(disks: DetailsDisk[]): number[] {
  const sizes = new Set<number>()
  disks.forEach((disk) => sizes.add(disk.size))
  return Array.from(sizes).sort((a, b) => b - a)
}

/**
 * Get disk type counts
 */
export function getDiskTypeCounts(
  disks: DetailsDisk[]
): Record<DiskType, number> {
  const counts: Record<DiskType, number> = {
    [DiskType.Hdd]: 0,
    [DiskType.Ssd]: 0,
    [DiskType.Nvme]: 0,
    [DiskType.Usb]: 0,
    [DiskType.Hda]: 0,
  }

  disks.forEach((disk) => {
    if (counts[disk.type] !== undefined) {
      counts[disk.type]++
    }
  })

  return counts
}
