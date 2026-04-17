/**
 * Available Apps Component
 * Apple-inspired design for app discovery
 */

import { useEffect, useState } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { AvailableApp } from '@truenas/types/app-types';

interface AvailableAppsProps {
  category?: string;
  searchQuery?: string;
  onAppInstall?: (appName: string, train: string) => void;
}

export function AvailableApps({ category = 'all', searchQuery = '', onAppInstall }: AvailableAppsProps) {
  const {
    availableApps,
    availableAppsLoading,
    loadAvailableApps,
  } = useAppsStore();

  const [selectedApp, setSelectedApp] = useState<AvailableApp | null>(null);

  useEffect(() => {
    loadAvailableApps();
  }, [loadAvailableApps]);

  const filteredApps = availableApps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.app?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'all' ||
      category === 'installed' ||
      app.categories?.includes(category);
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (app: AvailableApp) => {
    onAppInstall?.(app.name, app.train);
  };

  // Icon URL from TrueNAS media server
  const getIconUrl = (app: AvailableApp): string | null => {
    if (app.app?.icon) {
      return `https://media.sys.truenas.net/apps/${app.app.icon}`;
    }
    return null;
  };

  // Loading State
  if (availableAppsLoading) {
    return (
      <div style={styles.centerState}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>正在加载可安装应用...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {selectedApp ? (
        <div style={styles.detailView}>
          {/* Back Button */}
          <button
            style={styles.backButton}
            onClick={() => setSelectedApp(null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            返回
          </button>

          {/* App Detail Header */}
          <div style={styles.detailHeader}>
            <div style={styles.detailIcon}>
              {getIconUrl(selectedApp) ? (
                <img
                  src={getIconUrl(selectedApp)!}
                  alt=""
                  style={styles.detailIconImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="4"/>
                  <path d="M8 12h8M12 8v8"/>
                </svg>
              )}
            </div>
            <div style={styles.detailHeaderInfo}>
              <h2 style={styles.detailTitle}>{selectedApp.name}</h2>
              <p style={styles.detailMeta}>
                {selectedApp.app?.human_version || selectedApp.version}
              </p>
            </div>
            <button
              style={styles.installButtonLarge}
              onClick={() => handleInstall(selectedApp)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              安装
            </button>
          </div>

          {/* Description */}
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>描述</h3>
            <p style={styles.detailDescription}>
              {selectedApp.app?.description || '暂无描述'}
            </p>
          </div>

          {/* Categories */}
          {selectedApp.app?.categories && selectedApp.app.categories.length > 0 && (
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>分类</h3>
              <div style={styles.tagsContainer}>
                {selectedApp.app.categories.map((cat) => (
                  <span key={cat} style={styles.tag}>{cat}</span>
                ))}
              </div>
            </div>
          )}

          {/* App Info */}
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>信息</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>名称</span>
                <span style={styles.infoValue}>{selectedApp.name}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>版本</span>
                <span style={styles.infoValue}>{selectedApp.version}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>来源</span>
                <span style={styles.infoValue}>{selectedApp.train}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>目录</span>
                <span style={styles.infoValue}>{selectedApp.catalog}</span>
              </div>
              {selectedApp.app?.maintainers && selectedApp.app.maintainers.length > 0 && (
                <div style={{ ...styles.infoItem, gridColumn: 'span 2' }}>
                  <span style={styles.infoLabel}>维护者</span>
                  <span style={styles.infoValue}>
                    {selectedApp.app.maintainers.map((m) => m.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Badge */}
          {selectedApp.app?.recommended && (
            <div style={styles.recommendedBanner}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              <span style={styles.recommendedText}>推荐应用</span>
            </div>
          )}
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={styles.centerState}>
          <div style={styles.emptyStateIcon}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={styles.emptyStateTitle}>未找到应用</h2>
          <p style={styles.emptyStateText}>
            {searchQuery
              ? '没有应用符合搜索条件'
              : '该分类下暂无应用'}
          </p>
        </div>
      ) : (
        <>
          <div style={styles.gridHeader}>
            <h2 style={styles.gridTitle}>
              {category === 'all' ? '全部应用' : category}
            </h2>
            <span style={styles.gridCount}>{filteredApps.length} 个应用</span>
          </div>
          <div style={styles.appsGrid}>
            {filteredApps.map((app) => (
              <button
                key={`${app.catalog}-${app.train}-${app.name}`}
                style={styles.appCard}
                onClick={() => setSelectedApp(app)}
              >
                <div style={styles.cardIcon}>
                  {getIconUrl(app) ? (
                    <img
                      src={getIconUrl(app)!}
                      alt=""
                      style={styles.cardIconImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="4"/>
                      <path d="M8 12h8M12 8v8"/>
                    </svg>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{app.name}</h3>
                    <span style={styles.trainBadge}>{app.train}</span>
                  </div>
                  <p style={styles.cardDescription}>
                    {app.app?.description || '暂无描述'}
                  </p>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardVersion}>
                      {app.app?.human_version || app.version}
                    </span>
                    {app.app?.recommended && (
                      <span style={styles.recommendedBadge}>推荐</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    backgroundColor: '#f5f5f7',
  },
  // Grid Header
  gridHeader: {
    padding: '24px 24px 16px',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  gridTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    letterSpacing: '-0.02em',
  },
  gridCount: {
    fontSize: 13,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Apps Grid
  appsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 14,
    padding: '0 24px 24px',
  },
  appCard: {
    display: 'flex',
    gap: 16,
    padding: 18,
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: 14,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#f5f5f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  cardIconImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1d1d1f',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  trainBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#86868b',
    backgroundColor: '#f5f5f7',
    padding: '3px 7px',
    borderRadius: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    flexShrink: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  cardDescription: {
    fontSize: 13,
    color: '#86868b',
    margin: 0,
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
  },
  cardVersion: {
    fontSize: 12,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  recommendedBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#34c759',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Detail View
  detailView: {
    padding: 24,
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    marginBottom: 24,
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#0071e3',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    paddingBottom: 24,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    marginBottom: 24,
  },
  detailIcon: {
    width: 88,
    height: 88,
    borderRadius: 20,
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
    paddingTop: 6,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  detailMeta: {
    fontSize: 14,
    color: '#86868b',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  installButtonLarge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '12px 22px',
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
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1d1d1f',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  // Recommended Banner
  recommendedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    backgroundColor: '#f0f9f0',
    borderRadius: 10,
    border: '1px solid rgba(52, 199, 89, 0.2)',
  },
  recommendedText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#34c759',
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
