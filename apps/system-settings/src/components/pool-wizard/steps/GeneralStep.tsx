/**
 * General Step Component
 * Pool name and encryption settings
 */

import React, { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { ConfirmDialog } from '@desktop/components/ConfirmDialog'
import { usePoolWizardStore } from '../store/poolWizardStore'
import { poolService } from '@truenas/services/pool'
import { diskService } from '@truenas/services/disk'
import { isSedCapableDisk } from '@truenas/types/disk-types'
import { colors } from '@apps/system-settings/styles/theme'

// Encryption warning message (same as webui)
const ENCRYPTION_WARNING_MESSAGE = `加密功能适用于存储敏感数据的用户。
池级加密不应用于存储池本身或池中的磁盘。它应用于共享池名称的根数据集以及创建的任何子数据集，除非您在创建子数据集时更改加密设置。

有关加密的更多信息，请参阅 TrueNAS 文档中心。`

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
    // 使用和 webui 相同的方法: 检查 disk.duplicate_serial?.length > 0
    return allDisks.filter((disk) => disk.duplicate_serial && disk.duplicate_serial.length > 0).length
  })()

  const [showEncryptionWarning, setShowEncryptionWarning] = useState(false)
  const [pendingEncryptionType, setPendingEncryptionType] = useState<string | null>(null)
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
        // Fallback options if API fails
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
    // If selecting software encryption, show warning first
    if (type === 'software' && encryptionType !== 'software') {
      setPendingEncryptionType(type)
      setShowEncryptionWarning(true)
    } else {
      setEncryptionType(type)
    }
  }

  const handleEncryptionWarningConfirm = () => {
    setShowEncryptionWarning(false)
    if (pendingEncryptionType) {
      setEncryptionType(pendingEncryptionType)
    }
    setPendingEncryptionType(null)
  }

  const handleEncryptionWarningCancel = () => {
    setShowEncryptionWarning(false)
    setPendingEncryptionType(null)
    // Reset to none if user cancels
    if (encryptionType === 'software') {
      setEncryptionType('none')
    }
  }

  return (
    <div style={styles.container}>
      {/* Pool Name */}
      <div style={styles.fieldRow}>
        <label style={styles.label}>池名称 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如: pool1"
          style={{
            ...styles.input,
            ...(errors.name ? styles.inputError : {}),
          }}
        />
      </div>

      {/* Encryption */}
      <div style={styles.fieldRow}>
        <label style={styles.label}>启用加密</label>
        <select
          value={encryption ? encryptionType : 'none'}
          onChange={(e) => {
            const value = e.target.value as 'none' | 'software' | 'sed'
            if (value === 'software' && encryptionType !== 'software') {
              setEncryption(true)
              handleEncryptionTypeChange('software')
            } else {
              setEncryption(value !== 'none')
              setEncryptionType(value)
            }
          }}
          style={styles.select}
        >
          <option value="none">无加密</option>
          <option value="software">软件加密</option>
          {hasSedCapableDisks && <option value="sed">SED (自加密硬盘)</option>}
        </select>
      </div>

      {/* Encryption Standard (shown when Software encryption is selected) */}
      {encryption && encryptionType === 'software' && (
        <div style={styles.fieldRow}>
          <label style={styles.label}>加密标准</label>
          <select
            value={encryptionAlgorithm}
            onChange={(e) => setEncryptionAlgorithm(e.target.value)}
            style={styles.select}
          >
            {algorithmOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* SED Password */}
      {encryption && encryptionType === 'sed' && (
        <div style={styles.field}>
          <label style={styles.label}>SED 密码 *</label>
          <input
            type="password"
            value={sedPassword || ''}
            onChange={(e) => setSedPassword(e.target.value || null)}
            placeholder="至少8个字符"
            style={{
              ...styles.input,
              ...(errors.sedPassword ? styles.inputError : {}),
            }}
          />
          {errors.sedPassword && (
            <div style={styles.error}>
              <AlertCircle size={14} />
              {errors.sedPassword}
            </div>
          )}
          <span style={styles.hint}>
            此密码将用于解锁自加密硬盘，请妥善保管
          </span>
        </div>
      )}

      {/* Non-Unique Serial Disks Warning */}
      {nonUniqueSerialDisksCount > 0 && (
        <div style={styles.field}>
          <div style={styles.warning}>
            <AlertCircle size={16} style={{ color: colors.warning, flexShrink: 0 }} />
            <div>
              <span>存在 {nonUniqueSerialDisksCount} 块硬盘具有非唯一序列号</span>
            </div>
          </div>
          <p style={styles.warningText}>
            非唯一序列号可能是由于线缆问题导致的，将此类硬盘添加到池中可能导致数据丢失。
          </p>
          <div style={styles.radioGroupHorizontal}>
            <label
              style={{
                ...styles.radioLabel,
                ...(!allowNonUniqueSerialDisks ? styles.radioLabelSelected : {}),
              }}
            >
              <input
                type="radio"
                name="allowNonUnique"
                checked={!allowNonUniqueSerialDisks}
                onChange={() => setAllowNonUniqueSerialDisks(false)}
                style={{ marginRight: 8 }}
              />
              不允许非唯一序列号硬盘（推荐）
            </label>
            <label
              style={{
                ...styles.radioLabel,
                ...(allowNonUniqueSerialDisks ? styles.radioLabelSelected : {}),
              }}
            >
              <input
                type="radio"
                name="allowNonUnique"
                checked={allowNonUniqueSerialDisks}
                onChange={() => setAllowNonUniqueSerialDisks(true)}
                style={{ marginRight: 8 }}
              />
              允许非唯一序列号硬盘（不推荐）
            </label>
          </div>
        </div>
      )}

      {/* Encryption Warning Dialog */}
      <ConfirmDialog
        open={showEncryptionWarning}
        title="警告"
        message={ENCRYPTION_WARNING_MESSAGE}
        confirmText="我已了解"
        cancelText="取消"
        onConfirm={handleEncryptionWarningConfirm}
        onCancel={handleEncryptionWarningCancel}
        dangerous={false}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
  },
  field: {
    marginBottom: 20,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    whiteSpace: 'nowrap' as const,
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: colors.danger,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box' as const,
    backgroundColor: colors.cardBg,
    cursor: 'pointer',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    fontSize: 13,
    color: colors.danger,
  },
  hint: {
    display: 'block',
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  radioGroupHorizontal: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: 12,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  radioLabelSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
    color: colors.primary,
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '12px 14px',
    backgroundColor: `${colors.warning}15`,
    border: `1px solid ${colors.warning}40`,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
    color: colors.text,
  },
  warningText: {
    margin: '0 0 12px 0',
    fontSize: 13,
    color: colors.textSecondary,
  },
}
