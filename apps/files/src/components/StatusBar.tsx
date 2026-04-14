/**
 * StatusBar component
 * Shows file count and disk space info - Apple Finder style
 */

import React from 'react';
import { formatBytes } from '../utils/formatters';

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
  return (
    <div style={styles.container}>
      <div style={styles.left}>
        {selectedCount > 0 ? (
          <span style={styles.selectedText}>
            已选择 {selectedCount} 个项目
          </span>
        ) : (
          <span style={styles.countText}>
            {totalCount} 个项目
          </span>
        )}
      </div>
      <div style={styles.right}>
        {filesystemStats && (
          <>
            <span style={styles.spaceText}>
              可用: {formatBytes(filesystemStats.avail_bytes)}
            </span>
            <span style={styles.separator}>·</span>
            <span style={styles.spaceText}>
              总计: {formatBytes(filesystemStats.total_bytes)}
            </span>
          </>
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
    padding: '8px 16px',
    backgroundColor: '#f5f5f7',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    fontSize: '11px',
    color: '#86868b',
    height: '28px',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  selectedText: {
    color: '#007aff',
  },
  countText: {
    color: '#86868b',
  },
  spaceText: {
    color: '#86868b',
  },
  separator: {
    color: '#c7c7cc',
  },
};

export default StatusBar;