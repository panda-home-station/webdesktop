/**
 * Dedup Step Component
 * Configure deduplication settings
 */

import React from 'react';
import { usePoolManagerStore } from '@truenas/stores/pool-manager';
import { DeduplicationSetting } from '@truenas/types/dedup-enum-types';

export default function DedupStep() {
  const {
    deduplication,
    setDeduplication,
  } = usePoolManagerStore();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Deduplication</h2>
      <p style={styles.subtitle}>
        Configure deduplication to optimize storage of duplicate data blocks.
        This can save space but requires significant RAM and has performance implications.
      </p>

      <div style={styles.warningBox}>
        <p style={styles.warningText}>
          <strong>Performance Warning:</strong> Deduplication requires approximately
          5GB of RAM per 1TB of deduplicated data. It can significantly
          impact write performance and is recommended only for specific workloads.
        </p>
      </div>

      {/* Deduplication Options */}
      <div style={styles.options}>
        <DedupOption
          setting={DeduplicationSetting.Off}
          selected={deduplication === DeduplicationSetting.Off}
          onSelect={() => setDeduplication(DeduplicationSetting.Off)}
          title="Off"
          description="No deduplication. Recommended for most use cases."
          recommended={true}
        />

        <DedupOption
          setting={DeduplicationSetting.On}
          selected={deduplication === DeduplicationSetting.On}
          onSelect={() => setDeduplication(DeduplicationSetting.On)}
          title="On"
          description="Deduplicate data blocks. Can save space but slows down writes."
        />

        <DedupOption
          setting={DeduplicationSetting.Verify}
          selected={deduplication === DeduplicationSetting.Verify}
          onSelect={() => setDeduplication(DeduplicationSetting.Verify)}
          title="Verify"
          description="Deduplicate with integrity verification. Slower but more reliable."
        />
      </div>

      {/* Current Selection Info */}
      {deduplication !== DeduplicationSetting.Off && (
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            <strong>Selected: {getDeduplicationLabel(deduplication)}</strong><br />
            This setting will be applied to all data in the pool once created.
            Deduplication can be changed later, but requires reslivering the pool.
          </p>
        </div>
      )}
    </div>
  );
}

interface DedupOptionProps {
  setting: DeduplicationSetting;
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  recommended?: boolean;
}

function DedupOption({ selected, onSelect, title, description, recommended }: DedupOptionProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        ...styles.option,
        ...(selected ? styles.optionSelected : {}),
        ...(recommended ? styles.optionRecommended : {}),
      }}
    >
      <div style={styles.optionHeader}>
        <span style={styles.optionTitle}>{title}</span>
        {recommended && (
          <span style={styles.recommendedBadge}>Recommended</span>
        )}
      </div>
      <p style={styles.optionDescription}>{description}</p>
    </div>
  );
}

function getDeduplicationLabel(setting: DeduplicationSetting): string {
  switch (setting) {
    case DeduplicationSetting.Off:
      return 'Off';
    case DeduplicationSetting.On:
      return 'On';
    case DeduplicationSetting.Verify:
      return 'Verify';
    default:
      return setting;
  }
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
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
  warningBox: {
    padding: '16px',
    backgroundColor: '#ffebee',
    border: '1px solid #ffcdd2',
    borderRadius: '6px',
    marginBottom: '24px',
  } as React.CSSProperties,
  warningText: {
    margin: 0,
    fontSize: '14px',
    color: '#c62828',
  } as React.CSSProperties,
  options: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '24px',
  } as React.CSSProperties,
  option: {
    padding: '16px',
    backgroundColor: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  optionSelected: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  } as React.CSSProperties,
  optionRecommended: {
    position: 'relative' as const,
  } as React.CSSProperties,
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  } as React.CSSProperties,
  optionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  recommendedBadge: {
    padding: '4px 8px',
    backgroundColor: '#4caf50',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
  optionDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  infoBox: {
    padding: '16px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #bbdefb',
    borderRadius: '6px',
  } as React.CSSProperties,
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#0d47a1',
  } as React.CSSProperties,
};
