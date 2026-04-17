/**
 * Installed Apps Component
 * Apple-inspired minimalist design with SF Pro aesthetics
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
    loadAppStats,
    appStats,
    startApp,
    stopApp,
    restartApp,
    deleteApp,
  } = useAppsStore();

  const { config: dockerConfig, status: dockerStatus } = useDockerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showTechInfo, setShowTechInfo] = useState(false);

  useEffect(() => {
    loadInstalledApps();
  }, [loadInstalledApps]);

  useEffect(() => {
    if (selectedApp && selectedApp.state === 'RUNNING') {
      loadAppStats(selectedApp.name);
      const interval = setInterval(() => {
        loadAppStats(selectedApp.name);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedApp, loadAppStats]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredApps = installedApps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'RUNNING': return '#34c759';
      case 'STOPPED': return '#86868b';
      case 'DEPLOYING': return '#0071e3';
      case 'CRASHED': return '#ff3b30';
      default: return '#86868b';
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
    if (confirm(`确定要删除 ${name} 吗？`)) {
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
      <div style={styles.centerState}>
        <div style={styles.emptyStateIcon}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <h2 style={styles.emptyStateTitle}>尚未配置存储池</h2>
        <p style={styles.emptyStateText}>
          请在设置中为应用配置存储池
        </p>
      </div>
    );
  }

  if (dockerStatus.status !== 'RUNNING') {
    return (
      <div style={styles.centerState}>
        <div style={styles.emptyStateIcon}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h2 style={styles.emptyStateTitle}>Docker 服务未运行</h2>
        <p style={styles.emptyStateText}>
          请先启动 Docker 服务以管理应用
        </p>
      </div>
    );
  }

  if (installedAppsLoading) {
    return (
      <div style={styles.centerState}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>正在加载已安装应用...</p>
      </div>
    );
  }

  if (installedApps.length === 0) {
    return (
      <div style={styles.centerState}>
        <div style={styles.emptyStateIcon}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        </div>
        <h2 style={styles.emptyStateTitle}>暂无已安装应用</h2>
        <p style={styles.emptyStateText}>
          前往发现浏览安装更多应用
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left Panel - App List */}
      <div style={styles.listPanel}>
        {/* Header */}
        <div style={styles.listHeader}>
          <h2 style={styles.listTitle}>已安装</h2>
          <span style={styles.listCount}>{installedApps.length} 个应用</span>
        </div>

        {/* Search */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <svg style={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="搜索已安装应用..."
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
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
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
                  <span style={styles.updateBadge}>更新</span>
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
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                )}
              </div>
              <div style={styles.detailHeaderInfo}>
                <h2 style={styles.detailTitle}>{selectedApp.name}</h2>
                <p style={styles.detailVersion}>
                  版本 {selectedApp.metadata?.human_version || selectedApp.version}
                </p>
              </div>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(selectedApp.state),
                }}
              >
                {selectedApp.state === 'RUNNING' ? '运行中' :
                 selectedApp.state === 'STOPPED' ? '已停止' :
                 selectedApp.state === 'DEPLOYING' ? '部署中' :
                 selectedApp.state === 'CRASHED' ? '已崩溃' : selectedApp.state}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={styles.detailActions}>
              {selectedApp.state === 'RUNNING' ? (
                <>
                  <button
                    style={styles.actionButtonSecondary}
                    onClick={() => handleStopApp(selectedApp.name)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="6" width="12" height="12" rx="1"/>
                    </svg>
                    停止
                  </button>
                  <button
                    style={styles.actionButtonSecondary}
                    onClick={() => handleRestartApp(selectedApp.name)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4v6h6M23 20v-6h-6"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    重启
                  </button>
                </>
              ) : (
                <button
                  style={styles.actionButtonPrimary}
                  onClick={() => handleStartApp(selectedApp.name)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  启动
                </button>
              )}
              <button
                style={styles.actionButtonDanger}
                onClick={() => handleDeleteApp(selectedApp.name)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                删除
              </button>
            </div>

            {/* Resource Usage - Only for running apps */}
            {selectedApp.state === 'RUNNING' && appStats[selectedApp.name] && (
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>资源使用</h3>
                <div style={styles.resourceGrid}>
                  <div style={styles.resourceItem}>
                    <div style={styles.resourceHeader}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                        <rect x="9" y="9" width="6" height="6"/>
                        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>
                      </svg>
                      <span style={styles.resourceLabel}>CPU</span>
                    </div>
                    <span style={styles.resourceValue}>{appStats[selectedApp.name].cpu.toFixed(1)}%</span>
                    <div style={styles.resourceBar}>
                      <div style={{ ...styles.resourceBarFill, width: `${Math.min(appStats[selectedApp.name].cpu, 100)}%`, backgroundColor: '#0071e3' }} />
                    </div>
                  </div>
                  <div style={styles.resourceItem}>
                    <div style={styles.resourceHeader}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2">
                        <rect x="2" y="6" width="20" height="12" rx="2"/>
                        <path d="M6 12h4M14 12h4"/>
                      </svg>
                      <span style={styles.resourceLabel}>内存</span>
                    </div>
                    <span style={styles.resourceValue}>{formatBytes(appStats[selectedApp.name].memory)}</span>
                    <div style={styles.resourceBar}>
                      <div style={{ ...styles.resourceBarFill, width: `${Math.min((appStats[selectedApp.name].memory / (4 * 1024 * 1024 * 1024)) * 100, 100)}%`, backgroundColor: '#34c759' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* App Description */}
            {selectedApp.metadata?.description && (
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>描述</h3>
                <p style={styles.detailDescription}>
                  {selectedApp.metadata.description}
                </p>
              </div>
            )}

            {/* Tags/Keywords */}
            {selectedApp.metadata?.tags && selectedApp.metadata.tags.length > 0 && (
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>关键词</h3>
                <div style={styles.tagsContainer}>
                  {selectedApp.metadata.tags.map((tag) => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* App Info */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>信息</h3>
              <div style={styles.infoGrid}>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>版本</span>
                  <span style={styles.infoValue}>{selectedApp.metadata?.human_version || selectedApp.version}</span>
                </div>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>来源</span>
                  <span style={styles.infoValue}>{selectedApp.metadata?.train || 'N/A'}</span>
                </div>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>目录</span>
                  <span style={styles.infoValue}>{selectedApp.metadata?.catalog || 'N/A'}</span>
                </div>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>存储池</span>
                  <span style={styles.infoValue}>{dockerConfig?.pool || 'N/A'}</span>
                </div>
                {selectedApp.metadata?.sources && selectedApp.metadata.sources.length > 0 && (
                  <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                    <span style={styles.infoLabel}>源代码</span>
                    <a href={selectedApp.metadata.sources[0]} target="_blank" rel="noopener noreferrer" style={styles.infoLink}>
                      {selectedApp.metadata.sources[0]}
                    </a>
                  </div>
                )}
                {selectedApp.metadata?.last_update && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>最后更新</span>
                    <span style={styles.infoValue}>
                      {new Date(selectedApp.metadata.last_update).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Info - Collapsible */}
            <div style={styles.detailSection}>
              <button
                style={styles.collapsibleHeader}
                onClick={() => setShowTechInfo(!showTechInfo)}
              >
                <h3 style={styles.sectionTitle}>技术信息</h3>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#86868b"
                  strokeWidth="2"
                  style={{ transform: showTechInfo ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {showTechInfo && (
                <div style={styles.techInfoContent}>
                  <div style={styles.infoGrid}>
                    <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                      <span style={styles.infoLabel}>用户名</span>
                      <span style={styles.infoValue}>apps</span>
                    </div>
                    <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                      <span style={styles.infoLabel}>UID</span>
                      <span style={styles.infoValue}>568</span>
                    </div>
                    <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                      <span style={styles.infoLabel}>组名</span>
                      <span style={styles.infoValue}>Host group</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>GID</span>
                      <span style={styles.infoValue}>568</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Update Available */}
            {selectedApp.upgrade_available && (
              <div style={styles.updateBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff9f0a" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span style={styles.updateBannerText}>有可用更新：v{selectedApp.latest_version}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.centerState}>
            <div style={styles.emptyStateIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="4"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
            </div>
            <p style={styles.emptyStateText}>选择一个应用查看详情</p>
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
  listHeader: {
    padding: '24px 20px 16px',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    letterSpacing: '-0.02em',
  },
  listCount: {
    fontSize: 13,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  searchContainer: {
    padding: '0 16px 16px',
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: 14,
    color: '#1d1d1f',
    outline: 'none',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  appsList: {
    flex: 1,
    overflow: 'auto',
    padding: '0 8px 16px',
  },
  appItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 12px',
    border: 'none',
    borderRadius: 10,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  appItemSelected: {
    backgroundColor: 'rgba(0, 113, 227, 0.1)',
  },
  appItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
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
    fontWeight: 600,
    color: '#1d1d1f',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  appItemVersion: {
    fontSize: 12,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  appItemStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  updateBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#ff9f0a',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Detail Panel
  detailPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    backgroundColor: '#f5f5f7',
  },
  appDetail: {
    padding: 32,
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  detailIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
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
    fontSize: 26,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  detailVersion: {
    fontSize: 14,
    color: '#86868b',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Actions
  detailActions: {
    display: 'flex',
    gap: 10,
    marginBottom: 28,
  },
  actionButtonPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    backgroundColor: '#0071e3',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  actionButtonSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  actionButtonDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    backgroundColor: '#ffebe9',
    color: '#ff3b30',
    border: '1px solid rgba(255, 59, 48, 0.15)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: 'auto',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Sections
  detailSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 14px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  detailDescription: {
    fontSize: 14,
    color: '#1d1d1f',
    lineHeight: 1.6,
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  infoGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
  },
  infoItemBorder: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 400,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    textAlign: 'right',
  },
  infoLink: {
    fontSize: 14,
    fontWeight: 400,
    color: '#0071e3',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
  },
  // Resource Usage
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  resourceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  resourceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  resourceLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  resourceValue: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  resourceBar: {
    height: 4,
    backgroundColor: '#f5f5f7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  resourceBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  // Tags
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    padding: '6px 12px',
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },
  // Collapsible
  collapsibleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 0,
  },
  techInfoContent: {
    marginTop: 16,
  },
  // Update Banner
  updateBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    backgroundColor: '#fff9e6',
    borderRadius: 10,
    border: '1px solid rgba(255, 159, 10, 0.2)',
  },
  updateBannerText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#ff9f0a',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Center States
  centerState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 40,
    textAlign: 'center',
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1d1d1f',
    margin: '0 0 8px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  emptyStateText: {
    fontSize: 14,
    color: '#86868b',
    margin: 0,
    maxWidth: 300,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  loadingSpinner: {
    width: 28,
    height: 28,
    border: '2.5px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#0071e3',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#86868b',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
};
