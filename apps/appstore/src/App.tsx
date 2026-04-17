/**
 * App Store Application
 * Apple-inspired design with SF Pro aesthetics
 */

import { useEffect, useState } from 'react';
import { InstalledApps } from './components/InstalledApps';
import { AvailableApps } from './components/AvailableApps';
import { useDockerStore } from '@truenas/stores/docker';
import { useAppsStore } from '@truenas/stores/apps';
import { openApp } from '@shared/sdk/desktop';
import {
  LayoutGrid,
  PanelTopOpen,
  Container,
  Settings,
  Monitor,
  Shield,
  Database,
  Gamepad2,
  Home,
  Briefcase,
  Brain,
  Network,
  FolderSync,
  Camera,
  Gauge,
  Wallet,
  Lock,
  HardDrive,
} from 'lucide-react';

type CategoryType = 'all' | 'installed' | string;

interface NavItemProps {
  item: { id: CategoryType; label: string; icon: React.ReactNode };
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        ...(isActive ? styles.navItemActive : {}),
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <span style={{
        ...styles.navItemIcon,
        color: isActive ? '#0071e3' : '#86868b',
      }}>
        {item.icon}
      </span>
      <span style={{
        ...styles.navItemLabel,
        color: isActive ? '#1d1d1f' : '#1d1d1f',
        fontWeight: isActive ? 600 : 500,
      }}>
        {item.label}
      </span>
    </button>
  );
}

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  ai: <Brain size={16} />,
  authentication: <Lock size={16} />,
  backup: <FolderSync size={16} />,
  cameras: <Camera size={16} />,
  custom: <Settings size={16} />,
  database: <Database size={16} />,
  development: <Monitor size={16} />,
  financial: <Wallet size={16} />,
  games: <Gamepad2 size={16} />,
  health: <Gauge size={16} />,
  'home-automation': <Home size={16} />,
  management: <Briefcase size={16} />,
  media: <Monitor size={16} />,
  monitoring: <Gauge size={16} />,
  networking: <Network size={16} />,
  productivity: <Briefcase size={16} />,
  security: <Shield size={16} />,
  storage: <HardDrive size={16} />,
};

// Category label mapping (English -> Chinese)
const categoryLabels: Record<string, string> = {
  ai: '人工智能',
  authentication: '身份认证',
  backup: '备份',
  cameras: '摄像头',
  custom: '自定义',
  database: '数据库',
  development: '开发',
  financial: '财务',
  games: '游戏',
  health: '健康',
  'home-automation': '智能家居',
  management: '管理',
  media: '媒体',
  monitoring: '监控',
  networking: '网络',
  productivity: '生产力',
  security: '安全',
  storage: '存储',
};

export default function AppStore() {
  const { initialize: initDocker, status: dockerStatus } = useDockerStore();
  const { subscribeToChanges, categories, loadCategories } = useAppsStore();
  const [activeTab, setActiveTab] = useState<CategoryType>('installed');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    initDocker();
    loadCategories();
    const unsubscribe = subscribeToChanges();
    return () => {
      unsubscribe();
    };
  }, [initDocker, subscribeToChanges, loadCategories]);

  const categories_list = [
    { id: 'all' as CategoryType, label: '全部应用', icon: <LayoutGrid size={18} /> },
    { id: 'installed' as CategoryType, label: '已安装', icon: <PanelTopOpen size={18} /> },
  ];

  const categoryGroupItems = categories.map((cat) => ({
    id: cat as CategoryType,
    label: categoryLabels[cat] || cat,
    icon: categoryIcons[cat] || <FolderSync size={16} />,
  }));

  const categoryGroups = [
    {
      label: '分类',
      items: categoryGroupItems,
    },
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        {/* Search */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <svg style={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="搜索应用"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {categories_list.map((item) => (
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
          <div style={styles.dockerStatusLeft}>
            <Container size={16} color={dockerStatus.status === 'RUNNING' ? '#34c759' : '#ff3b30'} />
            <span style={styles.dockerLabel}>Docker</span>
          </div>
          <div style={styles.dockerStatusRight}>
            <span style={{
              ...styles.dockerValue,
              color: dockerStatus.status === 'RUNNING' ? '#34c759' : '#ff3b30',
            }}>
              {dockerStatus.status === 'RUNNING' ? '运行中' : '已停止'}
            </span>
            <button
              onClick={() => openApp('docker')}
              style={styles.dockerSettingsBtn}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeTab === 'installed' ? (
          <InstalledApps />
        ) : (
          <AvailableApps category={activeTab} searchQuery={searchValue} />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    backgroundColor: '#f5f5f7',
    overflow: 'hidden',
  },
  // Sidebar
  sidebar: {
    width: 240,
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  // Search
  searchContainer: {
    padding: '16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    padding: '8px 12px',
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 14,
    outline: 'none',
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Navigation
  nav: {
    flex: 1,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 113, 227, 0.1)',
  },
  navItemIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  navItemLabel: {
    fontSize: 14,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  categoryLabel: {
    padding: '16px 12px 6px',
    fontSize: 11,
    color: '#86868b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Docker Status Bar
  dockerStatusBar: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },
  dockerStatusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dockerStatusRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dockerLabel: {
    fontSize: 13,
    color: '#1d1d1f',
    fontWeight: 500,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  dockerValue: {
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
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
    borderRadius: 6,
    color: '#86868b',
    transition: 'all 0.2s ease',
  },
  // Main Content
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};
