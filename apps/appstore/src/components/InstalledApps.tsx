/**
 * Installed Apps Component
 * Displays list of installed Docker apps
 * Apple-inspired minimalist design
 */

import { useEffect, useState } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { useDockerStore } from '@truenas/stores/docker';
import { App } from '@truenas/types/app-types';

interface InstalledAppsProps {
  onAppSelect?: (app: App) => void;
}

export function InstalledApps({ onAppSelect }: InstalledAppsProps) {
  const {
    installedApps,
    installedAppsLoading,
    loadInstalledApps,
    startApp,
    stopApp,
    restartApp,
    deleteApp,
  } = useAppsStore();

  const { config: dockerConfig, status: dockerStatus } = useDockerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  useEffect(() => {
    loadInstalledApps();
  }, [loadInstalledApps]);

  const filteredApps = installedApps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'RUNNING': return '#10b981';
      case 'STOPPED': return '#94a3b8';
      case 'DEPLOYING': return '#3b82f6';
      case 'CRASHED': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const handleStartApp = async (name: string) => {
    try {
      await startApp(name);
    } catch (error) {
      console.error('Failed to start app:', error);
    }
  };

  const handleStopApp = async (name: string) => {
    try {
      await stopApp(name);
    } catch (error) {
      console.error('Failed to stop app:', error);
    }
  };

  const handleRestartApp = async (name: string) => {
    try {
      await restartApp(name);
    } catch (error) {
      console.error('Failed to restart app:', error);
    }
  };

  const handleDeleteApp = async (name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteApp(name);
        if (selectedApp?.name === name) {
          setSelectedApp(null);
        }
      } catch (error) {
        console.error('Failed to delete app:', error);
      }
    }
  };

  const handleAppClick = (app: App) => {
    setSelectedApp(app);
    onAppSelect?.(app);
  };

  // Check if Docker is ready
  if (!dockerConfig?.pool) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <h2 style={styles.emptyTitle}>No Pool Configured</h2>
        <p style={styles.emptyText}>
          Configure a pool for Apps in Settings to get started.
        </p>
      </div>
    );
  }

  if (dockerStatus.status !== 'RUNNING') {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h2 style={styles.emptyTitle}>Docker Not Running</h2>
        <p style={styles.emptyText}>
          Docker service is not running. Please start Docker to manage apps.
        </p>
      </div>
    );
  }

  if (installedAppsLoading) {
    return (
      <div style={styles.loadingState}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading installed apps...</p>
      </div>
    );
  }

  if (installedApps.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        <h2 style={styles.emptyTitle}>No Apps Installed</h2>
        <p style={styles.emptyText}>
          Visit the Discover tab to browse and install applications.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left Panel - App List */}
      <div style={styles.listPanel}>
        {/* Search */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search installed apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Apps List */}
        <div style={styles.appsList}>
          {filteredApps.map((app) => (
            <button
              key={app.id}
              style={{
                ...styles.appItem,
                ...(selectedApp?.id === app.id ? styles.appItemSelected : {}),
              }}
              onClick={() => handleAppClick(app)}
            >
              <div style={styles.appItemIcon}>
                {app.metadata?.icon ? (
                  <img src={app.metadata.icon} alt="" style={styles.appIconImg} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                )}
              </div>
              <div style={styles.appItemInfo}>
                <span style={styles.appItemName}>{app.name}</span>
                <span style={styles.appItemVersion}>
                  v{app.metadata?.human_version || app.version}
                </span>
              </div>
              <div style={styles.appItemStatus}>
                <span
                  style={{
                    ...styles.statusDot,
                    backgroundColor: getStatusColor(app.state),
                  }}
                />
                {app.upgrade_available && (
                  <span style={styles.updateBadge}>Update</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - App Detail */}
      <div style={styles.detailPanel}>
        {selectedApp ? (
          <div style={styles.appDetail}>
            {/* App Header */}
            <div style={styles.detailHeader}>
              <div style={styles.detailIcon}>
                {selectedApp.metadata?.icon ? (
                  <img src={selectedApp.metadata.icon} alt="" style={styles.detailIconImg} />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                )}
              </div>
              <div style={styles.detailHeaderInfo}>
                <h2 style={styles.detailTitle}>{selectedApp.name}</h2>
                <p style={styles.detailVersion}>
                  Version {selectedApp.metadata?.human_version || selectedApp.version}
                </p>
              </div>
              <div style={styles.detailStatus}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(selectedApp.state),
                  }}
                >
                  {selectedApp.state}
                </span>
                {selectedApp.upgrade_available && (
                  <span style={styles.updateBadgeLarge}>Update Available</span>
                )}
              </div>
            </div>

            {/* App Description */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.detailDescription}>
                {selectedApp.metadata?.description || 'No description available'}
              </p>
            </div>

            {/* App Info */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Information</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Name</span>
                  <span style={styles.infoValue}>{selectedApp.name}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Version</span>
                  <span style={styles.infoValue}>{selectedApp.version}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Train</span>
                  <span style={styles.infoValue}>{selectedApp.metadata?.train || 'N/A'}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Catalog</span>
                  <span style={styles.infoValue}>{selectedApp.metadata?.catalog || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* App Actions */}
            <div style={styles.detailActions}>
              {selectedApp.state === 'RUNNING' ? (
                <>
                  <button
                    style={styles.actionButtonSecondary}
                    onClick={() => handleStopApp(selectedApp.name)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="1"/>
                    </svg>
                    Stop
                  </button>
                  <button
                    style={styles.actionButtonSecondary}
                    onClick={() => handleRestartApp(selectedApp.name)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4v6h6M23 20v-6h-6"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Restart
                  </button>
                </>
              ) : (
                <button
                  style={styles.actionButtonPrimary}
                  onClick={() => handleStartApp(selectedApp.name)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  Start
                </button>
              )}
              <button
                style={styles.actionButtonDanger}
                onClick={() => handleDeleteApp(selectedApp.name)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.noSelection}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="4"/>
              <path d="M8 12h8M12 8v8"/>
            </svg>
            <p style={styles.noSelectionText}>Select an app to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    overflow: 'hidden',
  },
  // List Panel
  listPanel: {
    width: 320,
    flexShrink: 0,
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    padding: '16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: 14,
    color: '#334155',
    outline: 'none',
  },
  appsList: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  appItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 10,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    textAlign: 'left',
  },
  appItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  appItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  appIconImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  appItemInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  appItemName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  appItemVersion: {
    fontSize: 12,
    color: '#94a3b8',
  },
  appItemStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  updateBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  // Detail Panel
  detailPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    backgroundColor: '#fafafa',
  },
  appDetail: {
    padding: 32,
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  detailIconImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  detailHeaderInfo: {
    flex: 1,
    paddingTop: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#0f172a',
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  },
  detailVersion: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  detailStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  updateBadgeLarge: {
    fontSize: 11,
    fontWeight: 600,
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  detailSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px',
  },
  detailDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.6,
    margin: 0,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: '#0f172a',
  },
  detailActions: {
    display: 'flex',
    gap: 12,
    paddingTop: 24,
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  actionButtonPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  actionButtonSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  actionButtonDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginLeft: 'auto',
  },
  // Empty/Loading States
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 40,
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#0f172a',
    margin: '0 0 8px',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    maxWidth: 300,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '2px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
  },
  noSelectionText: {
    fontSize: 14,
    color: '#94a3b8',
    margin: 0,
  },
};