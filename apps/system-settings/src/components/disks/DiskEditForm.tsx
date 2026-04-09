/**
 * Disk Edit Form Component
 * Edit disk settings (description, power management, etc.)
 */

import { useState } from 'react'
import { Disk, DiskUpdate } from '@truenas/types/disk-types'
import { DiskStandby, getDiskStandbyLabel } from '@truenas/types/disk-standby-enum-types'
import { DiskPowerLevel, getDiskPowerLevelLabel } from '@truenas/types/disk-power-level-enum-types'
import { diskService } from '@truenas/services/disk'
import { colors } from '../../styles/theme'

interface DiskEditFormProps {
  disk: Disk
  onSave: (updatedDisk: Disk) => void
  onCancel: () => void
}

export function DiskEditForm({ disk, onSave, onCancel }: DiskEditFormProps) {
  const [description, setDescription] = useState(disk.description || '')
  const [hddstandby, setHddstandby] = useState<DiskStandby>(disk.hddstandby || DiskStandby.AlwaysOn)
  const [advpowermgmt, setAdvpowermgmt] = useState<DiskPowerLevel>(disk.advpowermgmt || DiskPowerLevel.Disabled)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const updateData: DiskUpdate = {
        description,
        hddstandby,
        advpowermgmt,
      }

      await diskService.update(disk.identifier, updateData)

      // Return updated disk
      onSave({
        ...disk,
        ...updateData,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update disk settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onCancel}>
          ← Back
        </button>
        <h2 style={styles.title}>Edit Disk: {disk.name}</h2>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Read-only Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Disk Information (Read-only)</h3>

          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={disk.name}
              disabled
              style={styles.inputDisabled}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Serial Number</label>
            <input
              type="text"
              value={disk.serial || 'Unknown'}
              disabled
              style={styles.inputDisabled}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Model</label>
            <input
              type="text"
              value={disk.model || 'Unknown'}
              disabled
              style={styles.inputDisabled}
            />
          </div>
        </div>

        {/* Editable Settings */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Settings</h3>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>HDD Standby</label>
            <select
              value={hddstandby}
              onChange={(e) => setHddstandby(e.target.value as DiskStandby)}
              style={styles.select}
            >
              {Object.values(DiskStandby).map((value) => (
                <option key={value} value={value}>
                  {getDiskStandbyLabel(value)}
                </option>
              ))}
            </select>
            <span style={styles.hint}>Time until hard drive enters standby mode</span>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Advanced Power Management</label>
            <select
              value={advpowermgmt}
              onChange={(e) => setAdvpowermgmt(e.target.value as DiskPowerLevel)}
              style={styles.select}
            >
              {Object.values(DiskPowerLevel).map((value) => (
                <option key={value} value={value}>
                  {getDiskPowerLevelLabel(value)}
                </option>
              ))}
            </select>
            <span style={styles.hint}>Controls the Advanced Power Management feature</span>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={styles.saveButton}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    padding: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: colors.primary,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: colors.text,
    fontFamily: 'monospace',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    color: '#b91c1c',
    fontSize: 14,
  },
  section: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 16,
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 40,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 14,
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  inputDisabled: {
    width: '100%',
    height: 40,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 14,
    boxSizing: 'border-box' as const,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    cursor: 'not-allowed',
  },
  select: {
    width: '100%',
    height: 40,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 14,
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  hint: {
    display: 'block',
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: colors.text,
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#fff',
    fontWeight: 500,
  },
}