/**
 * Available Apps Component
 * Browse and discover apps from catalog
 * Apple-inspired minimalist design
 */

import { useEffect, useState } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { AvailableApp } from '@truenas/types/app-types';

interface AvailableAppsProps {
  onAppInstall?: (appName: string, train: string) => void;
}

export function AvailableApps({ onAppInstall }: AvailableAppsProps) {
  const {
    availableApps,
    availableAppsLoading,
    categories,
    loadAvailableApps,
    loadCategories,
  } = useAppsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<AvailableApp | null>(null);

  useEffect(() => {
    loadCategories();
    loadAvailableApps();
  }, [loadCategories, loadAvailableApps]);

  const filteredApps = availableApps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.app?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      app.app?.categories?.includes(selectedCategory);
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
      <div style={styles.loadingState}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading available apps...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Left Panel - Categories & Search */}
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
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Categories */}
        <div style={styles.categoriesSection}>
          <h3 style={styles.categoriesTitle}>Categories</h3>
          <div style={styles.categoriesList}>
            <button
              style={{
                ...styles.categoryItem,
                ...(selectedCategory === 'all' ? styles.categoryItemActive : {}),
              }}
              onClick={() => setSelectedCategory('all')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              <span>All Apps</span>
              <span style={styles.categoryCount}>
                {availableApps.length}
              </span>
            </button>
            {categories.map((category) => {
              const count = availableApps.filter((app) =>
                app.app?.categories?.includes(category)
              ).length;
              return (
                <button
                  key={category}
                  style={{
                    ...styles.categoryItem,
                    ...(selectedCategory === category ? styles.categoryItemActive : {}),
                  }}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span>{category}</span>
                  <span style={styles.categoryCount}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Apps Grid / Detail */}
      <div style={styles.contentPanel}>
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
              Back to apps
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
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="4"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                )}
              </div>
              <div style={styles.detailHeaderInfo}>
                <h2 style={styles.detailTitle}>{selectedApp.name}</h2>
                <p style={styles.detailMeta}>
                  {selectedApp.app?.human_version || selectedApp.version}
                  <span style={styles.trainTag}>{selectedApp.train}</span>
                </p>
              </div>
              <button
                style={styles.installButtonLarge}
                onClick={() => handleInstall(selectedApp)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Install
              </button>
            </div>

            {/* Description */}
            <div style={styles.detailSection}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.detailDescription}>
                {selectedApp.app?.description || 'No description available'}
              </p>
            </div>

            {/* Categories */}
            {selectedApp.app?.categories && selectedApp.app.categories.length > 0 && (
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Categories</h3>
                <div style={styles.tagsContainer}>
                  {selectedApp.app.categories.map((cat) => (
                    <span key={cat} style={styles.tag}>{cat}</span>
                  ))}
                </div>
              </div>
            )}

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
                  <span style={styles.infoValue}>{selectedApp.train}</span>
                </div>
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Catalog</span>
                  <span style={styles.infoValue}>{selectedApp.catalog}</span>
                </div>
                {selectedApp.app?.maintainers && selectedApp.app.maintainers.length > 0 && (
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Maintainers</span>
                    <span style={styles.infoValue}>
                      {selectedApp.app.maintainers.map((m) => m.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7"/>
                <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 style={styles.emptyTitle}>No Apps Found</h2>
            <p style={styles.emptyText}>
              {searchQuery
                ? 'No apps match your search criteria.'
                : 'No apps available in this category.'}
            </p>
          </div>
        ) : (
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
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
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
                    {app.app?.description || 'No description available'}
                  </p>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardVersion}>
                      {app.app?.human_version || app.version}
                    </span>
                    {app.app?.recommended && (
                      <span style={styles.recommendedBadge}>Recommended</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
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
  // List Panel (Left Sidebar)
  listPanel: {
    width: 240,
    flexShrink: 0,
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    padding: 16,
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
  categoriesSection: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 12px',
  },
  categoriesTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px',
    padding: '0 8px',
  },
  categoriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontSize: 13,
    color: '#475569',
    textAlign: 'left',
    width: '100%',
  },
  categoryItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: '#3b82f6',
  },
  categoryCount: {
    marginLeft: 'auto',
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },
  // Content Panel
  contentPanel: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#fafafa',
  },
  // Apps Grid
  appsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    padding: 20,
  },
  appCard: {
    display: 'flex',
    gap: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    textAlign: 'left',
    width: '100%',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  trainBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    flexShrink: 0,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
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
    color: '#94a3b8',
  },
  recommendedBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  // Detail View
  detailView: {
    padding: 24,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    marginBottom: 20,
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 150ms ease',
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
    width: 80,
    height: 80,
    borderRadius: 18,
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
    fontSize: 24,
    fontWeight: 600,
    color: '#0f172a',
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
  },
  detailMeta: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  trainTag: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  installButtonLarge: {
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
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
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
};