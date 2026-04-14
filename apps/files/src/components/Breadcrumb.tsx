/**
 * Breadcrumb component
 * Navigation breadcrumb for file paths - Apple Finder style
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
  const parts = path.split('/').filter(Boolean);

  const getIcon = (index: number) => {
    if (index === 0) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    }
    return null;
  };

  const handleClick = (index: number) => {
    const targetPath = '/' + parts.slice(0, index + 1).join('/');
    onNavigate(targetPath);
  };

  return (
    <div style={styles.container}>
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
            <span style={styles.icon}>{getIcon(index)}</span>
            <span>{part}</span>
          </button>
        </React.Fragment>
      ))}
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
  icon: {
    display: 'flex',
    alignItems: 'center',
    color: '#007aff',
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