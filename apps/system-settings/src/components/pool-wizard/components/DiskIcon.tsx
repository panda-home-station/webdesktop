/**
 * Disk Icon Component
 * WebUI-style disk icon with size and identifier labels
 */

import React from 'react'
import { DetailsDisk } from '@truenas/types/disk-types'
import { DiskType } from '@truenas/types/disk-type-enum-types'
import { colors } from '@apps/system-settings/styles/theme'

interface DiskIconProps {
  disk: DetailsDisk
  width?: number
  height?: number
}

const formatSize = (bytes: number): string => {
  if (typeof bytes !== 'number' || bytes <= 0 || isNaN(bytes)) {
    return 'Unknown'
  }
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(1)} TB`
  }
  if (gb >= 1) {
    return `${gb.toFixed(0)} GiB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(0)} MiB`
}

export function DiskIcon({ disk, width = 72, height = 80 }: DiskIconProps) {
  const scale = Math.min(width / 72, height / 80)
  const scaledWidth = 72 * scale
  const scaledHeight = 80 * scale

  return (
    <svg
      width={scaledWidth}
      height={scaledHeight}
      viewBox="0 0 72 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={`clip-path-${disk.devname}`}>
          <rect
            id="Mask_Rounded_Corners"
            data-name="Mask Rounded Corners"
            width="72"
            height="80"
            rx="4"
            transform="translate(-0.039)"
            fill="none"
            stroke="#414141"
            strokeWidth="1"
          />
        </clipPath>
      </defs>

      <g id="Normal" transform="translate(11)">
        <g id="BG_Masks" data-name="BG Masks" transform="translate(-10.961)" clipPath={`url(#clip-path-${disk.devname})`}>
          {/* Background with shadow effect */}
          <g transform="matrix(1, 0, 0, 1, -0.04, 0)" filter="url(#BG_Fill)">
            <g id="BG_Fill-2" data-name="BG Fill" fill="#1e1e1e" stroke="#8f8f8f" strokeWidth="1">
              <rect width="72" height="80" rx="4" stroke="none" />
              <rect x="0.5" y="0.5" width="71" height="79" rx="3.5" fill="none" />
            </g>
          </g>

          {/* Top highlight */}
          <rect
            id="BG_Top"
            data-name="BG Top"
            width="70.5"
            height="17.391"
            transform="translate(-0.039)"
            fill="rgba(255,255,255,0.5)"
            opacity="0.5"
          />

          {/* Bottom highlight */}
          <path
            id="BG_Bottom"
            data-name="BG Bottom"
            d="M0,0H70.5V17.391H0Z"
            transform="translate(-0.039 62.609)"
            fill="rgba(255,255,255,0.5)"
            opacity="0.5"
          />
        </g>

        {/* Hard disk icon */}
        <g
          id="harddisk"
          transform="scale(1.2), translate(4 14)"
          opacity="0.5"
        >
          <path
            id="harddisk-2"
            data-name="harddisk"
            d="M6.856,2H23.989a2.856,2.856,0,0,1,2.856,2.856V27.7a2.856,2.856,0,0,1-2.856,2.856H6.856A2.856,2.856,0,0,1,4,27.7V4.856A2.856,2.856,0,0,1,6.856,2Zm8.567,2.856a8.567,8.567,0,0,0-8.567,8.567,8.474,8.474,0,0,0,8.567,8.567l-1.428-2.856c-.394-.683.745-2.461,1.428-2.856h0c.683-.394,2.461-.683,2.856,0l2.856,4.283c1.963-1.57,2.856-4.43,2.856-7.139A8.567,8.567,0,0,0,15.422,4.856Zm0,7.139a1.428,1.428,0,1,1-1.428,1.428A1.428,1.428,0,0,1,15.422,11.995ZM8.283,24.845a1.428,1.428,0,1,0,1.428,1.428A1.428,1.428,0,0,0,8.283,24.845Zm7.139-7.139L19.706,27.7l2.856-2.856L16.85,17.706Z"
            transform="translate(0.098 3.322)"
            fill="#fff"
          />
        </g>

        {/* Labels */}
        <g id="Labels" transform="translate(11.451 1.857)" opacity="0.998">
          {/* Disk size label */}
          <text
            id="disk-size"
            data-name={formatSize(disk.size)}
            transform="translate(13 72.714)"
            fill="#fff"
            fontSize="11"
            fontFamily="Inter"
            style={{ textAnchor: 'middle' }}
          >
            <tspan x="0" y="0">{formatSize(disk.size)}</tspan>
          </text>

          {/* Disk identifier label */}
          <text
            id="disk-identifier"
            data-name={disk.name}
            transform="translate(12.647 11)"
            fill="#fff"
            fontSize="11"
            fontFamily="Inter"
            style={{ textAnchor: 'middle' }}
          >
            <tspan x="0" y="0">{disk.name}</tspan>
          </text>
        </g>
      </g>
    </svg>
  )
}

/**
 * Disk Info Component
 * Display detailed disk information below the icon
 */
interface DiskInfoProps {
  disk: DetailsDisk
}

const getTypeColor = (type: DiskType) => {
  switch (type) {
    case DiskType.Hdd:
      return { bg: '#e3f2fd', text: '#1976d2' }
    case DiskType.Ssd:
      return { bg: '#e8f5e9', text: '#388e3c' }
    case DiskType.Nvme:
      return { bg: '#fff3e0', text: '#f57c00' }
    default:
      return { bg: '#f5f5f5', text: '#666' }
  }
}

export function DiskInfo({ disk }: DiskInfoProps) {
  // Check if enclosure has valid slot information
  const enclosure = disk.enclosure as { drive_bay_number?: number; id?: string } | null
  const slotNumber = enclosure?.drive_bay_number

  return (
    <div style={styles.infoContainer}>
      <div style={styles.infoItem}>
        <span style={styles.infoLabel}>插槽:</span>
        <span style={styles.infoValue}>{slotNumber !== undefined ? slotNumber : '-'}</span>
      </div>
      <div style={styles.infoItem}>
        <span style={styles.infoLabel}>型号:</span>
        <span style={styles.infoValue}>{disk.model || '-'}</span>
      </div>
      <div style={styles.infoItem}>
        <span style={styles.infoLabel}>类型:</span>
        <span
          style={{
            ...styles.infoBadge,
            backgroundColor: getTypeColor(disk.type).bg,
            color: getTypeColor(disk.type).text,
          }}
        >
          {disk.type}
        </span>
      </div>
      <div style={styles.infoItem}>
        <span style={styles.infoLabel}>序列号:</span>
        <span style={styles.infoValue}>{disk.serial || '-'}</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  infoContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    padding: '4px 0',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
  },
  infoLabel: {
    color: colors.textSecondary,
    minWidth: 32,
  },
  infoValue: {
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: 80,
  },
  infoBadge: {
    fontSize: 9,
    fontWeight: 600,
    padding: '1px 4px',
    borderRadius: 3,
  },
}
