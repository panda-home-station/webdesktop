/**
 * Dataset View Component
 * Display dataset tree and management options
 */

import React, { useEffect, useState } from 'react';
import { useStorageDashboardStore } from '@truenas/stores/storage-dashboard';
import { datasetService } from '@truenas/services/dataset';
import { Dataset, DatasetDetails } from '@truenas/types/dataset-types';
import { DatasetType } from '@truenas/types/dataset-enum-types';
import {
  formatBytes,
  getDatasetName,
  isVolume,
  isFilesystem,
  getDatasetUsedPercentage,
  getDatasetIcon,
  getDatasetIconColor,
} from '@truenas/utils/dataset.utils';
import DatasetTree from './DatasetTree';
import DatasetDetailsPanel from './DatasetDetailsPanel';

export default function DatasetView({ poolId }: { poolId: number }) {
  const {
    isLoading,
    rootDatasets,
    loadDashboard,
  } = useStorageDashboardStore();

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetails | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, [poolId]);

  const loadDatasets = async () => {
    try {
      const poolDatasets = await datasetService.query([
        ['pool', '=', poolId],
      ], { extra: { retrieve_children: true } });
      setDatasets(poolDatasets);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const handleDatasetSelect = async (dataset: Dataset) => {
    try {
      const details = await datasetService.get(dataset.id);
      setSelectedDataset(details[0]);
    } catch (error) {
      console.error('Failed to load dataset details:', error);
    }
  };

  const handleDatasetCreate = async (parentId: string, params: unknown) => {
    try {
      await datasetService.create(params);
      await loadDatasets();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create dataset:', error);
    }
  };

  const handleDatasetDelete = async (datasetId: string) => {
    try {
      await datasetService.delete(datasetId, { recursive: true });
      await loadDatasets();
      if (selectedDataset?.id === datasetId) {
        setSelectedDataset(null);
      }
    } catch (error) {
      console.error('Failed to delete dataset:', error);
    }
  };

  const counts = {
    total: countDatasets(datasets),
    filesystems: countDatasetsByType(datasets, DatasetType.Filesystem),
    volumes: countDatasetsByType(datasets, DatasetType.Volume),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Datasets</h2>
        <p style={styles.subtitle}>
          Manage datasets and storage volumes in your pool
        </p>
      </div>

      {/* Summary Stats */}
      <div style={styles.stats}>
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Filesystems" value={counts.filesystems} />
        <StatCard label="Volumes" value={counts.volumes} />
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Dataset Tree */}
        <div style={styles.treeSection}>
          <DatasetTree
            datasets={datasets}
            onSelect={handleDatasetSelect}
            onCreate={(parentId) => setShowCreateDialog(true)}
            onDelete={handleDatasetDelete}
          />
        </div>

        {/* Dataset Details Panel */}
        {selectedDataset && (
          <div style={styles.detailsSection}>
            <DatasetDetailsPanel
              dataset={selectedDataset}
              onClose={() => setSelectedDataset(null)}
              onUpdate={loadDatasets}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function countDatasets(datasets: Dataset[]): number {
  const count = (items: Dataset[]): number => {
    let total = items.length;
    items.forEach((item) => {
      if (item.children) {
        total += count(item.children);
      }
    });
    return total;
  };
  return count(datasets);
}

function countDatasetsByType(datasets: Dataset[], type: DatasetType): number {
  let count = 0;
  datasets.forEach((item) => {
    if (item.type === type) {
      count++;
    }
    if (item.children) {
      count += countDatasetsByType(item.children, type);
    }
  });
  return count;
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <span style={styles.statValue}>{value.toLocaleString()}</span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  header: {
    padding: '24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#666666',
  } as React.CSSProperties,
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '13px',
    color: '#666666',
  } as React.CSSProperties,
  statValue: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1a1a1a',
  } as React.CSSProperties,
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  } as React.CSSProperties,
  treeSection: {
    flex: 1,
    overflow: 'auto',
    borderRight: '1px solid #e0e0e0',
  } as React.CSSProperties,
  detailsSection: {
    width: '400px',
    overflow: 'auto',
    backgroundColor: 'white',
  } as React.CSSProperties,
};
