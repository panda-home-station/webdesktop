/**
 * Docker Registries Component
 * Manage Docker image registries
 */

import { useEffect, useState } from 'react';
import { useAppsStore } from '@truenas/stores/apps';
import { DockerRegistry } from '@truenas/types/app-types';

export function DockerRegistries() {
  const {
    registries,
    registriesLoading,
    loadRegistries,
    createRegistry,
    updateRegistry,
    deleteRegistry,
  } = useAppsStore();

  const [showDialog, setShowDialog] = useState(false);
  const [editingRegistry, setEditingRegistry] = useState<DockerRegistry | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    certificate: '',
    verify_cert: true,
  });

  useEffect(() => {
    loadRegistries();
  }, [loadRegistries]);

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      username: '',
      password: '',
      certificate: '',
      verify_cert: true,
    });
    setEditingRegistry(null);
  };

  const handleOpenDialog = (registry?: DockerRegistry) => {
    if (registry) {
      setEditingRegistry(registry);
      setFormData({
        name: registry.name,
        url: registry.url,
        username: registry.username || '',
        password: registry.password || '',
        certificate: registry.certificate || '',
        verify_cert: registry.verify_cert,
      });
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    try {
      if (editingRegistry) {
        await updateRegistry(editingRegistry.id, formData);
      } else {
        await createRegistry(formData as Omit<DockerRegistry, 'id'>);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save registry:', error);
    }
  };

  const handleDelete = async (registry: DockerRegistry) => {
    if (confirm(`Are you sure you want to delete ${registry.name}?`)) {
      try {
        await deleteRegistry(registry.id);
      } catch (error) {
        console.error('Failed to delete registry:', error);
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.title}>Docker Registries</h2>
          <span style={styles.count}>{registries.length} registries</span>
        </div>
        <button style={styles.addButton} onClick={() => handleOpenDialog()}>
          Add Registry
        </button>
      </div>

      {/* Registry Dialog */}
      {showDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>
              {editingRegistry ? 'Edit Registry' : 'Add Registry'}
            </h3>

            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Registry"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>URL</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://registry.example.com"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Username (optional)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password (optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="password"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Certificate (optional)</label>
                <textarea
                  value={formData.certificate}
                  onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                  placeholder="Paste certificate here..."
                  style={{ ...styles.input, height: 80, resize: 'vertical' as const }}
                />
              </div>

              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="verify_cert"
                  checked={formData.verify_cert}
                  onChange={(e) => setFormData({ ...formData, verify_cert: e.target.checked })}
                  style={styles.checkbox}
                />
                <label htmlFor="verify_cert" style={styles.checkboxLabel}>
                  Verify Certificate
                </label>
              </div>

              <div style={styles.dialogActions}>
                <button style={styles.cancelButton} onClick={handleCloseDialog}>
                  Cancel
                </button>
                <button
                  style={styles.saveButton}
                  onClick={handleSave}
                  disabled={!formData.name.trim() || !formData.url.trim()}
                >
                  {editingRegistry ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registries List */}
      {registriesLoading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading registries...</p>
        </div>
      ) : registries.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏠</div>
          <h2 style={styles.emptyTitle}>No Custom Registries</h2>
          <p style={styles.emptyText}>
            Add custom registries to pull images from private repositories.
          </p>
          <button style={styles.addButton} onClick={() => handleOpenDialog()}>
            Add Registry
          </button>
        </div>
      ) : (
        <div style={styles.registriesList}>
          {/* Default Docker Hub entry */}
          <div style={styles.registryCard}>
            <div style={styles.registryIcon}>🐳</div>
            <div style={styles.registryInfo}>
              <div style={styles.registryName}>Docker Hub</div>
              <div style={styles.registryUrl}>https://hub.docker.com</div>
              <div style={styles.registryMeta}>Default registry</div>
            </div>
            <div style={styles.registryBadge}>Default</div>
          </div>

          {registries.map((registry) => (
            <div key={registry.id} style={styles.registryCard}>
              <div style={styles.registryIcon}>🏠</div>
              <div style={styles.registryInfo}>
                <div style={styles.registryName}>{registry.name}</div>
                <div style={styles.registryUrl}>{registry.url}</div>
                <div style={styles.registryMeta}>
                  {registry.username ? `Authenticated as ${registry.username}` : 'No authentication'}
                  {!registry.verify_cert && ' • Certificate verification disabled'}
                </div>
              </div>
              <div style={styles.registryActions}>
                <button
                  style={styles.editButton}
                  onClick={() => handleOpenDialog(registry)}
                >
                  Edit
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(registry)}
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
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  registriesList: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  registryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
  },
  registryIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },
  registryInfo: {
    flex: 1,
    minWidth: 0,
  },
  registryName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a1a',
  },
  registryUrl: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  registryMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  registryBadge: {
    padding: '4px 10px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  registryActions: {
    display: 'flex',
    gap: 8,
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
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
    maxWidth: 500,
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
    fontFamily: 'inherit',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    cursor: 'pointer',
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
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default DockerRegistries;