/**
 * General Step Component
 * Pool name and encryption settings
 */

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { usePoolWizardStore } from '../store/poolWizardStore'
import { colors } from '@apps/system-settings/styles/theme'

interface GeneralStepProps {
  errors: Record<string, string>
}

export function GeneralStep({ errors }: GeneralStepProps) {
  const {
    name,
    encryption,
    encryptionType,
    sedPassword,
    setName,
    setEncryption,
    setEncryptionType,
    setSedPassword,
  } = usePoolWizardStore()

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>基本信息</h3>
      <p style={styles.description}>设置池名称和加密选项</p>

      {/* Pool Name */}
      <div style={styles.field}>
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
        {errors.name && (
          <div style={styles.error}>
            <AlertCircle size={14} />
            {errors.name}
          </div>
        )}
      </div>

      {/* Encryption */}
      <div style={styles.field}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={encryption}
            onChange={(e) => setEncryption(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          启用加密
        </label>
      </div>

      {/* Encryption Type */}
      {encryption && (
        <div style={styles.field}>
          <label style={styles.label}>加密类型</label>
          <div style={styles.radioGroup}>
            <label
              style={{
                ...styles.radioLabel,
                ...(encryptionType === 'none' ? styles.radioLabelSelected : {}),
              }}
            >
              <input
                type="radio"
                name="encryptionType"
                value="none"
                checked={encryptionType === 'none'}
                onChange={() => setEncryptionType('none')}
                style={{ marginRight: 8 }}
              />
              无加密
            </label>
            <label
              style={{
                ...styles.radioLabel,
                ...(encryptionType === 'software' ? styles.radioLabelSelected : {}),
              }}
            >
              <input
                type="radio"
                name="encryptionType"
                value="software"
                checked={encryptionType === 'software'}
                onChange={() => setEncryptionType('software')}
                style={{ marginRight: 8 }}
              />
              软件加密
            </label>
            <label
              style={{
                ...styles.radioLabel,
                ...(encryptionType === 'sed' ? styles.radioLabelSelected : {}),
              }}
            >
              <input
                type="radio"
                name="encryptionType"
                value="sed"
                checked={encryptionType === 'sed'}
                onChange={() => setEncryptionType('sed')}
                style={{ marginRight: 8 }}
              />
              SED (自加密硬盘)
            </label>
          </div>
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
  field: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  input: {
    width: '100%',
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
}
