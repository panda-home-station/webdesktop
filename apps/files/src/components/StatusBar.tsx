/**
 * StatusBar component
 * Shows file count and disk space info
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
          <span>已选择 {selectedCount} 个项目</span>
        ) : (
          <span>{totalCount} 个项目</span>
        )}
      </div>
      <div style={styles.right}>
        {filesystemStats && (
          <>
            <span>可用: {formatBytes(filesystemStats.avail_bytes)}</span>
            <span style={styles.separator}>|</span>
            <span>总计: {formatBytes(filesystemStats.total_bytes)}</span>
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
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #e0e0e0',
    fontSize: '12px',
    color: '#666',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  separator: {
    color: '#ddd',
  },
};

export default StatusBar;
