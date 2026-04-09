/**
 * Disk Details Component
 * Display detailed information about a single disk
 */

import { Disk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { formatBytes } from '@truenas/utils/storage.utils'
import { getDiskDisplayName, isSedDisk, isDiskUnlocked } from '@truenas/types/disk-types'
import { colors } from '../../styles/theme'

interface DiskDetailsProps {
  disk: Disk
  onBack: () => void
}

export function DiskDetails({ disk, onBack }: DiskDetailsProps) {
  const displayName = getDiskDisplayName(disk)
  const isSed = isSedDisk(disk)
  const isUnlocked = isDiskUnlocked(disk)

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back
        </button>
        <h2 style={styles.title}>{displayName}</h2>
        <TypeBadge type={disk.type} />
      </div>

      {/* Basic Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Basic Information</h3>
        <div style={styles.grid}>
          <InfoRow label="Device Name" value={disk.devname} />
          <InfoRow label="Model" value={disk.model || 'Unknown'} />
          <InfoRow label="Serial" value={disk.serial || 'Unknown'} />
          <InfoRow label="Capacity" value={formatBytes(disk.size)} />
          <InfoRow label="Bus" value={disk.bus} />
          <InfoRow label="Type" value={disk.type} />
        </div>
      </div>

      {/* Pool Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Pool Information</h3>
        <div style={styles.grid}>
          <InfoRow
            label="Pool"
            value={disk.pool || 'Not assigned'}
            highlight={!disk.pool}
          />
          <InfoRow label="ZFS GUID" value={disk.zfs_guid || 'N/A'} />
        </div>
      </div>

      {/* SED Info */}
      {isSed && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Self-Encrypting Drive (SED)</h3>
          <div style={styles.grid}>
            <InfoRow
              label="Status"
              value={disk.sed_status || 'Unknown'}
              valueColor={isUnlocked ? colors.success : colors.warning}
            />
            <InfoRow label="Password Set" value={disk.passwd ? 'Yes' : 'No'} />
          </div>
        </div>
      )}

      {/* Power Management */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Power Management</h3>
        <div style={styles.grid}>
          <InfoRow label="Power Mode" value={disk.advpowermgmt || 'Unknown'} />
          <InfoRow label="Standby" value={disk.hddstandby || 'Unknown'} />
          <InfoRow label="Transfer Mode" value={disk.transfermode || 'Unknown'} />
        </div>
      </div>

      {/* Additional Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Additional Information</h3>
        <div style={styles.grid}>
          <InfoRow label="Rotation Rate" value={disk.rotationrate ? `${disk.rotationrate} RPM` : 'N/A'} />
          <InfoRow label="Subsystem" value={disk.subsystem || 'Unknown'} />
          <InfoRow label="Description" value={disk.description || 'None'} />
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type }: { type: DiskType }) {
  const colors_map: Record<DiskType, string> = {
    [DiskType.Hdd]: '#8e8e93',
    [DiskType.Ssd]: '#34c759',
    [DiskType.Nvme]: '#007aff',
    [DiskType.Usb]: '#ff9500',
    [DiskType.Hda]: '#8e8e93',
  }

  const labels: Record<DiskType, string> = {
    [DiskType.Hdd]: 'HDD',
    [DiskType.Ssd]: 'SSD',
    [DiskType.Nvme]: 'NVMe',
    [DiskType.Usb]: 'USB',
    [DiskType.Hda]: 'HDA',
  }

  return (
    <span
      style={{
        ...styles.badge,
        backgroundColor: colors_map[type] || '#8e8e93',
      }}
    >
      {labels[type] || type}
    </span>
  )
}

interface InfoRowProps {
  label: string
  value: string
  highlight?: boolean
  valueColor?: string
}

function InfoRow({ label, value, highlight, valueColor }: InfoRowProps) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span
        style={{
          ...styles.infoValue,
          ...(highlight ? styles.infoValueHighlight : {}),
          ...(valueColor ? { color: valueColor } : {}),
        }}
      >
        {value}
      </span>
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
    fontSize: 28,
    fontWeight: 700,
    color: colors.text,
    flex: 1,
    fontFamily: 'monospace',
  },
  badge: {
    padding: '6px 14px',
    color: 'white',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
  },
  section: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 500,
    fontFamily: 'monospace',
  },
  infoValueHighlight: {
    color: colors.warning,
  },
}
