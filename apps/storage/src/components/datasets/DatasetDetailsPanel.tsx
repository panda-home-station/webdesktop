/**
 * Dataset Details Panel Component
 * Display and edit dataset properties
 */

import React, { useState } from 'react';
import { DatasetDetails } from '@truenas/types/dataset-types';
import { datasetService } from '@truenas/services/dataset';
import {
  formatBytes,
  getDatasetName,
  getDatasetUsedPercentage,
} from '@truenas/utils/dataset.utils';

interface DatasetDetailsPanelProps {
  dataset: DatasetDetails;
  onClose: () => void;
  onUpdate: () => void;
}

export default function DatasetDetailsPanel({ dataset, onClose, onUpdate }: DatasetDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    comments: dataset.comments || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await datasetService.update(dataset.id, {
EditValues,
      });
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update dataset:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const usedPercentage = getDatasetUsedPercentage(dataset);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>{getDatasetName(dataset)}</h3>
        <button
          onClick={onClose}
          style={styles.closeButton}
        >
          ✕
        </button>
      </div>

      {/* Dataset Info */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Information</h4>
        <InfoRow label="Name" value={dataset.name} />
        <InfoRow label="Pool" value={dataset.pool} />
        <InfoRow label="Mount Point" value={dataset.mountpoint} />
        <InfoRow label="Type" value={dataset.type} />
        <InfoRow label="ID" value={dataset.id} />
      </div>

      {/* Storage */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Storage</h4>
        <StorageProgressBar
          label="Used Space"
          used={dataset.used.parsed as number}
          total={dataset.available.parsed as number + (dataset.used.parsed as number)}
        />
        <StorageInfoRow label="Used" value={formatBytes(dataset.used.parsed as number)} />
        <StorageInfoRow label="Available" value={formatBytes(dataset.available.parsed as number)} />
        <StorageInfoRow label="Referenced" value={formatBytes(dataset.usedbyrefreservation.parsed as number)} />
        <StorageInfoRow label="Compression" value={dataset.compressratio.value} />
      </div>

      {/* Properties */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Properties</h4>
        {isEditing ? (
          <>
            <div style={styles.field}>
              <label style={styles.fieldLabel} htmlFor="comments">
                Comments
              </label>
              <textarea
                id="comments"
                value={editValues.comments}
                onChange={(e) => setEditValues({ ...editValues, comments: e.target.value })}
                style={styles.textarea}
              />
            </div>

            <div style={styles.actions}>
              <button
                onClick={() => setIsEditing(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  ...styles.saveButton,
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            <InfoRow label="Compression" value={dataset.compression.value} />
            <InfoRow label="Atime" value={dataset.atime.value} />
            <InfoRow label="Records" value={dataset.mounted.value ? 'On' : 'Off'} />
            <InfoRow label="Compression Level" value={dataset.compression.value} />

            <button
              onClick={() => setIsEditing(true)}
              style={styles.editButton}
            >
              Edit Properties
            </button>
          </>
        )}
      </div>

      {/* Encryption */}
      {dataset.encrypted && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Encryption</h4>
          <InfoRow label="Status" value={dataset.locked ? 'Locked' : 'Unlocked'} />
          <InfoRow label="Algorithm" value={dataset.encryption_algorithm.value} />
          <InfoRow label="Key Format" value={dataset.key_format.value} />
          <InfoRow label="Encryption Root" value={dataset.encryption_root} />

          {dataset.locked && (
            <button
              onClick={() => {/* TODO: Implement unlock */}}
              style={styles.unlockButton}
            >
              Unlock Dataset
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={styles.actions}>
        <button
          onClick={() => {/* TODO: Implement snapshot */}}
          style={styles.actionButton}
        >
          Create Snapshot
        </button>
        <button
          onClick={() => {/* TODO: Implement share */}}
          style={styles.actionButton}
        >
          Share
        </button>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | number | boolean;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}:</span>
      <span style={styles.infoValue}>{String(value)}</span>
    </div>
  );
}

interface StorageProgressBarProps {
  label: string;
  used: number;
  total: number;
}

function StorageProgressBar({ label, used, total }: StorageProgressBarProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <div style={styles.storageProgress}>
      <span style={styles.progressLabel}>{label}:</span>
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${percentage}%`,
            backgroundColor: getProgressColor(percentage),
          }}
        />
        <span style={styles.progressPercentage}>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}

interface StorageInfoRowProps {
  label: string;
  value: string;
}

function StorageInfoRow({ label, value }: StorageInfoRowProps) {
  return (
    <div style={styles.storageInfoRow}>
      <span style={styles.infoLabel}>{label}:</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

function formatDataset(value: unknown): string {
  return formatBytes(value as number);
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return '#f44336';
  if (percentage >= 70) return '#ff9800';
  if (percentage >= 50) return '#ffeb3b';
  return '#4caf50';
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: 'white',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  closeButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    color: '#666',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f5f5f5',
      color: '#f44336',
    },
  } as React.CSSProperties,
  section: {
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
  } as React.CSSProperties,
  infoLabel: {
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  infoValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    fontWeight: 500,
  } as React.CSSProperties,
  field: {
    marginBottom: '16px',
  } as React.CSSProperties,
  fieldLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    resize: 'vertical' as const,
    outline: 'none',
    ':focus': {
      borderColor: '#1976d2',
    },
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '16px',
  } as React.CSSProperties,
  saveButton: {
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
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #bdbdbd',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '12px',
  } as React.CSSProperties,
  unlockButton: {
    padding: '8px 16px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '12px',
  } as React.CSSProperties,
  actionButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'white',
    color: '#1976d2',
    border: '1px solid #1976d2',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  storageProgress: {
    marginBottom: '12px',
  } as React.CSSProperties,
  progressLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  progressFill: {
    height: '8px',
    borderRadius: '4px',
    flex: 1,
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  progressPercentage: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1a1a1a',
  } as React.CSSProperties,
  storageInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  } as React.CSSProperties,
};
