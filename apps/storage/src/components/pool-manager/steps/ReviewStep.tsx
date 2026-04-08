/**
 * Review Step Component
 * Review pool configuration before creation
 */

import React from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';

export default function ReviewStep() {
  const {
    name,
    encryption,
    encryptionAlgorithm,
    deduplication,
    vdevGroups,
    getTotalDisksCount,
  } = usePoolManagerStore();

  const dataGroup = vdevGroups.find((g) => g.type === 'data');
  const totalDataVdevs = dataGroup?.vdevs.length || 0;
  const totalDisks = getTotalDisksCount();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Review Configuration</h2>
      <p style={styles.subtitle}>
        Review your pool configuration before creating. All settings will be applied
        to the new storage pool.
      </p>

      <div style={styles.reviewGrid}>
        {/* Pool Name */}
        <ReviewCard
          title="Pool Name"
          value={name}
          icon="storage"
        />

        {/* Encryption */}
        <ReviewCard
          title="Encryption"
          value={encryption ? `Enabled (${encryptionAlgorithm})` : 'Disabled'}
          icon={encryption ? 'lock' : 'lock_open'}
        />

        {/* Total Data VDEVs */}
        <ReviewCard
          title="Data VDEVs"
          value={totalDataVdevs.toLocaleString()}
          icon="devices"
        />

        {/* Total Disks */}
        <ReviewCard
          title="Total Disks"
          value={totalDisks.toLocaleString()}
          icon="hard_drive"
        />

        {/* Deduplication */}
        <ReviewCard
          title="Deduplication"
          value={getDeduplicationLabel(deduplication)}
          icon={deduplication !== 'OFF' ? 'content_copy' : 'block'}
        />

        {/* Warning if deduplication enabled */}
        {deduplication !== 'OFF' && (
          <div style={styles.warningCard}>
            <div style={styles.warningIcon}>⚠</div>
            <div style={styles.warningText}>
              <strong>Performance Impact:</strong> Deduplication can significantly
              impact write performance and requires substantial RAM. Ensure your system
              meets the requirements before proceeding.
            </div>
          </div>
        )}
      </div>

      {/* VDEV Configuration */}
      <div style={styles.vdevSection}>
        <h3 style={styles.vdevTitle}>VDEV Configuration</h3>
        {vdevGroups.map((group) => (
          <VdevGroupReview key={group.type} group={group} />
        ))}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  title: string;
  value: string;
  icon: string;
}

function ReviewCard({ title, value, icon }: ReviewCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.cardIcon}>{icon}</div>
      <div style={styles.cardContent}>
        <div style={styles.cardTitle}>{title}</div>
        <div style={styles.cardValue}>{value}</div>
      </div>
    </div>
  );
}

interface VdevGroupReviewProps {
  group: {
    type: string;
    vdevs: {
      id: string;
      type: string;
      disks: string[];
    }[];
    spareDisks: string[];
  };
}

function VdevGroupReview({ group }: VdevGroupReviewProps) {
  if (group.vdevs.length === 0 && group.spareDisks.length === 0) {
    return null;
  }

  return (
    <div style={styles.vdevGroup}>
      <h4 style={styles.vdevGroupTitle}>{getVdevTypeLabel(group.type)}</h4>
      {group.vdevs.length > 0 && (
        <div style={styles.vdevList}>
          {group.vdevs.map((vdev, index) => (
            <div key={vdev.id} style={styles.vdevItem}>
              <span style={styles.vdevItemTitle}>{vdev.type} {index + 1}</span>
              <span style={styles.vdevItemDisks}>{vdev.disks.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {group.spareDisks.length > 0 && (
        <div style={styles.vdevList}>
          <div style={styles.vdevItem}>
            <span style={styles.vdevItemTitle}>Hot Spares</span>
            <span style={styles.vdevItemDisks}>{group.spareDisks.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function getDeduplicationLabel(deduplication: string): string {
  switch (deduplication) {
    case 'OFF':
      return 'Disabled';
    case 'ON':
      return 'Enabled';
    case 'VERIFY':
      return 'Enabled (with verification)';
    default:
      return deduplication;
  }
}

function getVdevTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    data: 'Data VDEVs',
    log: 'Log Devices',
    special: 'Special Metadata',
    cache: 'L2ARC Cache',
    dedup: 'Deduplication Metadata',
    spare: 'Hot Spares',
  };
  return labels[type] || type;
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '900px',
  } as React.CSSProperties,
  title: {
    margin: '0 0 8px',
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '0 0 24px',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  reviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  } as React.CSSProperties,
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  } as React.CSSProperties,
  cardIcon: {
    fontSize: '24px',
    color: '#1976d2',
  } as React.CSSProperties,
  cardContent: {
    flex: 1,
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  } as React.CSSProperties,
  cardValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  warningCard: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff3e0',
    border: '1px solid #ffe0b2',
    borderRadius: '8px',
  } as React.CSSProperties,
  warningIcon: {
    fontSize: '24px',
  } as React.CSSProperties,
  warningText: {
    flex: 1,
    fontSize: '14px',
    color: '#856404',
  } as React.CSSProperties,
  vdevSection: {
    padding: '16px',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  } as React.CSSProperties,
  vdevTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  vdevGroup: {
    marginBottom: '16px',
  } as React.CSSProperties,
  vdevGroupTitle: {
    margin: '0 0 8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  } as React.CSSProperties,
  vdevList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  } as React.CSSProperties,
  vdevItem: {
    padding: '8px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  } as React.CSSProperties,
  vdevItemTitle: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '4px',
  } as React.CSSProperties,
  vdevItemDisks: {
    fontSize: '13px',
    color: '#666',
    fontFamily: 'monospace',
  } as React.CSSProperties,
};
