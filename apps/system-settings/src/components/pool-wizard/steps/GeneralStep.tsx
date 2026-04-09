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
      {/* Pool Name */}
      <div style={styles.compactSection}>
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
        {errors.name && (
          <div style={styles.error}>
            <AlertCircle size={12} />
            {errors.name}
          </div>
        )}
        {!errors.name && <span style={styles.hint}>仅支持字母、数字和下划线</span>}
      </div>

      {/* Encryption */}
      <div style={styles.compactSection}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>加密</label>
          <select
            value={encryption ? encryptionType : 'none'}
            onChange={(e) => handleEncryptionSelectChange(e.target.value)}
            style={styles.select}
          >
            <option value="none">无加密</option>
            <option value="software">软件加密</option>
            {hasSedCapableDisks && <option value="sed">SED</option>}
          </select>
        </div>
      </div>

      {/* Encryption Standard */}
      {encryption && encryptionType === 'software' && (
        <div style={styles.compactSection}>
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
        </div>
      )}

      {/* SED Password */}
      {encryption && encryptionType === 'sed' && (
        <div style={styles.compactSection}>
          <div style={styles.fieldRow}>
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
          </div>
          {errors.sedPassword && (
            <div style={styles.error}>
              <AlertCircle size={12} />
              {errors.sedPassword}
            </div>
          )}
          <span style={styles.hint}>此密码将用于解锁自加密硬盘，请妥善保管</span>
        </div>
      )}

      {/* Non-Unique Serial Disks Warning */}
      {nonUniqueSerialDisksCount > 0 && (
        <div style={styles.warningSection}>
          <div style={styles.warningHeader}>
            <AlertCircle size={14} style={{ color: colors.warning }} />
            <span style={styles.warningTitle}>
              检测到 {nonUniqueSerialDisksCount} 块硬盘序列号非唯一
            </span>
          </div>
          <p style={styles.warningText}>
            可能因线缆问题导致，添加到池中可能丢失数据
          </p>
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 16px',
  },
  compactSection: {
    marginBottom: 12,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: colors.text,
    minWidth: 72,
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box' as const,
    backgroundColor: colors.cardBg,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  select: {
    flex: 1,
    padding: '8px 10px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box' as const,
    backgroundColor: colors.cardBg,
    cursor: 'pointer',
    color: colors.text,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%238e8e93' d='M5 7L1 3h8z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    fontSize: 12,
    color: colors.danger,
  },
  hint: {
    display: 'block',
    marginTop: 4,
    marginLeft: 84,
    fontSize: 11,
    color: colors.textSecondary,
  },
  warningSection: {
    marginTop: 8,
    padding: '10px 12px',
    backgroundColor: `${colors.warning}10`,
    border: `1px solid ${colors.warning}30`,
    borderRadius: 8,
  },
  warningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.text,
  },
  warningText: {
    margin: '4px 0 8px 0',
    fontSize: 11,
    color: colors.textSecondary,
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: 8,
  },
  radioOption: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    backgroundColor: colors.cardBg,
  },
  radioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  radioInput: {
    accentColor: colors.primary,
  },
  radioContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  radioLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.text,
  },
  radioDescription: {
    fontSize: 10,
    color: colors.textSecondary,
  },
}
