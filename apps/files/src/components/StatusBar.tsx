/**
 * StatusBar component
 * Shows file count and disk space info - Neo-Frost glass design
 */

import React from 'react';
import { formatBytes } from '../utils/formatters';
import { HardDrive, CheckCircle2 } from 'lucide-react';

interface StatusBarProps {
  totalCount: number;
  selectedCount: number;
  filesystemStats: {
    total_bytes: number;
    free_bytes: number;
    avail_bytes: number;
  } | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  totalCount,
  selectedCount,
  filesystemStats,
}) => {
  // Calculate usage percentage
  const usagePercent = filesystemStats
    ? Math.round((1 - filesystemStats.free_bytes / filesystemStats.total_bytes) * 100)
    : 0;

  return (
    <div className="files-glass" style={styles.container}>
      <div style={styles.left}>
        {selectedCount > 0 ? (
          <div style={styles.selectedInfo}>
            <CheckCircle2 size={13} style={styles.selectedIcon} />
            <span style={styles.selectedText}>
              已选择 {selectedCount} 个项目
            </span>
          </div>
        ) : (
          <div style={styles.countInfo}>
            <span style={styles.countText}>
              {totalCount} 个项目
            </span>
          </div>
        )}
      </div>

      <div style={styles.right}>
        {filesystemStats && (
          <div style={styles.diskInfo}>
            {/* Disk usage indicator */}
            <div style={styles.usageContainer}>
              <HardDrive size={12} style={styles.diskIcon} />
              <div style={styles.usageBar}>
                <div
                  style={{
                    ...styles.usageFill,
                    width: `${usagePercent}%`,
                    ...(usagePercent > 90
                      ? styles.usageDanger
                      : usagePercent > 75
                        ? styles.usageWarning
                        : styles.usageNormal),
                  }}
                />
              </div>
              <span style={styles.usageText}>{usagePercent}%</span>
            </div>

            <span style={styles.separator}>·</span>

            {/* Space info */}
            <div style={styles.spaceInfo}>
              <span style={styles.spaceText}>
                可用: <strong>{formatBytes(filesystemStats.avail_bytes)}</strong>
              </span>
              <span style={styles.separator}>·</span>
              <span style={styles.spaceText}>
                总计: {formatBytes(filesystemStats.total_bytes)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--files-space-4)',
    height: 'var(--files-statusbar-height)',
    fontSize: '11px',
    borderRadius: 0,
    borderTop: '1px solid var(--files-divider)',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    boxSizing: 'border-box',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  selectedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-2)',
  },
  selectedIcon: {
    color: 'var(--files-primary)',
  },
  selectedText: {
    color: 'var(--files-primary)',
    fontWeight: 500,
  },
  countInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  countText: {
    color: 'var(--files-text-muted)',
  },
  diskInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
  },
  usageContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-2)',
  },
  diskIcon: {
    color: 'var(--files-text-muted)',
  },
  usageBar: {
    width: '40px',
    height: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width var(--files-transition-smooth)',
  },
  usageNormal: {
    backgroundColor: 'var(--files-success)',
  },
  usageWarning: {
    backgroundColor: 'var(--files-warning)',
  },
  usageDanger: {
    backgroundColor: 'var(--files-danger)',
  },
  usageText: {
    fontSize: '10px',
    color: 'var(--files-text-muted)',
    fontFamily: '"SF Mono", monospace',
    minWidth: '28px',
  },
  spaceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-2)',
  },
  spaceText: {
    color: 'var(--files-text-muted)',
  },
  separator: {
    color: 'var(--files-divider)',
    margin: '0 2px',
  },
};

export default StatusBar;