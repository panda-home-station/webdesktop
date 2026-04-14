/**
 * Breadcrumb component
 * Navigation breadcrumb for file paths - Apple Finder style
 */

import React from 'react';
import { ChevronRight, Folder } from 'lucide-react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
  const parts = path.split('/').filter(Boolean);
  const currentName = parts[parts.length - 1] || 'root';

  const handleClick = (index: number) => {
    const targetPath = '/' + parts.slice(0, index + 1).join('/');
    onNavigate(targetPath);
  };

  return (
    <div style={styles.container}>
      {/* Current Location */}
      <div style={styles.currentLocation}>
        <Folder size={18} strokeWidth={1.5} style={styles.currentIcon} />
        <span style={styles.currentName}>{currentName}</span>
      </div>

      {/* Path Breadcrumbs */}
      {parts.length > 1 && (
        <div style={styles.breadcrumbPath}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight
                  size={14}
                  style={styles.separator}
                  strokeWidth={2}
                />
              )}
              <button
                style={{
                  ...styles.part,
                  ...(index === parts.length - 1 ? styles.partActive : {}),
                }}
                onClick={() => handleClick(index)}
              >
                <span>{part}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#f5f5f7',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    fontSize: '13px',
    overflow: 'auto',
    gap: '12px',
  },
  currentLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: '6px',
  },
  currentIcon: {
    color: '#007aff',
  },
  currentName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1d1d1f',
  },
  breadcrumbPath: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  part: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#007aff',
    fontSize: '13px',
    transition: 'background-color 0.15s ease',
  },
  partActive: {
    color: '#1d1d1f',
    cursor: 'default',
  },
  separator: {
    color: '#c7c7cc',
    flexShrink: 0,
  },
};

// Add hover styles via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  button[style*="cursor: pointer"]:hover {
    background-color: rgba(0, 122, 255, 0.1);
  }
`;
if (document.head) {
  document.head.appendChild(styleSheet);
}

export default Breadcrumb;