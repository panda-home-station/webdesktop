/**
 * Review Step Component
 * Review configuration and create pool
 */

import React from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { usePoolWizardStore } from '../store/poolWizardStore'
import { PoolSummary } from '../components/PoolSummary'
import { validateAllSteps } from '../utils/validation'
import { colors } from '@apps/system-settings/styles/theme'

export function ReviewStep() {
  const {
    name,
    topology,
    encryption,
    encryptionType,
    isCreating,
    error,
    createPool,
  } = usePoolWizardStore()

  const validation = validateAllSteps(usePoolWizardStore.getState())

  const handleCreate = async () => {
    await createPool()
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>评审</h3>
      <p style={styles.description}>检查配置并创建池</p>

      {/* Pool Summary */}
      <PoolSummary
        name={name}
        topology={topology}
        encryption={encryption}
        encryptionType={encryptionType}
      />

      {/* Validation Errors */}
      {!validation.isValid && (
        <div style={styles.errorBox}>
          <div style={styles.errorHeader}>
            <AlertCircle size={18} />
            请修复以下问题
          </div>
          <ul style={styles.errorList}>
            {Object.entries(validation.errors).map(([key, message]) => (
              <li key={key} style={styles.errorItem}>
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {Object.keys(validation.warnings).length > 0 && (
        <div style={styles.warningBox}>
          <div style={styles.warningHeader}>注意事项</div>
          <ul style={styles.warningList}>
            {Object.entries(validation.warnings).map(([key, message]) => (
              <li key={key} style={styles.warningItem}>
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Global Error */}
      {error && (
        <div style={styles.errorBox}>
          <div style={styles.errorHeader}>
            <AlertCircle size={18} />
            创建失败
          </div>
          <p style={styles.errorMessage}>{error}</p>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!validation.isValid || isCreating}
        style={{
          ...styles.createButton,
          ...(!validation.isValid || isCreating ? styles.createButtonDisabled : {}),
        }}
      >
        {isCreating ? (
          <>
            <Loader2 size={18} className="spin" />
            创建中...
          </>
        ) : (
          '创建池'
        )}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: 18,
    fontWeight: 600,
    color: colors.text,
  },
  description: {
    margin: '0 0 24px 0',
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    border: `1px solid ${colors.danger}30`,
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: colors.danger,
    marginBottom: 8,
  },
  errorList: {
    margin: 0,
    paddingLeft: 20,
  },
  errorItem: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: 4,
  },
  errorMessage: {
    margin: 0,
    fontSize: 13,
    color: colors.danger,
  },
  warningBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    border: '1px solid #ff980030',
  },
  warningHeader: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e65100',
    marginBottom: 8,
  },
  warningList: {
    margin: 0,
    paddingLeft: 20,
  },
  warningItem: {
    fontSize: 13,
    color: '#e65100',
    marginBottom: 4,
  },
  createButton: {
    marginTop: 24,
    width: '100%',
    padding: '14px 24px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}
