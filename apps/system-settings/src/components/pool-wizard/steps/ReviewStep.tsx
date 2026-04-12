/**
 * Review Step Component
 * Review configuration and create pool
 */

import React, { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { usePoolWizardStore } from '../store/poolWizardStore'
import { PoolSummary } from '../components/PoolSummary'
import { validateAllSteps } from '../utils/validation'
import { ConfirmDialog } from '@desktop/components/ConfirmDialog'
import { colors } from '@apps/system-settings/styles/theme'

export function ReviewStep() {
  const {
    name,
    topology,
    encryption,
    encryptionType,
    isCreating,
    createdSuccessfully,
    error,
    createPool,
  } = usePoolWizardStore()

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const validation = validateAllSteps(usePoolWizardStore.getState())

  const handleCreate = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirm = async () => {
    setShowConfirmDialog(false)
    try {
      await createPool()
    } catch {
      // Error is handled in store
    }
  }

  return (
    <div style={styles.container}>
      {/* 气泡框 1: 标题 */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <h3 style={styles.title}>评审配置</h3>
          <p style={styles.description}>检查以下配置并创建存储池</p>
        </div>
      </div>

      {/* Pool Summary */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <span style={styles.bubbleTitle}>配置摘要</span>
        </div>
        <div style={styles.bubbleContent}>
          <PoolSummary
            name={name}
            topology={topology}
            encryption={encryption}
            encryptionType={encryptionType}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.isValid && (
        <div style={styles.errorBubble}>
          <AlertCircle size={18} color={colors.danger} />
          <div>
            <div style={styles.errorHeader}>请修复以下问题</div>
            <ul style={styles.errorList}>
              {Object.entries(validation.errors).map(([key, message]) => (
                <li key={key} style={styles.errorItem}>
                  {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Warnings */}
      {Object.keys(validation.warnings).length > 0 && (
        <div style={styles.warningBubble}>
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
        <div style={styles.errorBubble}>
          <AlertCircle size={18} color={colors.danger} />
          <div>
            <div style={styles.errorHeader}>创建失败</div>
            <p style={styles.errorMessage}>{error}</p>
          </div>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreate}
        disabled={!validation.isValid || isCreating || createdSuccessfully}
        style={{
          ...styles.createButton,
          ...(!validation.isValid || isCreating || createdSuccessfully ? styles.createButtonDisabled : {}),
          ...(createdSuccessfully ? styles.createButtonSuccess : {}),
        }}
      >
        {isCreating ? (
          <>
            <Loader2 size={18} className="spin" />
            创建中...
          </>
        ) : createdSuccessfully ? (
          '存储池已创建'
        ) : (
          '创建存储池'
        )}
      </button>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        title="警告"
        message="所有添加的磁盘上的内容将被擦除。确定要继续吗？"
        confirmText="确认"
        cancelText="取消"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmDialog(false)}
        dangerous={true}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  // 气泡框基础样式
  bubbleCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  bubbleHeader: {
    padding: '14px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  bubbleTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  },
  bubbleContent: {
    padding: 16,
  },

  // 标题和描述
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: colors.text,
  },
  description: {
    margin: '6px 0 0 0',
    fontSize: 14,
    color: colors.textSecondary,
  },

  // 错误气泡
  errorBubble: {
    display: 'flex',
    gap: 12,
    padding: 16,
    backgroundColor: `${colors.danger}10`,
    borderRadius: 12,
    border: `1px solid ${colors.danger}30`,
  },
  errorHeader: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.danger,
    marginBottom: 6,
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

  // 警告气泡
  warningBubble: {
    padding: 16,
    backgroundColor: `${colors.warning}10`,
    borderRadius: 12,
    border: `1px solid ${colors.warning}30`,
  },
  warningHeader: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.warning,
    marginBottom: 8,
  },
  warningList: {
    margin: 0,
    paddingLeft: 20,
  },
  warningItem: {
    fontSize: 13,
    color: colors.warning,
    marginBottom: 4,
  },

  // 创建按钮
  createButton: {
    width: '100%',
    padding: '16px 24px',
    backgroundColor: colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 17,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  createButtonSuccess: {
    backgroundColor: colors.success,
  },
}
