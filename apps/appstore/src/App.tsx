/**
 * App Store Application
 * Docker Apps management interface for WebDesktop
 * Semi Design inspired sidebar navigation
 */

import { useEffect, useState, CSSProperties } from 'react';
import { InstalledApps } from './components/InstalledApps';
import { AvailableApps } from './components/AvailableApps';
import { useDockerStore } from '@truenas/stores/docker';
import { useAppsStore } from '@truenas/stores/apps';
import { openApp } from '@shared/sdk/desktop';
import {
  LayoutGrid,
  PanelTopOpen,
  Clapperboard,
  Container,
  Settings,
} from 'lucide-react';

type CategoryType = 'all' | 'installed' | 'media' | 'photo' | 'download' | 'backup' | 'dev' | 'tools' | 'life' | 'game' | 'driver';

interface NavItemProps {
  item: { id: CategoryType; label: string; icon: React.ReactNode };
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: isActive ? '#e5e7eb' : isHovered ? '#f3f4f6' : 'transparent',
    color: isActive ? '#111827' : isHovered ? '#374151' : '#374151',
    fontWeight: isActive ? 500 : 400,
    fontSize: 14,
  };

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        opacity: isActive ? 1 : 0.7,
      }}>
        {item.icon}
      </span>
      <span style={{ height: 24, display: 'flex', alignItems: 'center', flex: 1 }}>
        {item.label}
      </span>
    </div>
  );
}

export default function AppStore() {
  const { initialize: initDocker, status: dockerStatus, config: dockerConfig } = useDockerStore();
  const { subscribeToChanges } = useAppsStore();
  const [activeTab, setActiveTab] = useState<CategoryType>('installed');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    initDocker();
    const unsubscribe = subscribeToChanges();
    return () => {
      unsubscribe();
    };
  }, [initDocker, subscribeToChanges]);

  const categories = [
    { id: 'all' as CategoryType, label: '全部', icon: <LayoutGrid size={16} /> },
    { id: 'installed' as CategoryType, label: '已安装', icon: <PanelTopOpen size={16} /> },
  ];

  const categoryGroups = [
    { label: '分类', items: [
      { id: 'media' as CategoryType, label: '影音娱乐', icon: <Clapperboard size={16} /> },
    ]},
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        {/* Search */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M11 4a7 7 0 100 14 7 7 0 000-14zm-9 7a9 9 0 1116.032 5.618l3.675 3.675a1 1 0 01-1.414 1.414l-3.675-3.675A9 9 0 012 11z"/>
            </svg>
            <input
              type="text"
              placeholder="搜索"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {categories.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}

          {categoryGroups.map((group) => (
            <div key={group.label}>
              <div style={styles.categoryLabel}>{group.label}</div>
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Docker Status */}
        <div style={styles.dockerStatusBar}>
          <Container size={16} color="#1D63ED" />
          <span style={styles.dockerLabel}>Docker</span>
          <span style={{
            ...styles.dockerValue,
            color: dockerStatus.status === 'RUNNING' ? '#10b981' : '#ef4444',
          }}>
            {dockerStatus.status === 'RUNNING' ? '运行中' : '已停止'}
          </span>
          <div style={{
            ...styles.statusDot,
            backgroundColor: dockerStatus.status === 'RUNNING' ? '#10b981' : '#ef4444',
          }} />
          <button
            onClick={() => openApp('docker')}
            style={styles.dockerSettingsBtn}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.contentHeader}>
          <h1 style={styles.viewTitle}>
            {activeTab === 'installed' ? '已安装的应用' : activeTab === 'all' ? '全部应用' : '分类应用'}
          </h1>
          <p style={styles.viewSubtitle}>
            {activeTab === 'installed'
              ? '管理已安装的应用程序'
              : activeTab === 'all' ? '浏览所有可用应用' : '浏览该分类下的应用'}
          </p>
        </div>
        <div style={styles.contentBody}>
          <InstalledApps />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  // Sidebar - Settings 风格
  sidebar: {
    width: 220,
    flexShrink: 0,
    backgroundColor: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  // Search
  searchContainer: {
    padding: '12px 10px',
    borderBottom: '1px solid #e5e7eb',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '0 10px',
    transition: 'border-color 0.2s',
  },
  searchIcon: {
    color: '#9ca3af',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    padding: '8px',
    fontSize: 14,
    outline: 'none',
    color: '#374151',
  },
  // Navigation
  nav: {
    flex: 1,
    padding: '8px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
    width: '100%',
  },
  navItemHover: {
    backgroundColor: '#f3f4f6',
  },
  navItemActive: {
    backgroundColor: '#e5e7eb',
  },
  navIcon: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    opacity: 0.7,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: 400,
    flex: 1,
    color: '#374151',
  },
  categoryLabel: {
    padding: '12px 12px 6px',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 700,
  },
  // Docker Status Bar
  dockerStatusBar: {
    padding: '12px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
  },
  dockerLabel: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: 500,
  },
  dockerValue: {
    fontSize: 12,
    fontWeight: 600,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  dockerSettingsBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 4,
    color: '#6b7280',
    transition: 'all 0.2s',
  },
  // Main Content
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  contentHeader: {
    padding: '28px 32px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: 600,
    color: '#0f172a',
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  },
  viewSubtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  contentBody: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};