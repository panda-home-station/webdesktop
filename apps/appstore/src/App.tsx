/**
 * App Store Application
 * Docker Apps management interface for WebDesktop
 * Apple-inspired minimalist design with sidebar navigation
 */

import { useEffect, useState } from 'react';
import { InstalledApps } from './components/InstalledApps';
import { AvailableApps } from './components/AvailableApps';
import { useDockerStore } from '@truenas/stores/docker';
import { useAppsStore } from '@truenas/stores/apps';

type ViewType = 'installed' | 'discover';

export default function AppStore() {
  const { initialize: initDocker, status: dockerStatus, config: dockerConfig } = useDockerStore();
  const { subscribeToChanges } = useAppsStore();
  const [activeView, setActiveView] = useState<ViewType>('installed');

  useEffect(() => {
    initDocker();
    const unsubscribe = subscribeToChanges();
    return () => {
      unsubscribe();
    };
  }, [initDocker, subscribeToChanges]);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        {/* Logo/Title */}
        <div style={styles.sidebarHeader}>
          <div style={styles.appIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="#3b82f6"/>
              <path d="M12 6L7 18h1.8l.9-2.2h4.6l.9 2.2H18L12 6zm0 4.5l2.2 5.4h-4.4l2.2-5.4z" fill="white"/>
            </svg>
          </div>
          <div style={styles.appTitle}>
            <span style={styles.titleText}>App Store</span>
            <span style={styles.subtitleText}>Applications</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navItem,
              ...(activeView === 'installed' ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveView('installed')}
          >
            <div style={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <span style={styles.navLabel}>Installed</span>
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activeView === 'discover' ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveView('discover')}
          >
            <div style={styles.navIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7"/>
                <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={styles.navLabel}>Discover</span>
          </button>
        </nav>

        {/* Status Footer */}
        <div style={styles.sidebarFooter}>
          <div style={styles.dockerStatus}>
            <div style={{
              ...styles.statusDot,
              backgroundColor: dockerStatus.status === 'RUNNING' ? '#10b981' : '#94a3b8',
            }} />
            <div style={styles.statusInfo}>
              <span style={styles.statusLabel}>Docker</span>
              <span style={styles.statusValue}>
                {dockerStatus.status === 'RUNNING' ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
          {dockerConfig?.pool && (
            <div style={styles.poolInfo}>
              Pool: <span style={styles.poolName}>{dockerConfig.pool}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.contentHeader}>
          <h1 style={styles.viewTitle}>
            {activeView === 'installed' ? 'Installed Apps' : 'Discover Apps'}
          </h1>
          <p style={styles.viewSubtitle}>
            {activeView === 'installed'
              ? 'Manage your installed applications'
              : 'Browse and install new applications'}
          </p>
        </div>
        <div style={styles.contentBody}>
          {activeView === 'installed' ? <InstalledApps /> : <AvailableApps />}
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
  // Sidebar
  sidebar: {
    width: 220,
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  appTitle: {
    display: 'flex',
    flexDirection: 'column',
  },
  titleText: {
    fontSize: 15,
    fontWeight: 600,
    color: '#0f172a',
    lineHeight: 1.2,
  },
  subtitleText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },
  // Navigation
  nav: {
    flex: 1,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  navIcon: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#334155',
  },
  // Sidebar Footer
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
    backgroundColor: '#fafafa',
  },
  dockerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  statusInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },
  statusValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: 500,
  },
  poolInfo: {
    fontSize: 11,
    color: '#94a3b8',
    padding: '6px 10px',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  poolName: {
    fontWeight: 600,
    color: '#475569',
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