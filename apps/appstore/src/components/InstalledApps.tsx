/**
 * Installed Apps Component
 * Displays list of installed Docker apps
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
      case 'RUNNING':
        return '#4caf50';
      case 'STOPPED':
        return '#9e9e9e';
      case 'DEPLOYING':
        return '#2196f3';
      case 'CRASHED':
        return '#f44336';
      default:
        return '#9e9e9e';
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
        <div style={styles.emptyIcon}>📦</div>
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
        <div style={styles.emptyIcon}>⏸️</div>
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
        <div style={styles.spinner}></div>
        <p>Loading installed apps...</p>
      </div>
    );
  }

  if (installedApps.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>📦</div>
        <h2 style={styles.emptyTitle}>No Apps Installed</h2>
        <p style={styles.emptyText}>
          Visit the Discover tab to browse and install applications.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <input
          type="text"
          placeholder="Search installed apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Apps List */}
      <div style={styles.appsList}>
        {filteredApps.map((app) => (
          <div
            key={app.id}
            style={{
              ...styles.appCard,
              ...(selectedApp?.id === app.id ? styles.appCardSelected : {}),
            }}
            onClick={() => handleAppClick(app)}
          >
            <div style={styles.appHeader}>
              <div style={styles.appIcon}>
                {app.metadata?.icon ? (
                  <img src={app.metadata.icon} alt="" style={styles.appIconImg} />
                ) : (
                  '📦'
                )}
              </div>
              <div style={styles.appInfo}>
                <div style={styles.appName}>{app.name}</div>
                <div style={styles.appVersion}>
                  v{app.metadata?.human_version || app.version}
                </div>
              </div>
              <div style={styles.appStatus}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(app.state),
                  }}
                >
                  {app.state}
                </span>
                {app.upgrade_available && (
                  <span style={styles.upgradeBadge}>Update</span>
                )}
              </div>
            </div>

            <div style={styles.appDescription}>
              {app.metadata?.description || 'No description available'}
            </div>

            <div style={styles.appActions}>
              {app.state === 'RUNNING' ? (
                <>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStopApp(app.name);
                    }}
                  >
                    Stop
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestartApp(app.name);
                    }}
                  >
                    Restart
                  </button>
                </>
              ) : (
                <button
                  style={{ ...styles.actionButton, ...styles.startButton }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartApp(app.name);
                  }}
                >
                  Start
                </button>
              )}
              <button
                style={{ ...styles.actionButton, ...styles.deleteButton }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteApp(app.name);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#ffffff',
  },
  searchInput: {
    width: '100%',
    maxWidth: 400,
    padding: '8px 16px',
    fontSize: 14,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    outline: 'none',
  },
  appsList: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 16,
    alignContent: 'start',
  },
  appCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  appCardSelected: {
    borderColor: '#1976d2',
    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
  },
  appHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 12,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    overflow: 'hidden',
  },
  appIconImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: '#666',
  },
  appStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    textTransform: 'uppercase',
  },
  upgradeBadge: {
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#ff9800',
    textTransform: 'uppercase',
  },
  appDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  appActions: {
    display: 'flex',
    gap: 8,
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  startButton: {
    backgroundColor: '#4caf50',
    color: '#fff',
  },
  deleteButton: {
    marginLeft: 'auto',
    backgroundColor: '#ffebee',
    color: '#f44336',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 16,
    color: '#666',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e0e0e0',
    borderTopColor: '#1976d2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
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
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 8px',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    margin: 0,
    maxWidth: 400,
  },
};

export default InstalledApps;