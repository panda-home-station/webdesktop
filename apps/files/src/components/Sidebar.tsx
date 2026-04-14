/**
 * Sidebar component
 * Location shortcuts like macOS Finder sidebar
 */

import React from 'react';
import {
  Home,
  HardDrive,
  Trash2,
  Star,
  FolderOpen,
  Cloud,
} from 'lucide-react';

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
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  // Determine active item based on current path
  const getActiveItem = () => {
    if (currentPath.startsWith('/mnt')) return 'storage';
    if (currentPath.startsWith('/home')) return 'home';
    if (currentPath.includes('.trash')) return 'trash';
    return 'storage';
  };

  const activeItem = getActiveItem();

  return (
    <div style={styles.container}>
      {/* Favorites Section */}
      <SidebarSection title="个人收藏">
        <SidebarItem
          icon={<Home size={18} />}
          label="家目录"
          path="/home"
          isActive={activeItem === 'home'}
          onClick={() => onNavigate('/home')}
        />
        <SidebarItem
          icon={<Star size={18} />}
          label="收藏夹"
          path="/favorite"
          isActive={activeItem === 'favorite'}
          onClick={() => onNavigate('/home')}
        />
      </SidebarSection>

      {/* Locations Section */}
      <SidebarSection title="位置">
        <SidebarItem
          icon={<HardDrive size={18} />}
          label="存储池"
          path="/mnt"
          isActive={activeItem === 'storage'}
          onClick={() => onNavigate('/mnt')}
        />
        <SidebarItem
          icon={<Cloud size={18} />}
          label="云同步"
          path="/cloud"
          isActive={activeItem === 'cloud'}
          onClick={() => onNavigate('/mnt')}
        />
      </SidebarSection>

      {/* Storage Pools - will be populated dynamically */}
      <SidebarSection title="存储池">
        <SidebarItem
          icon={<FolderOpen size={18} />}
          label="Pool 1"
          path="/mnt/pool1"
          isActive={currentPath.startsWith('/mnt/pool1')}
          onClick={() => onNavigate('/mnt/pool1')}
        />
      </SidebarSection>

      {/* Trash Section */}
      <SidebarSection title="垃圾桶">
        <SidebarItem
          icon={<Trash2 size={18} />}
          label="回收站"
          path="/mnt/.trash"
          isActive={activeItem === 'trash'}
          onClick={() => onNavigate('/mnt/.trash')}
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