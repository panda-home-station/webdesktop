/**
 * PathBar component
 * Windows Explorer-style path bar with Neo-Frost refined design
 */

import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';

interface PathBarProps {
  path: string;
  onNavigate: (path: string) => void;
}

export const PathBar: React.FC<PathBarProps> = ({ path, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const pathParts = path.split('/').filter(Boolean);

  const handleSegmentClick = (index: number) => {
    const targetPath = '/' + pathParts.slice(0, index + 1).join('/');
    onNavigate(targetPath);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [path]);

  return (
    <div style={styles.container}>
      {/* Root indicator */}
      <div style={styles.rootIcon}>
        <Folder size={14} />
      </div>

      <div
        ref={containerRef}
        style={styles.pathWrapper}
        className="path-bar-scroll"
      >
        {pathParts.map((part, index) => {
          const isLast = index === pathParts.length - 1;
          const isHovered = hoveredIndex === index;

          return (
            <React.Fragment key={index}>
              {/* Path Segment */}
              <button
                style={{
                  ...styles.segment,
                  ...(isLast ? styles.segmentCurrent : {}),
                  ...(isHovered && !isLast ? styles.segmentHover : {}),
                }}
                onClick={() => !isLast && handleSegmentClick(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                disabled={isLast}
                title={part}
                className="files-interactive"
              >
                <span style={styles.segmentText}>{part}</span>
              </button>

              {/* Chevron Separator */}
              {!isLast && (
                <ChevronRight
                  size={13}
                  style={styles.chevron}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    height: '34px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: 'var(--files-radius-md)',
    padding: '0 var(--files-space-2)',
    overflow: 'hidden',
    transition: 'all var(--files-transition-base)',
  },
  rootIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--files-text-muted)',
    marginRight: 'var(--files-space-2)',
    flexShrink: 0,
  },
  pathWrapper: {
    display: 'flex',
    alignItems: 'center',
    overflowX: 'hidden',
    overflowY: 'hidden',
    gap: '3px',
    scrollBehavior: 'smooth',
  },
  segment: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: 'var(--files-radius-sm)',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--files-text-secondary)',
    whiteSpace: 'nowrap',
    transition: 'all var(--files-transition-fast)',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  segmentCurrent: {
    cursor: 'default',
    fontWeight: 500,
    color: 'var(--files-text-primary)',
  },
  segmentHover: {
    backgroundColor: 'var(--files-primary-light)',
    color: 'var(--files-primary)',
  },
  segmentText: {
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chevron: {
    color: 'var(--files-text-disabled)',
    flexShrink: 0,
  },
};

// Add scrollbar styling via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .path-bar-scroll::-webkit-scrollbar {
    display: none;
  }
  .path-bar-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
if (document.head && !document.head.querySelector('.path-bar-scroll-style')) {
  styleSheet.className = 'path-bar-scroll-style';
  document.head.appendChild(styleSheet);
}

export default PathBar;