/**
 * Available Apps Component
 * Browse and discover apps from catalog
 * Styled similar to TrueNAS webui
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <input
          type="text"
          placeholder="Search available apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Category Filter */}
      <div style={styles.categoriesBar}>
        <button
          style={{
            ...styles.categoryButton,
            ...(selectedCategory === 'all' ? styles.categoryButtonActive : {}),
          }}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            style={{
              ...styles.categoryButton,
              ...(selectedCategory === category ? styles.categoryButtonActive : {}),
            }}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Apps Grid */}
      {availableAppsLoading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading available apps...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
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
            <div
              key={`${app.catalog}-${app.train}-${app.name}`}
              style={styles.appCard}
              onClick={() => handleInstall(app)}
            >
              {/* Left Column - Icon & Train */}
              <div style={styles.leftColumn}>
                <div style={styles.iconContainer}>
                  {getIconUrl(app) ? (
                    <img
                      src={getIconUrl(app)!}
                      alt=""
                      style={styles.icon}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={styles.iconPlaceholder}>📦</span>
                  )}
                </div>
                <span style={styles.trainBadge}>{app.train}</span>
              </div>

              {/* Right Column - Content */}
              <div style={styles.rightColumn}>
                {/* Header Row */}
                <div style={styles.cardHeader}>
                  <h3 style={styles.appName}>{app.name}</h3>
                  <span style={styles.version}>
                    {app.app?.human_version || app.version}
                  </span>
                </div>

                {/* Description */}
                <p style={styles.description}>
                  {app.app?.description || 'No description available'}
                </p>

                {/* Footer Row */}
                <div style={styles.cardFooter}>
                  {/* Categories */}
                  <div style={styles.categoriesContainer}>
                    {app.app?.categories?.slice(0, 4).map((cat) => (
                      <span key={cat} style={styles.categoryTag}>
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Install Button */}
                  <button
                    style={styles.installButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstall(app);
                    }}
                  >
                    Install
                  </button>
                </div>
              </div>

              {/* Recommended Badge */}
              {app.app?.recommended && (
                <div style={styles.recommendedFlag}>
                  <span style={styles.recommendedBadge}>Recommended</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
  },
  searchInput: {
    width: '100%',
    maxWidth: 400,
    padding: '10px 16px',
    fontSize: 14,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    outline: 'none',
  },
  categoriesBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    overflowX: 'auto',
    flexShrink: 0,
  },
  categoryButton: {
    padding: '6px 14px',
    backgroundColor: '#ffffff',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: 16,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  },
  categoryButtonActive: {
    backgroundColor: '#1976d2',
    color: '#ffffff',
    borderColor: '#1976d2',
  },
  appsGrid: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: 16,
    alignContent: 'start',
  },
  appCard: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    display: 'flex',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.15s ease',
    minHeight: 120,
  },
  leftColumn: {
    width: 100,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 12px',
    backgroundColor: '#fafafa',
    borderRight: '1px solid #f0f0f0',
    gap: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  iconPlaceholder: {
    fontSize: 32,
  },
  trainBadge: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#ffffff',
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid #e0e0e0',
    textTransform: 'uppercase' as const,
    fontWeight: 500,
  },
  rightColumn: {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  version: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: '2px 8px',
    borderRadius: 4,
    flexShrink: 0,
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.4,
    margin: 0,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
  },
  categoriesContainer: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
    flex: 1,
    overflow: 'hidden',
  },
  categoryTag: {
    padding: '2px 6px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: 4,
    fontSize: 11,
    whiteSpace: 'nowrap' as const,
  },
  installButton: {
    padding: '6px 16px',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    flexShrink: 0,
  },
  recommendedFlag: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
  },
  recommendedBadge: {
    padding: '2px 6px',
    backgroundColor: '#4caf50',
    color: '#fff',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
    flex: 1,
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

export default AvailableApps;