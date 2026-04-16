/**
 * Container Images Component
 * Manage Docker container images
 */

import { useEffect, useState } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { ContainerImage } from '@truenas/types/app-types';

export function ContainerImages() {
  const {
    containerImages,
    containerImagesLoading,
    loadContainerImages,
    pullImage,
    deleteImage,
  } = useAppsStore();

  const [showPullDialog, setShowPullDialog] = useState(false);
  const [pullProgress, setPullProgress] = useState<{ percent: number; description?: string } | null>(null);
  const [pulling, setPulling] = useState(false);

  // Pull dialog state
  const [pullRegistry, setPullRegistry] = useState('docker.io');
  const [pullImageName, setPullImageName] = useState('');
  const [pullTag, setPullTag] = useState('latest');

  useEffect(() => {
    loadContainerImages();
  }, [loadContainerImages]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const getRepoName = (image: ContainerImage): string => {
    if (image.repo_tags?.length) {
      return image.repo_tags[0].split(':')[0];
    }
    if (image.repo_digests?.length) {
      return image.repo_digests[0].split('@')[0];
    }
    return image.id.substring(0, 20);
  };

  const getTag = (image: ContainerImage): string => {
    if (image.repo_tags?.length) {
      const parts = image.repo_tags[0].split(':');
      return parts.length > 1 ? parts[1] : 'latest';
    }
    return 'none';
  };

  const handlePullImage = async () => {
    if (!pullImageName.trim()) return;

    setPulling(true);
    setPullProgress({ percent: 0, description: 'Starting...' });

    try {
      await pullImage(pullRegistry, pullImageName, pullTag, (progress) => {
        setPullProgress(progress);
      });
      setShowPullDialog(false);
      setPullImageName('');
      setPullTag('latest');
    } catch (error) {
      console.error('Failed to pull image:', error);
    } finally {
      setPulling(false);
      setPullProgress(null);
    }
  };

  const handleDeleteImage = async (image: ContainerImage) => {
    const name = getRepoName(image);
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteImage(image.id, true);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>Container Images</h2>
          <span style={styles.count}>{containerImages.length} images</span>
        </div>
        <button style={styles.pullButton} onClick={() => setShowPullDialog(true)}>
          Pull Image
        </button>
      </div>

      {/* Pull Dialog */}
      {showPullDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Pull Container Image</h3>

            {pulling ? (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${pullProgress?.percent || 0}%`,
                    }}
                  />
                </div>
                <p style={styles.progressText}>
                  {pullProgress?.description || 'Pulling...'}
                </p>
              </div>
            ) : (
              <div style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Registry</label>
                  <select
                    value={pullRegistry}
                    onChange={(e) => setPullRegistry(e.target.value)}
                    style={styles.select}
                  >
                    <option value="docker.io">Docker Hub</option>
                    <option value="ghcr.io">GitHub Container Registry</option>
                    <option value="quay.io">Quay</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Image Name</label>
                  <input
                    type="text"
                    value={pullImageName}
                    onChange={(e) => setPullImageName(e.target.value)}
                    placeholder="library/nginx"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Tag</label>
                  <input
                    type="text"
                    value={pullTag}
                    onChange={(e) => setPullTag(e.target.value)}
                    placeholder="latest"
                    style={styles.input}
                  />
                </div>

                <div style={styles.dialogActions}>
                  <button
                    style={styles.cancelButton}
                    onClick={() => {
                      setShowPullDialog(false);
                      setPulling(false);
                    }}
                    disabled={pulling}
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.confirmButton}
                    onClick={handlePullImage}
                    disabled={!pullImageName.trim()}
                  >
                    Pull
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Images List */}
      {containerImagesLoading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading container images...</p>
        </div>
      ) : containerImages.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <h2 style={styles.emptyTitle}>No Container Images</h2>
          <p style={styles.emptyText}>
            Pull images from a registry to get started.
          </p>
          <button style={styles.pullButton} onClick={() => setShowPullDialog(true)}>
            Pull Image
          </button>
        </div>
      ) : (
        <div style={styles.imagesList}>
          {containerImages.map((image) => (
            <div key={image.id} style={styles.imageCard}>
              <div style={styles.imageIcon}>🖼️</div>
              <div style={styles.imageInfo}>
                <div style={styles.imageName}>{getRepoName(image)}</div>
                <div style={styles.imageTag}>:{getTag(image)}</div>
                <div style={styles.imageMeta}>
                  <span>{formatSize(image.size)}</span>
                  <span>•</span>
                  <span>{formatDate(image.created)}</span>
                </div>
              </div>
              <div style={styles.imageActions}>
                <span
                  style={{
                    ...styles.officialBadge,
                    ...(image.is_official ? {} : styles.unofficialBadge),
                  }}
                >
                  {image.is_official ? 'Official' : 'Custom'}
                </span>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDeleteImage(image)}
                >
                  Delete
                </button>
              </div>
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
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  count: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: '2px 8px',
    borderRadius: 10,
  },
  pullButton: {
    padding: '8px 16px',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  imagesList: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  imageCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
  },
  imageIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  imageInfo: {
    flex: 1,
    minWidth: 0,
  },
  imageName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  imageTag: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  imageMeta: {
    display: 'flex',
    gap: 8,
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  imageActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  officialBadge: {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: '#e8f5e9',
    color: '#4caf50',
  },
  unofficialBadge: {
    backgroundColor: '#fff3e0',
    color: '#ff9800',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
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
    margin: '0 0 20px',
  },
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 480,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#666',
  },
  input: {
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    outline: 'none',
  },
  select: {
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #e0e0e0',
    borderRadius: 6,
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  dialogActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976d2',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
};

export default ContainerImages;