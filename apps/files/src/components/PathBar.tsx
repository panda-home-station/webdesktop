/**
 * PathBar component
 * Windows Explorer-style path bar with clickable segments
 */

import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface PathBarProps {
  path: string;
  onNavigate: (path: string) => void;
}

export const PathBar: React.FC<PathBarProps> = ({ path, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Parse path into segments
  const pathParts = path.split('/').filter(Boolean);

  const handleSegmentClick = (index: number) => {
    const targetPath = '/' + pathParts.slice(0, index + 1).join('/');
    onNavigate(targetPath);
  };

  // Scroll to end on mount/path change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [path]);

  return (
    <div style={styles.container}>
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
              >
                <span style={styles.segmentText}>{part}</span>
              </button>

              {/* Chevron Separator */}
              {!isLast && (
                <ChevronRight
                  size={12}
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
    height: '28px',
    backgroundColor: '#fff',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderRadius: '6px',
    padding: '0 4px',
    overflow: 'hidden',
  },
  pathWrapper: {
    display: 'flex',
    alignItems: 'center',
    overflowX: 'auto',
    overflowY: 'hidden',
    gap: '2px',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
  },
  segment: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 6px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#333',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.1s ease',
    flexShrink: 0,
  },
  segmentCurrent: {
    cursor: 'default',
    fontWeight: 500,
    color: '#1d1d1f',
  },
  segmentHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  segmentText: {
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chevron: {
    color: '#999',
    flexShrink: 0,
  },
};

// Add scrollbar styling via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .path-bar-scroll::-webkit-scrollbar {
    height: 4px;
  }
  .path-bar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .path-bar-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
  }
  .path-bar-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
  }
`;
if (document.head && !document.head.querySelector('.path-bar-scroll-style')) {
  styleSheet.className = 'path-bar-scroll-style';
  document.head.appendChild(styleSheet);
}

export default PathBar;