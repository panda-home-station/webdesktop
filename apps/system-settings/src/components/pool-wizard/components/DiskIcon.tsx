/**
 * Disk Icon Component
 * Uses lucide-react HardDrive icon
 */

import { HardDrive } from 'lucide-react'
import { DetailsDisk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'

interface DiskIconProps {
  disk: DetailsDisk
  width?: number
  height?: number
}

export function DiskIcon({ disk, width = 48, height = 48 }: DiskIconProps) {
  const getColors = () => {
    switch (disk.type) {
      case DiskType.Nvme:
        return '#f57c00'
      case DiskType.Ssd:
        return '#388e3c'
      case DiskType.Hdd:
      default:
        return '#1976d2'
    }
  }

  return (
    <HardDrive
      size={Math.min(width, height)}
      color={getColors()}
      strokeWidth={1.5}
    />
  )
}

/**
 * Compact Disk Icon for inline use
 */
export function CompactDiskIcon({
  disk,
  size = 24,
}: {
  disk: DetailsDisk
  size?: number
}) {
  const getColors = () => {
    switch (disk.type) {
      case DiskType.Nvme:
        return '#f57c00'
      case DiskType.Ssd:
        return '#388e3c'
      case DiskType.Hdd:
      default:
        return '#1976d2'
    }
  }

  return (
    <HardDrive
      size={size}
      color={getColors()}
      strokeWidth={1.5}
    />
  )
}
