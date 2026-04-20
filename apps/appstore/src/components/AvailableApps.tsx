/**
 * Available Apps Component
 * Apple-inspired design for app discovery
 */

import { useEffect, useState } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { AvailableApp } from '@truenas/types/app-types';

import { categoryLabels } from '@shared/constants/appCategories';

interface AvailableAppsProps {
  category?: string;
  searchQuery?: string;
  onAppInstall?: (app: AvailableApp) => void;
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

  // Reset selected app when category changes
  useEffect(() => {
    setSelectedApp(null);
  }, [category]);

  const filteredApps = availableApps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'all' ||
      category === 'installed' ||
      app.categories?.includes(category);
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (app: AvailableApp) => {
    onAppInstall?.(app);
  };

  // Icon URL from TrueNAS media server
  const getIconUrl = (app: AvailableApp): string | null => {
    if (app.icon_url) {
      return app.icon_url;
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
          {/* Hero Section */}
          <div style={styles.detailHero}>
            {/* Back Button */}
            <button
              style={styles.backButton}
              onClick={() => setSelectedApp(null)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                )}
              </div>
              <div style={styles.detailHeaderInfo}>
                <h2 style={styles.detailTitle}>{selectedApp.title || selectedApp.name}</h2>
                <p style={styles.detailMeta}>
                  {selectedApp.latest_version || selectedApp.version}
                </p>
              </div>
              <button
                style={styles.installButtonLarge}
                onClick={() => handleInstall(selectedApp)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0070e0';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0071e3';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                安装
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div style={styles.detailContent}>
            {/* Description */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>描述</h3>
              <p style={styles.detailDescription}>
                {selectedApp.description || '暂无描述'}
              </p>
            </div>

            {/* Categories */}
            {selectedApp.categories && selectedApp.categories.length > 0 && (
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>分类</h3>
                <div style={styles.tagsContainer}>
                  {selectedApp.categories.map((cat) => (
                    <span key={cat} style={styles.tag}>
                      {categoryLabels[cat] || cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* App Info */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>信息</h3>
              <div style={styles.infoGrid}>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>应用名称</span>
                  <span style={styles.infoValue}>{selectedApp.name}</span>
                </div>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>版本</span>
                  <span style={styles.infoValue}>{selectedApp.version || selectedApp.latest_version}</span>
                </div>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>来源</span>
                  <span style={styles.infoValue}>{selectedApp.train}</span>
                </div>
                <div style={{ ...styles.infoItem, ...styles.infoItemBorder }}>
                  <span style={styles.infoLabel}>目录</span>
                  <span style={styles.infoValue}>{selectedApp.catalog}</span>
                </div>
                {selectedApp.maintainers && selectedApp.maintainers.length > 0 && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>维护者</span>
                    <span style={styles.infoValue}>
                      {selectedApp.maintainers.map((m) => m.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Badge */}
            {selectedApp.recommended && (
              <div style={styles.recommendedBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                <span style={styles.recommendedText}>精选推荐应用</span>
              </div>
            )}
          </div>
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
                {/* Left Column - Logo & Train */}
                <div style={styles.cardLeft}>
                  <div style={styles.cardLogo}>
                    {getIconUrl(app) ? (
                      <img
                        src={getIconUrl(app)!}
                        alt=""
                        style={styles.cardLogoImg}
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
                  <div style={styles.cardTrain}>{app.train}</div>
                </div>

                {/* Right Column - Name, Version, Description */}
                <div style={styles.cardRight}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>{app.title || app.name}</h3>
                    <span style={styles.cardVersion}>{app.latest_version || app.version}</span>
                  </div>
                  <p style={styles.cardDescription}>
                    {app.description || '暂无描述'}
                  </p>
                  {app.recommended && (
                    <span style={styles.recommendedBadge}>推荐</span>
                  )}
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
    padding: 16,
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
    flexShrink: 0,
  },
  cardLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  cardTrain: {
    fontSize: 10,
    fontWeight: 600,
    color: '#86868b',
    backgroundColor: '#f5f5f7',
    padding: '2px 6px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  cardRight: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1d1d1f',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  cardVersion: {
    fontSize: 12,
    color: '#86868b',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    flexShrink: 0,
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
  recommendedBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#34c759',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    marginTop: 4,
  },
  // Detail View - Apple App Store Style
  detailView: {
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#f5f5f7',
    padding: '0 0 48px',
  },
  // Hero Section with gradient
  detailHero: {
    background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)',
    padding: '32px 40px 28px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    marginBottom: 20,
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: '#0071e3',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
  },
  detailIcon: {
    width: 100,
    height: 100,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
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
    paddingRight: 120,
  },
  detailTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1d1d1f',
    margin: '0 0 4px',
    letterSpacing: '-0.03em',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  },
  detailMeta: {
    fontSize: 14,
    color: '#86868b',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  installButtonLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 28px',
    backgroundColor: '#0071e3',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)',
    minWidth: 100,
  },
  // Content Section
  detailContent: {
    padding: '28px 40px',
    maxWidth: 1200,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  detailSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 12px 2px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  detailDescription: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 1.65,
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    padding: '7px 14px',
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },
  // Info Cards - Apple Style
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
  // Recommended Banner - Apple Style
  recommendedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 18px',
    backgroundColor: '#f0f9f0',
    borderRadius: 12,
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
