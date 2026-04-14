/**
 * Breadcrumb component
 * Navigation breadcrumb for file paths
 */

import React from 'react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
  const parts = path.split('/').filter(Boolean);

  const handleClick = (index: number) => {
    const targetPath = '/' + parts.slice(0, index + 1).join('/');
    onNavigate(targetPath);
  };

  return (
    <div style={styles.container}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span style={styles.separator}>/</span>}
          <button
            style={styles.part}
            onClick={() => handleClick(index)}
          >
            {index === 0 ? '📁' : ''} {part}
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
    padding: '8px 16px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
    overflow: 'auto',
  },
  part: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#333',
    fontSize: '14px',
    transition: 'background-color 0.15s',
  },
  separator: {
    color: '#999',
    margin: '0 2px',
  },
};

export default Breadcrumb;
