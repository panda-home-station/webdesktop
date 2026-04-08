/**
 * Storage Header Component
 * Header with title and actions
 */

import React from 'react';

interface StorageHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function StorageHeader({ onRefresh, isRefreshing }: StorageHeaderProps) {
  return (
    <div style={styles.header}>
      <div style={styles.titleSection}>
        <h1 style={styles.title}>Storage</h1>
        <p style={styles.subtitle}>
          Manage storage pools, disks, and datasets
        </p>
      </div>

      <div style={styles.actions}>
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            ...styles.button,
            opacity: isRefreshing ? 0.6 : 1,
          }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>

        {/* Create Pool Button */}
        <button
          onClick={() => {/* TODO: Navigate to pool creation */}}
          style={styles.primaryButton}
        >
          Create Pool
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  titleSection: {
    flex: 1,
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '12px',
  } as React.CSSProperties,
  button: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#1976d2',
    border: '1px solid #1976d2',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
};
