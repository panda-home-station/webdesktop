/**
 * Disk Filters Component
 * Filter controls for disk list
 */

import React from 'react';

interface DiskFiltersProps {
  filters: {
    type: string;
    pool: string;
    showAvailable: boolean;
  };
  pools: string[];
  types: string[];
  onFiltersChange: (filters: {
    type: string;
    pool: string;
    showAvailable: boolean;
  }) => void;
}

export default function DiskFilters({ filters, pools, types, onFiltersChange }: DiskFiltersProps) {
  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type });
  };

  const handlePoolChange = (pool: string) => {
    onFiltersChange({ ...filters, pool });
  };

  const handleAvailableChange = (showAvailable: boolean) => {
    onFiltersChange({ ...filters, showAvailable });
  };

  return (
    <div style={styles.container}>
      {/* Type Filter */}
      <div style={styles.filterGroup}>
        <label style={styles.label} htmlFor="disk-type-filter">
          Disk Type
        </label>
        <select
          id="disk-type-filter"
          value={filters.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          style={styles.select}
        >
          <option value="ALL">All Types</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Pool Filter */}
      <div style={styles.filterGroup}>
        <label style={styles.label} htmlFor="disk-pool-filter">
          Pool
        </label>
        <select
          id="disk-pool-filter"
          value={filters.pool}
          onChange={(e) => handlePoolChange(e.target.value)}
          style={styles.select}
        >
          <option value="ALL">All Pools</option>
          {pools.map((pool) => (
            <option key={pool} value={pool}>{pool}</option>
          ))}
        </select>
      </div>

      {/* Available Only Toggle */}
      <div style={styles.toggleGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={filters.showAvailable}
            onChange={(e) => handleAvailableChange(e.target.checked)}
            style={styles.checkbox}
          />
          Available Only
        </label>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: 1,
  } as React.CSSProperties,
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: 'white',
    ':focus': {
      borderColor: '#1976d2',
    },
  } as React.CSSProperties,
  toggleGroup: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 0',
  } as React.CSSProperties,
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
  } as React.CSSProperties,
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  } as React.CSSProperties,
};
