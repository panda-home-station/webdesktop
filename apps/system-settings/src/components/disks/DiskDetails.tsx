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
  onEdit?: () => void
}

export function DiskDetails({ disk, onBack, onEdit }: DiskDetailsProps) {
  const displayName = getDiskDisplayName(disk)
  const isSed = isSedDisk(disk)
  const isUnlocked = isDiskUnlocked(disk)

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <h2 style={styles.title}>{displayName}</h2>
        <TypeBadge type={disk.type} />
        {onEdit && (
          <button style={styles.editButton} onClick={onEdit}>
            编辑
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>基本信息</h3>
        <div style={styles.grid}>
          <InfoRow label="设备名称" value={disk.devname} />
          <InfoRow label="型号" value={disk.model || '未知'} />
          <InfoRow label="序列号" value={disk.serial || '未知'} />
          <InfoRow label="容量" value={formatBytes(disk.size)} />
          <InfoRow label="总线" value={disk.bus} />
          <InfoRow label="类型" value={disk.type} />
        </div>
      </div>

      {/* Pool Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>存储池信息</h3>
        <div style={styles.grid}>
          <InfoRow
            label="存储池"
            value={disk.pool || '未分配'}
            highlight={!disk.pool}
          />
          <InfoRow label="ZFS GUID" value={disk.zfs_guid || 'N/A'} />
        </div>
      </div>

      {/* SED Info */}
      {isSed && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>自加密磁盘 (SED)</h3>
          <div style={styles.grid}>
            <InfoRow
              label="状态"
              value={disk.sed_status || '未知'}
              valueColor={isUnlocked ? colors.success : colors.warning}
            />
            <InfoRow label="已设置密码" value={disk.passwd ? '是' : '否'} />
          </div>
        </div>
      )}

      {/* Power Management */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>电源管理</h3>
        <div style={styles.grid}>
          <InfoRow label="电源模式" value={disk.advpowermgmt || '未知'} />
          <InfoRow label="待机时间" value={disk.hddstandby || '未知'} />
          <InfoRow label="传输模式" value={disk.transfermode || '未知'} />
        </div>
      </div>

      {/* Additional Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>附加信息</h3>
        <div style={styles.grid}>
          <InfoRow label="转速" value={disk.rotationrate ? `${disk.rotationrate} 转/分` : 'N/A'} />
          <InfoRow label="子系统" value={disk.subsystem || '未知'} />
          <InfoRow label="描述" value={disk.description || '无'} />
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
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: colors.primary,
    flexShrink: 0,
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
  editButton: {
    padding: '8px 16px',
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#fff',
    fontWeight: 500,
    marginLeft: 'auto',
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
