/**
 * Disk Overview Component
 * Main disk management tab showing all disks
 */

import { useState, useMemo } from 'react'
import { Disk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { DiskFilters } from './disks/DiskFilters'
import { DiskTable } from './disks/DiskTable'
import { DiskDetails } from './disks/DiskDetails'
import { formatBytes } from '@truenas/utils/storage.utils'
import { colors } from '../styles/theme'

interface DiskOverviewProps {
  disks: Disk[]
}

export function DiskOverview({ disks }: DiskOverviewProps) {
  const [selectedDisk, setSelectedDisk] = useState<Disk | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DiskType | 'all'>('all')
  const [poolFilter, setPoolFilter] = useState('')

  // Get unique pool names
  const poolNames = useMemo(() => {
    const poolsSet = new Set(disks.map(d => d.pool).filter(Boolean))
    return [...poolsSet] as string[]
  }, [disks])

  // Filter disks
  const filteredDisks = useMemo(() => {
    return disks.filter(disk => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          disk.name.toLowerCase().includes(query) ||
          disk.model?.toLowerCase().includes(query) ||
          disk.serial?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Type filter
      if (typeFilter !== 'all' && disk.type !== typeFilter) {
        return false
      }

      // Pool filter
      if (poolFilter) {
        if (poolFilter === 'unassigned' && disk.pool) {
          return false
        }
        if (poolFilter !== 'unassigned' && disk.pool !== poolFilter) {
          return false
        }
      }

      return true
    })
  }, [disks, searchQuery, typeFilter, poolFilter])

  // Calculate stats
  const stats = useMemo(() => {
    const totalCapacity = disks.reduce((sum, d) => sum + d.size, 0)
    const assignedCapacity = disks.filter(d => d.pool).reduce((sum, d) => sum + d.size, 0)
    const unassignedDisks = disks.filter(d => !d.pool).length

    const typeBreakdown = {
      HDD: disks.filter(d => d.type === DiskType.Hdd).length,
      SSD: disks.filter(d => d.type === DiskType.Ssd).length,
      NVMe: disks.filter(d => d.type === DiskType.Nvme).length,
      USB: disks.filter(d => d.type === DiskType.Usb).length,
    }

    return {
      totalCapacity,
      assignedCapacity,
      unassignedDisks,
      totalDisks: disks.length,
      typeBreakdown,
    }
  }, [disks])

  // If a disk is selected, show its details
  if (selectedDisk) {
    return (
      <DiskDetails
        disk={selectedDisk}
        onBack={() => setSelectedDisk(null)}
      />
    )
  }

  return (
    <div>
      {/* Stats Overview */}
      <div style={styles.statsGrid}>
        <StatCard
          label="Total Disks"
          value={stats.totalDisks.toString()}
          subValue={formatBytes(stats.totalCapacity)}
        />
        <StatCard
          label="Unassigned"
          value={stats.unassignedDisks.toString()}
          subValue="Available for use"
        />
        <StatCard
          label="HDD"
          value={stats.typeBreakdown.HDD.toString()}
        />
        <StatCard
          label="SSD"
          value={stats.typeBreakdown.SSD.toString()}
        />
        <StatCard
          label="NVMe"
          value={stats.typeBreakdown.NVMe.toString()}
        />
      </div>

      {/* Filters */}
      <DiskFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        poolFilter={poolFilter}
        onPoolFilterChange={setPoolFilter}
        pools={poolNames}
      />

      {/* Disk Table */}
      <DiskTable
        disks={filteredDisks}
        onDiskClick={setSelectedDisk}
      />

      {/* Results count */}
      {filteredDisks.length !== disks.length && (
        <div style={styles.resultsCount}>
          Showing {filteredDisks.length} of {disks.length} disks
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  subValue?: string
}

function StatCard({ label, value, subValue }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value}</span>
      {subValue && <span style={styles.statSubValue}>{subValue}</span>}
    </div>
  )
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.text,
  },
  statSubValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultsCount: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
}
