/**
 * Pool Create Form Component
 * Modal form for creating a new storage pool
 */

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@desktop/components/Modal'
import { poolService } from '@truenas/services/pool'
import { diskService } from '@truenas/services/disk'
import { DetailsDisk } from '@truenas/types/disk-types'
import { CreateVdevLayout } from '@truenas/types/vdev-enum-types'
import { CreatePool } from '@truenas/types/pool'
import { VDevType, vdevTypeLabels } from '@truenas/types/vdev-enum-types'
import { colors } from '../../styles/theme'

interface PoolCreateFormProps {
  onClose: () => void
  onSuccess: () => void
}

const LAYOUT_OPTIONS = [
  { label: 'Stripe (无冗余)', value: CreateVdevLayout.Stripe },
  { label: 'Mirror (镜像)', value: CreateVdevLayout.Mirror },
  { label: 'Raidz1 (单冗余)', value: CreateVdevLayout.Raidz1 },
  { label: 'Raidz2 (双冗余)', value: CreateVdevLayout.Raidz2 },
  { label: 'Raidz3 (三冗余)', value: CreateVdevLayout.Raidz3 },
]

export function PoolCreateForm({ onClose, onSuccess }: PoolCreateFormProps) {
  const [name, setName] = useState('')
  const [layout, setLayout] = useState<CreateVdevLayout>(CreateVdevLayout.Stripe)
  const [selectedDisks, setSelectedDisks] = useState<string[]>([])
  const [availableDisks, setAvailableDisks] = useState<DetailsDisk[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDisks = useCallback(async () => {
    try {
      setLoading(true)
      const details = await diskService.details({ join_partitions: true })
      setAvailableDisks(details.unused)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载硬盘失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDisks()
  }, [loadDisks])

  const toggleDisk = (devname: string) => {
    setSelectedDisks(prev =>
      prev.includes(devname)
        ? prev.filter(d => d !== devname)
        : [...prev, devname]
    )
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('请输入池名称')
      return
    }
    if (selectedDisks.length === 0) {
      setError('请选择至少一块硬盘')
      return
    }

    try {
      setCreating(true)
      setError(null)

      const topology: CreatePool['topology'] = {
        data: [{
          type: layout,
          disks: selectedDisks,
        }],
      }

      await poolService.create({
        name: name.trim(),
        topology,
        encryption: false,
      })

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建池失败')
    } finally {
      setCreating(false)
    }
  }

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1024) {
      return `${(gb / 1024).toFixed(1)} TB`
    }
    return `${gb.toFixed(0)} GB`
  }

  const getLayoutDescription = (): string => {
    const count = selectedDisks.length
    if (count === 0) return '请选择硬盘'
    switch (layout) {
      case CreateVdevLayout.Stripe:
        return `${count} 块硬盘，无冗余`
      case CreateVdevLayout.Mirror:
        return `${count} 块硬盘，镜像冗余`
      case CreateVdevLayout.Raidz1:
        return `${count} 块硬盘，容许 1 块故障`
      case CreateVdevLayout.Raidz2:
        return `${count} 块硬盘，容许 2 块故障`
      case CreateVdevLayout.Raidz3:
        return `${count} 块硬盘，容许 3 块故障`
      default:
        return `${count} 块硬盘`
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="创建存储池"
      width={600}
      footer={
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={creating}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              cursor: creating ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: creating ? 0.6 : 1,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: creating ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? '创建中...' : '创建'}
          </button>
        </div>
      }
    >
      {/* Error message */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          backgroundColor: '#ffebee',
          borderRadius: 8,
          marginBottom: 16,
          color: colors.danger,
          fontSize: 14,
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Pool Name */}
      <div style={styles.field}>
        <label style={styles.label}>池名称</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如: pool1"
          style={styles.input}
        />
      </div>

      {/* Layout Selection */}
      <div style={styles.field}>
        <label style={styles.label}>布局</label>
        <div style={styles.layoutGrid}>
          {LAYOUT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLayout(opt.value)}
              style={{
                ...styles.layoutButton,
                backgroundColor: layout === opt.value ? colors.primary : colors.cardBg,
                color: layout === opt.value ? '#fff' : colors.text,
                borderColor: layout === opt.value ? colors.primary : colors.border,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disk Selection */}
      <div style={styles.field}>
        <label style={styles.label}>
          可用硬盘 ({availableDisks.length})
        </label>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary }}>
            加载中...
          </div>
        ) : availableDisks.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: colors.textSecondary }}>
            没有可用的硬盘
          </div>
        ) : (
          <div style={styles.diskList}>
            {availableDisks.map(disk => (
              <div
                key={disk.name}
                onClick={() => toggleDisk(disk.name)}
                style={{
                  ...styles.diskItem,
                  backgroundColor: selectedDisks.includes(disk.name) ? '#e3f2fd' : colors.cardBg,
                  borderColor: selectedDisks.includes(disk.name) ? colors.primary : colors.border,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDisks.includes(disk.name)}
                  onChange={() => toggleDisk(disk.name)}
                  style={{ marginRight: 12 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{disk.name}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    {disk.model || 'Unknown'} · {formatSize(disk.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: colors.background,
        borderRadius: 8,
        marginTop: 8,
      }}>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>
          {vdevTypeLabels[VDevType.Data]}: <strong>{getLayoutDescription()}</strong>
        </div>
      </div>
    </Modal>
  )
}

const styles = {
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
  layoutGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  layoutButton: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    border: `1px solid`,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  diskList: {
    maxHeight: 240,
    overflowY: 'auto' as const,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
  },
  diskItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: `1px solid ${colors.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
}