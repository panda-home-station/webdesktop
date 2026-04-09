/**
 * Enclosure Step Component
 * Enclosure dispersal strategy settings and disk warnings
 */

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { usePoolWizardStore, selectNonUniqueSerialDisksCount } from '../store/poolWizardStore'
import { colors } from '@apps/system-settings/styles/theme'

interface EnclosureStepProps {
  errors: Record<string, string>
}

export function EnclosureStep({ errors }: EnclosureStepProps) {
  const {
    enclosures,
    useEnclosure,
    limitToEnclosure,
    dispersalStrategy,
    allowNonUniqueSerialDisks,
    setUseEnclosure,
    setLimitToEnclosure,
    setDispersalStrategy,
    setAllowNonUniqueSerialDisks,
  } = usePoolWizardStore()

  const nonUniqueSerialDisksCount = selectNonUniqueSerialDisksCount(
    usePoolWizardStore.getState()
  )

  // If no enclosures, show basic enclosure options
  const hasEnclosures = enclosures.length > 0

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>机箱选项</h3>
      <p style={styles.description}>配置磁盘的机箱分散策略</p>

      {/* Enclosure Selection */}
      {hasEnclosures && (
        <div style={styles.field}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={useEnclosure}
              onChange={(e) => setUseEnclosure(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            启用机箱分散
          </label>
          <span style={styles.hint}>
            将磁盘分散到多个机箱以提高可靠性
          </span>
        </div>
      )}

      {/* Dispersal Strategy */}
      {hasEnclosures && useEnclosure && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>分散策略</label>
            <div style={styles.strategyGrid}>
              <button
                onClick={() => setDispersalStrategy('none')}
                style={{
                  ...styles.strategyButton,
                  ...(dispersalStrategy === 'none' ? styles.strategyButtonSelected : {}),
                }}
              >
                <span style={styles.strategyTitle}>无分散</span>
                <span style={styles.strategyDesc}>不进行分散</span>
              </button>
              <button
                onClick={() => setDispersalStrategy('maximize')}
                style={{
                  ...styles.strategyButton,
                  ...(dispersalStrategy === 'maximize' ? styles.strategyButtonSelected : {}),
                }}
              >
                <span style={styles.strategyTitle}>最大化分散</span>
                <span style={styles.strategyDesc}>尽可能分散到不同机箱</span>
              </button>
              <button
                onClick={() => setDispersalStrategy('limit')}
                style={{
                  ...styles.strategyButton,
                  ...(dispersalStrategy === 'limit' ? styles.strategyButtonSelected : {}),
                }}
              >
                <span style={styles.strategyTitle}>限制到单机箱</span>
                <span style={styles.strategyDesc}>所有磁盘限制到同一机箱</span>
              </button>
            </div>
          </div>

          {/* Limit to Enclosure */}
          {dispersalStrategy === 'limit' && (
            <div style={styles.field}>
              <label style={styles.label}>选择机箱 *</label>
              <select
                value={limitToEnclosure || ''}
                onChange={(e) => setLimitToEnclosure(e.target.value || null)}
                style={styles.select}
              >
                <option value="">选择机箱...</option>
                {enclosures.map((enc) => (
                  <option key={enc.id} value={enc.id}>
                    {enc.label}
                  </option>
                ))}
              </select>
              {errors.limitToEnclosure && (
                <div style={styles.error}>
                  <AlertCircle size={14} />
                  {errors.limitToEnclosure}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Non-Unique Serial Disks Warning */}
      {nonUniqueSerialDisksCount > 0 && (
        <div style={styles.field}>
          <div style={styles.warningBox}>
            <div style={styles.warningHeader}>
              <AlertCircle size={18} />
              <span>存在 {nonUniqueSerialDisksCount} 块硬盘具有非唯一序列号</span>
            </div>
            <p style={styles.warningText}>
              非唯一序列号可能是由于线缆问题导致的，将此类硬盘添加到池中可能导致数据丢失。
            </p>
          </div>
          <div style={styles.radioGroup}>
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
  noEnclosure: {
    padding: 24,
    textAlign: 'center' as const,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  hint: {
    display: 'block',
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
  strategyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  strategyButton: {
    padding: '16px 12px',
    backgroundColor: colors.cardBg,
    border: `2px solid ${colors.border}`,
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  strategyButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  strategyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
  },
  strategyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    backgroundColor: colors.cardBg,
    cursor: 'pointer',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontSize: 13,
    color: colors.danger,
  },
  warningBox: {
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    border: '1px solid #ff980030',
    marginBottom: 16,
  },
  warningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 600,
    color: '#e65100',
    marginBottom: 8,
  },
  warningText: {
    margin: 0,
    fontSize: 13,
    color: '#e65100',
  },
}
