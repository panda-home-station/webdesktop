/**
 * App Install Page Component
 * Full page for installing apps with header navigation
 */

import React from 'react';
import { AppWizard } from './AppWizard/AppWizard';
import { AvailableApp } from '@truenas/types/app-types';

interface AppInstallPageProps {
  app: AvailableApp;
  onBack: () => void;
  onSuccess: () => void;
}

export function AppInstallPage({ app, onBack, onSuccess }: AppInstallPageProps) {
  const getIconUrl = (app: AvailableApp): string | null => {
    if (app.icon_url) {
      return app.icon_url;
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.detailBody}>
        {/* Header Section */}
        <div style={styles.detailHero}>
          {/* Back Button */}
          <button
            style={styles.backButton}
            onClick={onBack}
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

          {/* Header Content */}
          <div style={styles.detailHeader}>
            <div style={styles.detailIcon}>
              {getIconUrl(app) ? (
                <img
                  src={getIconUrl(app)!}
                  alt=""
                  style={styles.appIconImg}
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
              <h2 style={styles.detailTitle}>{app.title || app.name}</h2>
              <p style={styles.appMeta}>
                {app.latest_version || app.version} · {app.train}
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Section */}
        <div style={styles.wizardSection}>
          <AppWizard
            app={app}
            onClose={onBack}
            onSuccess={onSuccess}
            isPage={true}
            showHeader={false}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#f5f5f7',
  },
  detailBody: {
    maxWidth: 1200,
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
    width: '100%',
  },
  detailHero: {
    backgroundColor: '#f5f5f7',
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
  appIconImg: {
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
  appMeta: {
    fontSize: 14,
    color: '#86868b',
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  },
  wizardSection: {
    padding: '28px 40px',
  },
};
