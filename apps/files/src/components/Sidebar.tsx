/**
 * Sidebar component
 * Location shortcuts like macOS Finder sidebar
 * Selection is controlled by user clicks only, not by current path changes
 */

import React, { useState } from 'react';
import {
  Home,
  HardDrive,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import type { Pool } from '@truenas/types/pool';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
  badge,
}) => {
  return (
    <button
      style={{
        ...styles.item,
        ...(isActive ? styles.itemActive : {}),
      }}
      onClick={onClick}
    >
      <span style={styles.itemIcon}>{icon}</span>
      <span style={styles.itemLabel}>{label}</span>
      {badge && <span style={styles.badge}>{badge}</span>}
    </button>
  );
};

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.sectionContent}>{children}</div>
    </div>
  );
};

interface SidebarProps {
  pools: Pool[];
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ pools, onNavigate }) => {
  // Track the last sidebar-clicked path
  // This is separate from currentPath so sidebar selection doesn't change
  // when user navigates via double-click or other methods
  const [sidebarSelectedPath, setSidebarSelectedPath] = useState<string>('/mnt');

  // Get pool mount point path
  const getPoolPath = (pool: Pool) => {
    return `/mnt/${pool.name}`;
  };

  // Handle sidebar item click - navigate and update selection
  const handleSidebarClick = (path: string) => {
    setSidebarSelectedPath(path);
    onNavigate(path);
  };

  // Check if a path is the currently selected sidebar item
  const isSelected = (path: string) => {
    return sidebarSelectedPath === path;
  };

  return (
    <div style={styles.container}>
      {/* Locations Section */}
      <SidebarSection title="位置">
        <SidebarItem
          icon={<Home size={18} />}
          label="家目录"
          path="/home"
          isActive={isSelected('/home')}
          onClick={() => handleSidebarClick('/home')}
        />
        <SidebarItem
          icon={<HardDrive size={18} />}
          label="存储池"
          path="/mnt"
          isActive={isSelected('/mnt')}
          onClick={() => handleSidebarClick('/mnt')}
        />
      </SidebarSection>

      {/* Storage Pools */}
      {pools.length > 0 && (
        <SidebarSection title="存储池">
          {pools.map((pool) => (
            <SidebarItem
              key={pool.id}
              icon={<FolderOpen size={18} />}
              label={pool.name}
              path={getPoolPath(pool)}
              isActive={isSelected(getPoolPath(pool))}
              onClick={() => handleSidebarClick(getPoolPath(pool))}
            />
          ))}
        </SidebarSection>
      )}

      {/* Trash Section */}
      <SidebarSection title="垃圾桶">
        <SidebarItem
          icon={<Trash2 size={18} />}
          label="回收站"
          path="/mnt/.trash"
          isActive={isSelected('/mnt/.trash')}
          onClick={() => handleSidebarClick('/mnt/.trash')}
        />
      </SidebarSection>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '220px',
    minWidth: '220px',
    height: '100%',
    backgroundColor: 'rgba(245, 245, 247, 0.95)',
    borderRight: '1px solid rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  section: {
    marginBottom: '8px',
  },
  sectionTitle: {
    padding: '8px 16px 4px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#1d1d1f',
    textAlign: 'left',
    width: '100%',
    transition: 'background-color 0.15s ease',
  },
  itemActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    color: '#007aff',
  },
  itemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  itemLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    color: '#86868b',
  },
};

export default Sidebar;