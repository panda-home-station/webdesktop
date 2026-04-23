/**
 * Disk Filters Component
 * Filter controls for disk list
 */

import { DiskType } from '@truenas/types/disk-type-enum-types'
import { SearchInput } from '../shared/SearchInput'
import { colors } from '../../styles/theme'

interface DiskFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  typeFilter: DiskType | 'all'
  onTypeFilterChange: (type: DiskType | 'all') => void
  poolFilter: string
  onPoolFilterChange: (pool: string) => void
  pools: string[]
}

export function DiskFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  poolFilter,
  onPoolFilterChange,
  pools,
}: DiskFiltersProps) {
  return (
    <div style={styles.container}>
      <SearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="搜索磁盘..."
        style={styles.search}
      />

      <div style={styles.filters}>
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as DiskType | 'all')}
          style={styles.select}
        >
          <option value="all">所有类型</option>
          <option value={DiskType.Hdd}>HDD</option>
          <option value={DiskType.Ssd}>SSD</option>
          <option value={DiskType.Nvme}>NVMe</option>
          <option value={DiskType.Usb}>USB</option>
        </select>

        <select
          value={poolFilter}
          onChange={(e) => onPoolFilterChange(e.target.value)}
          style={styles.select}
        >
          <option value="">所有存储池</option>
          <option value="unassigned">未分配</option>
          {pools.map((pool) => (
            <option key={pool} value={pool}>
              {pool}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap' as const,
  },
  search: {
    flex: 1,
    minWidth: 200,
  } as React.CSSProperties,
  filters: {
    display: 'flex',
    gap: 12,
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.cardBg,
    fontSize: 14,
    color: colors.text,
    cursor: 'pointer',
    outline: 'none',
  } as React.CSSProperties,
}
