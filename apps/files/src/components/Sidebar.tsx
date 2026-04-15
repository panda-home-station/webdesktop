/**
 * Sidebar component
 * Location shortcuts - Neo-Frost glass morphism design
 */

import React, { useState } from 'react';
import {
  Home,
  HardDrive,
  FolderOpen,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import type { Pool } from '@truenas/types/pool';
import type { UserHomeInfo } from '../types/file-manager';

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
      className="files-interactive"
    >
      <span style={{
        ...styles.itemIcon,
        ...(isActive ? styles.itemIconActive : {}),
      }}>
        {icon}
      </span>
      <span style={{
        ...styles.itemLabel,
        ...(isActive ? styles.itemLabelActive : {}),
      }}>
        {label}
      </span>
      {badge && (
        <span style={{
          ...styles.badge,
          ...(isActive ? styles.badgeActive : {}),
        }}>
          {badge}
        </span>
      )}
    </button>
  );
};

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={styles.section}>
      <button
        style={styles.sectionHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        className="files-interactive"
      >
        <span style={styles.sectionTitle}>{title}</span>
        <ChevronDown
          size={12}
          style={{
            ...styles.sectionChevron,
            ...(isExpanded ? {} : styles.sectionChevronCollapsed),
          }}
        />
      </button>
      {isExpanded && (
        <div style={styles.sectionContent} className="files-animate-in">
          {children}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  pools: Pool[];
  onNavigate: (path: string) => void;
  userHome?: UserHomeInfo;
}

export const Sidebar: React.FC<SidebarProps> = ({ pools, onNavigate, userHome }) => {
  const [sidebarSelectedPath, setSidebarSelectedPath] = useState<string>('/mnt');

  // For admin users, don't show home directory - they only see pools
  const showHomeDirectory = userHome && !userHome.isAdmin && userHome.homeAccessible;
  const effectiveUserHome = showHomeDirectory ? userHome.home : '/mnt';

  const getPoolPath = (pool: Pool) => {
    return `/mnt/${pool.name}`;
  };

  const handleSidebarClick = (path: string) => {
    setSidebarSelectedPath(path);
    onNavigate(path);
  };

  const isSelected = (path: string) => {
    return sidebarSelectedPath === path;
  };

  return (
    <div
      className="files-glass files-sidebar"
      style={styles.container}
    >
      {/* Fixed top padding for visual balance */}
      <div style={styles.topSpacer} />

      {/* Locations Section */}
      <SidebarSection title="位置" defaultExpanded={true}>
        {showHomeDirectory && (
          <SidebarItem
            icon={<Home size={18} />}
            label="家目录"
            path={effectiveUserHome}
            isActive={isSelected(effectiveUserHome)}
            onClick={() => handleSidebarClick(effectiveUserHome)}
          />
        )}
        <SidebarItem
          icon={<HardDrive size={18} />}
          label="存储池"
          path="/mnt/"
          isActive={isSelected('/mnt/')}
          onClick={() => handleSidebarClick('/mnt/')}
        />
      </SidebarSection>

      {/* Storage Pools */}
      {pools.length > 0 && (
        <SidebarSection title="存储池" defaultExpanded={true}>
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
      <SidebarSection title="垃圾桶" defaultExpanded={false}>
        <SidebarItem
          icon={<Trash2 size={18} />}
          label="回收站"
          path="/mnt/.trash"
          isActive={isSelected('/mnt/.trash')}
          onClick={() => handleSidebarClick('/mnt/.trash')}
        />
      </SidebarSection>

      {/* Bottom spacer */}
      <div style={styles.bottomSpacer} />

      {/* Version info */}
      <div style={styles.versionInfo}>
        <span>TrueNAS Files</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 'var(--files-sidebar-width)',
    minWidth: 'var(--files-sidebar-min-width)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 0,
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: '1px solid var(--files-divider)',
  },
  topSpacer: {
    height: 'var(--files-space-4)',
  },
  section: {
    marginBottom: 'var(--files-space-2)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 'var(--files-space-2) var(--files-space-4)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--files-text-muted)',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: 'inherit',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
  },
  sectionChevron: {
    transition: 'transform var(--files-transition-base)',
  },
  sectionChevronCollapsed: {
    transform: 'rotate(-90deg)',
  },
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 var(--files-space-3)',
    gap: '2px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--files-space-3)',
    padding: 'var(--files-space-2) var(--files-space-3)',
    borderRadius: 'var(--files-radius-md)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--files-text-secondary)',
    textAlign: 'left',
    width: '100%',
    transition: 'all var(--files-transition-base)',
    fontFamily: 'inherit',
  },
  itemActive: {
    backgroundColor: 'var(--files-primary-light)',
    color: 'var(--files-primary)',
  },
  itemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--files-text-muted)',
    transition: 'all var(--files-transition-base)',
    flexShrink: 0,
  },
  itemIconActive: {
    color: 'var(--files-primary)',
  },
  itemLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'color var(--files-transition-base)',
  },
  itemLabelActive: {
    fontWeight: 500,
  },
  badge: {
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    color: 'var(--files-text-muted)',
    fontWeight: 500,
    transition: 'all var(--files-transition-base)',
  },
  badgeActive: {
    backgroundColor: 'var(--files-primary)',
    color: '#fff',
  },
  bottomSpacer: {
    flex: 1,
  },
  versionInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'var(--files-statusbar-height)',
    padding: '0 var(--files-space-4)',
    fontSize: '10px',
    color: 'var(--files-text-disabled)',
    borderTop: '1px solid var(--files-divider)',
    boxSizing: 'border-box',
  },
};

export default Sidebar;