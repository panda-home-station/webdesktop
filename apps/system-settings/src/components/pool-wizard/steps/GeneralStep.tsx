/**
 * General Step Component
 * Pool name and encryption settings
 * iPad-style bubble card layout
 */

import React, { useState, useEffect } from 'react'
import { AlertCircle, HardDrive, Key, AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from '@desktop/components/ConfirmDialog'
import { usePoolWizardStore } from '../store/poolWizardStore'
import { poolService } from '@truenas/services/pool'
import { diskService } from '@truenas/services/disk'
import { isSedCapableDisk } from '@truenas/types/disk-types'
import { colors } from '@apps/system-settings/styles/theme'

// Encryption warning message (same as webui)
const ENCRYPTION_WARNING_MESSAGE = `池级加密不应用于存储池本身或池中的磁盘。它应用于共享池名称的根数据集以及创建的任何子数据集，除非您在创建子数据集时更改加密设置。

请妥善保存加密密钥，丢失后将无法恢复数据。`

interface GeneralStepProps {
  errors: Record<string, string>
}

interface EncryptionAlgorithmOption {
  value: string
  label: string
}

export function GeneralStep({ errors }: GeneralStepProps) {
  const {
    name,
    encryption,
    encryptionType,
    encryptionAlgorithm,
    sedPassword,
    allowNonUniqueSerialDisks,
    allDisks,
    setName,
    setEncryption,
    setEncryptionType,
    setEncryptionAlgorithm,
    setSedPassword,
    setAllowNonUniqueSerialDisks,
  } = usePoolWizardStore()

  const nonUniqueSerialDisksCount = (() => {
    if (allDisks.length === 0) return 0
    return allDisks.filter((disk) => disk.duplicate_serial && disk.duplicate_serial.length > 0).length
  })()

  const [showEncryptionWarning, setShowEncryptionWarning] = useState(false)
  const [algorithmOptions, setAlgorithmOptions] = useState<EncryptionAlgorithmOption[]>([])
  const [hasSedCapableDisks, setHasSedCapableDisks] = useState(false)

  // Load encryption algorithm options
  useEffect(() => {
    const loadAlgorithmOptions = async () => {
      try {
        const choices = await poolService.getEncryptionAlgorithmChoices()
        const options: EncryptionAlgorithmOption[] = Object.entries(choices).map(
          ([value, label]) => ({ value, label })
        )
        setAlgorithmOptions(options)
      } catch {
        setAlgorithmOptions([
          { value: 'AES-128-GCM', label: 'AES-128-GCM' },
          { value: 'AES-192-GCM', label: 'AES-192-GCM' },
          { value: 'AES-256-GCM', label: 'AES-256-GCM' },
        ])
      }
    }
    loadAlgorithmOptions()
  }, [])

  // Check for SED-capable disks
  useEffect(() => {
    const checkSedCapableDisks = async () => {
      try {
        const diskDetails = await diskService.details({ join_partitions: true })
        const diskList = [...diskDetails.used, ...diskDetails.unused]
        const hasSed = diskList.some((disk) => isSedCapableDisk(disk))
        setHasSedCapableDisks(hasSed)
      } catch {
        setHasSedCapableDisks(false)
      }
    }
    checkSedCapableDisks()
  }, [])

  // Handle encryption type changes
  const handleEncryptionTypeChange = (type: 'none' | 'software' | 'sed') => {
    if (type === 'software' && encryptionType !== 'software') {
      setShowEncryptionWarning(true)
    } else if (type === 'none') {
      setEncryption(false)
      setEncryptionType('none')
    } else {
      setEncryption(true)
      setEncryptionType(type)
    }
  }

  const handleEncryptionWarningConfirm = () => {
    setShowEncryptionWarning(false)
    setEncryption(true)
    setEncryptionType('software')
  }

  const handleEncryptionWarningCancel = () => {
    setShowEncryptionWarning(false)
  }

  const handleEncryptionSelectChange = (value: string) => {
    if (value === 'none') {
      handleEncryptionTypeChange('none')
    } else if (value === 'software') {
      handleEncryptionTypeChange('software')
    } else if (value === 'sed') {
      setEncryption(true)
      setEncryptionType('sed')
    }
  }

  return (
    <div style={styles.container}>
      {/* 气泡框: 存储池设置 */}
      <div style={styles.bubbleCard}>
        <div style={styles.bubbleHeader}>
          <div style={styles.bubbleTitleRow}>
            <HardDrive size={16} color={colors.primary} />
            <span style={styles.bubbleTitle}>存储池</span>
          </div>
        </div>
        <div style={styles.formBody}>
          {/* 池名称 */}
          <div style={styles.formRow}>
            <span style={styles.formLabel}>
              池名称 <span style={styles.requiredStar}>*</span>
            </span>
            <div style={styles.formInput}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: pool1"
                style={{
                  ...styles.modernInput,
                  ...(errors.name ? styles.inputError : {}),
                }}
              />
              {errors.name && (
                <div style={styles.errorRow}>
                  <AlertCircle size={12} />
                  <span>{errors.name}</span>
                </div>
              )}
              {!errors.name && (
                <span style={styles.hint}>仅支持字母、数字和下划线</span>
              )}
            </div>
          </div>

          {/* 加密 */}
          <div style={styles.formRow}>
            <span style={styles.formLabel}>加密</span>
            <div style={styles.formInput}>
              <select
                value={encryption ? encryptionType : 'none'}
                onChange={(e) => handleEncryptionSelectChange(e.target.value)}
                style={styles.modernSelect}
              >
                <option value="none">无加密</option>
                <option value="software">软件加密</option>
                {hasSedCapableDisks && <option value="sed">SED</option>}
              </select>
            </div>
          </div>

          {/* 加密标准 (条件显示) */}
          {encryption && encryptionType === 'software' && (
            <div style={styles.formRow}>
              <span style={styles.formLabel}>加密标准</span>
              <div style={styles.formInput}>
                <select
                  value={encryptionAlgorithm}
                  onChange={(e) => setEncryptionAlgorithm(e.target.value)}
                  style={styles.modernSelect}
                >
                  {algorithmOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 气泡框 4: SED 密码 (条件显示) */}
      {encryption && encryptionType === 'sed' && (
        <div style={styles.bubbleCard}>
          <div style={styles.bubbleHeader}>
            <div style={styles.bubbleTitleRow}>
              <Key size={16} color={colors.primary} />
              <span style={styles.bubbleTitle}>SED 密码</span>
              <span style={styles.requiredBadge}>必填</span>
            </div>
          </div>
          <div style={styles.bubbleContent}>
            <input
              type="password"
              value={sedPassword || ''}
              onChange={(e) => setSedPassword(e.target.value || null)}
              placeholder="至少8个字符"
              style={{
                ...styles.modernInput,
                ...(errors.sedPassword ? styles.inputError : {}),
              }}
            />
            {errors.sedPassword && (
              <div style={styles.errorRow}>
                <AlertCircle size={12} />
                <span>{errors.sedPassword}</span>
              </div>
            )}
            <span style={styles.hint}>此密码将用于解锁自加密硬盘，请妥善保管</span>
          </div>
        </div>
      )}

      {/* 警告气泡框: 非唯一序列号硬盘 */}
      {nonUniqueSerialDisksCount > 0 && (
        <div style={styles.warningBubble}>
          <div style={styles.warningIcon}>
            <AlertTriangle size={20} color={colors.warning} />
          </div>
          <div style={styles.warningContent}>
            <span style={styles.warningTitle}>
              检测到 {nonUniqueSerialDisksCount} 块硬盘序列号非唯一
            </span>
            <span style={styles.warningText}>
              可能因线缆问题导致，添加到池中可能丢失数据
            </span>
            <div style={styles.radioGroup}>
              <RadioOption
                label="不允许"
                description="推荐，将排除这些硬盘"
                checked={!allowNonUniqueSerialDisks}
                onChange={() => setAllowNonUniqueSerialDisks(false)}
              />
              <RadioOption
                label="允许"
                description="不推荐，存在数据风险"
                checked={allowNonUniqueSerialDisks}
                onChange={() => setAllowNonUniqueSerialDisks(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Encryption Warning Dialog */}
      <ConfirmDialog
        open={showEncryptionWarning}
        title="软件加密警告"
        message={ENCRYPTION_WARNING_MESSAGE}
        confirmText="我已了解并确认"
        cancelText="取消"
        onConfirm={handleEncryptionWarningConfirm}
        onCancel={handleEncryptionWarningCancel}
        dangerous={false}
      />
    </div>
  )
}

function RadioOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      style={{
        ...styles.radioOption,
        ...(checked ? styles.radioOptionSelected : {}),
      }}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={styles.radioInput}
      />
      <div style={styles.radioContent}>
        <span style={styles.radioLabel}>{label}</span>
        <span style={styles.radioDescription}>{description}</span>
      </div>
    </label>
  )
}

// ════════════════════════════════════════════════════════════
// iPad-style Bubble Card Layout
// ════════════════════════════════════════════════════════════
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
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  bubbleTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  bubbleTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: 500,
    color: colors.primary,
    backgroundColor: `${colors.primary}15`,
    padding: '2px 8px',
    borderRadius: 10,
  },
  bubbleContent: {
    padding: 16,
  },

  // 表单布局
  formBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: 500,
    color: colors.text,
    flexShrink: 0,
    minWidth: 80,
    paddingTop: 12,
  },
  formInput: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  requiredStar: {
    color: colors.danger,
    marginLeft: 2,
  },

  // 现代风格输入框
  modernInput: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    backgroundColor: colors.background,
    color: colors.text,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
  },
  modernSelect: {
    width: '100%',
    padding: '14px 40px 14px 16px',
    fontSize: 16,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    backgroundColor: colors.background,
    color: colors.text,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8e93' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
  },
  iOSSelect: {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    backgroundColor: colors.background,
    color: colors.text,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8e93' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: `${colors.danger}08`,
    boxShadow: `0 0 0 3px ${colors.danger}15`,
  },

  // 提示和错误
  hint: {
    display: 'block',
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontSize: 12,
    color: colors.danger,
  },

  // 警告气泡框
  warningBubble: {
    display: 'flex',
    gap: 12,
    padding: 16,
    backgroundColor: `${colors.warning}10`,
    borderRadius: 16,
    border: `1px solid ${colors.warning}30`,
  },
  warningIcon: {
    flexShrink: 0,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  warningText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  radioGroup: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  radioOption: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    backgroundColor: colors.cardBg,
  },
  radioOptionSelected: {
    border: `2px solid ${colors.primary}`,
    backgroundColor: `${colors.primary}10`,
  },
  radioInput: {
    accentColor: colors.primary,
    width: 18,
    height: 18,
  },
  radioContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  radioDescription: {
    fontSize: 11,
    color: colors.textSecondary,
  },
}
