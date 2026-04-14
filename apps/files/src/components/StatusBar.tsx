/**
 * StatusBar component
 * Shows file count and selection info - Neo-Frost glass design
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface StatusBarProps {
  totalCount: number;
  selectedCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  totalCount,
  selectedCount,
}) => {
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
};

export default StatusBar;