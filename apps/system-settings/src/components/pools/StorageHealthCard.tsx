/**
 * Storage Health Card Component
 * Displays pool health status, scrub information, and related controls
 * Ported from webui StorageHealthCardComponent
 */

import React, { useEffect, useState, useCallback } from 'react'
import { Pool } from '@truenas/types/pool'
import { ScrubTask, Schedule } from '@truenas/types/pool-scrub-types'
import { PoolScanFunction, PoolScanState } from '@truenas/types/pool-scan-enum-types'
import { PoolScrubAction } from '@truenas/types/pool-scrub-action-enum-types'
import { ApiTimestamp } from '@truenas/types/system-types'
import { poolService } from '@truenas/services/pool'
import { truenasApi } from '@truenas/api'
import { poolStatusLabels } from '@truenas/utils/pool-status.utils'
import { Modal } from '@desktop/components/Modal'
import { colors } from '../../styles/theme'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  HardDrive,
  Pause,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface StorageHealthCardProps {
  pool: Pool
  onConfigureScrub?: (poolId: number, existingScrub: ScrubTask | null) => void
  onEditAutotrim?: (pool: Pool) => void
}

interface PoolScanInfo {
  bytes_issued: number
  bytes_processed: number
  bytes_to_process: number
  end_time: ApiTimestamp
  errors: number
  function: PoolScanFunction
  pause: ApiTimestamp | null
  percentage: number
  start_time: ApiTimestamp
  state: PoolScanState
  total_secs_left: number | null
}

interface StatusIconData {
  icon: React.ReactNode
  color: string
  tooltip: string
}

export function StorageHealthCard({
  pool,
  onConfigureScrub,
  onEditAutotrim,
}: StorageHealthCardProps) {
  const [scrubTask, setScrubTask] = useState<ScrubTask | null>(null)
  const [scan, setScan] = useState<PoolScanInfo | null>(null)
  const [errorCount] = useState(0)
  const [isStarting, setIsStarting] = useState(false)
  const [showScrubConfirm, setShowScrubConfirm] = useState(false)
  const [showAutotrimDialog, setShowAutotrimDialog] = useState(false)
  const [showScrubConfigDialog, setShowScrubConfigDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const loadScrubTask = useCallback(async () => {
    try {
      const tasks = await poolService.scrubQuery([['pool', '=', pool.id]])
      if (tasks.length > 0) {
        setScrubTask(tasks[0])
      } else {
        setScrubTask(null)
      }
    } catch (error) {
      console.error('Failed to load scrub task:', error)
      setScrubTask(null)
    }
  }, [pool.id])

  const loadScanStatus = useCallback(async () => {
    try {
      // pool.scan info is included in pool.query result
      // Use the scan data from the pool object directly
      if (pool.scan) {
        setScan(pool.scan as PoolScanInfo)
      }
    } catch (error) {
      console.error('Failed to load scan status:', error)
      setScan(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.id])

  useEffect(() => {
    loadScrubTask()
    loadScanStatus()

    // Subscribe to pool.scan events for real-time scan updates
    const unsubscribe = truenasApi.subscribe('pool.scan', (data: unknown) => {
      // eslint-disable-next-line no-console
      console.info('pool.scan event:', data)
      const eventData = data as { id?: number; fields?: Record<string, unknown> }
      // Pool scan events come with fields containing scan info
      if (eventData.fields?.scan) {
        setScan(eventData.fields.scan as PoolScanInfo)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [loadScrubTask, loadScanStatus])

  async function handleStartScrub() {
    setIsStarting(true)
    try {
      await truenasApi.call('pool.scrub', pool.id, PoolScrubAction.Start)
      // eslint-disable-next-line no-console
      console.info('Scrub started successfully')

      // Refresh scan status using direct API call
      const pools = await truenasApi.call('pool.query', [['id', '=', pool.id]], { extra: { is_upgraded: true } })
      if (pools && (pools as Pool[]).length > 0) {
        const updatedPool = (pools as Pool[])[0]
        if (updatedPool.scan) {
          setScan(updatedPool.scan as PoolScanInfo)
        }
      }
    } catch (error) {
      console.error('Failed to start scrub:', error)
    } finally {
      setIsStarting(false)
    }
  }

  async function handlePauseScrub() {
    try {
      await truenasApi.call('pool.scrub', pool.id, PoolScrubAction.Pause)
      // Refresh scan status
      const pools = await truenasApi.call('pool.query', [['id', '=', pool.id]], { extra: { is_upgraded: true } })
      if (pools && (pools as Pool[]).length > 0) {
        const updatedPool = (pools as Pool[])[0]
        if (updatedPool.scan) {
          setScan(updatedPool.scan as PoolScanInfo)
        }
      }
    } catch (error) {
      console.error('Failed to pause scrub:', error)
    }
  }

  async function handleResumeScrub() {
    try {
      await truenasApi.call('pool.scrub', pool.id, PoolScrubAction.Start)
      // Refresh scan status
      const pools = await truenasApi.call('pool.query', [['id', '=', pool.id]], { extra: { is_upgraded: true } })
      if (pools && (pools as Pool[]).length > 0) {
        const updatedPool = (pools as Pool[])[0]
        if (updatedPool.scan) {
          setScan(updatedPool.scan as PoolScanInfo)
        }
      }
    } catch (error) {
      console.error('Failed to resume scrub:', error)
    }
  }

  async function handleStopScrub() {
    try {
      await truenasApi.call('pool.scrub', pool.id, PoolScrubAction.Stop)
      // Refresh scan status
      const pools = await truenasApi.call('pool.query', [['id', '=', pool.id]], { extra: { is_upgraded: true } })
      if (pools && (pools as Pool[]).length > 0) {
        const updatedPool = (pools as Pool[])[0]
        if (updatedPool.scan) {
          setScan(updatedPool.scan as PoolScanInfo)
        }
      }
    } catch (error) {
      console.error('Failed to stop scrub:', error)
    }
  }

  function handleScrubConfirm() {
    setShowScrubConfirm(false)
    handleStartScrub()
  }

  function handleAutotrimConfirm(value: 'on' | 'off') {
    setShowAutotrimDialog(false)
    // TODO: Call API to update autotrim
    // eslint-disable-next-line no-console
    console.info('Set autotrim to:', value)
  }

  const iconData = getStatusIconData(pool, scan?.errors || 0)
  const wasScanInitiated = scan?.state === PoolScanState.Scanning
  const isScrub = scan?.function === PoolScanFunction.Scrub
  const isPaused = !!scan?.pause

  function getScanStateLabel(): string {
    if (!scan) return ''
    if (scan.state === PoolScanState.Finished) {
      return isScrub ? '完成数据清理' : '完成数据修复'
    }
    if (scan.state === PoolScanState.Cancelled) {
      return isScrub ? '已取消数据清理' : '已取消数据修复'
    }
    return ''
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds} 秒`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return `${mins} 分 ${secs} 秒`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours} 小时 ${remainingMins} 分`
  }

  function getScanDuration(): string {
    if (!scan?.end_time || !scan?.start_time) return ''
    const start = new Date(scan.start_time.$date).getTime()
    const end = new Date(scan.end_time.$date).getTime()
    const seconds = Math.round((end - start) / 1000)
    return formatDuration(seconds)
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              存储健康
              <span style={{ color: iconData.color }}>
                {iconData.icon}
              </span>
            </span>
          </h3>
          {/* Status Badge */}
          <div style={{ ...styles.statusBadge, backgroundColor: iconData.color }}>
            {iconData.icon}
            <span style={styles.statusText}>{getErrorText(pool, errorCount)}</span>
          </div>
        </div>
        <div style={styles.headerActions}>
          {isStarting && (
            <button
              style={{
                ...styles.scrubButton,
                opacity: 0.8,
                cursor: 'wait',
              }}
              disabled
            >
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              扫描中...
            </button>
          )}
          {!wasScanInitiated && !isStarting && (
            <button
              style={styles.scrubButton}
              onClick={() => setShowScrubConfirm(true)}
            >
              <RefreshCw size={14} />
              立即校验
            </button>
          )}
          {wasScanInitiated && isScrub && (
            <div style={styles.scanControls}>
              <button
                style={styles.scanControlButton}
                onClick={isPaused ? handleResumeScrub : handlePauseScrub}
                title={isPaused ? '继续' : '暂停'}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <button
                style={{ ...styles.scanControlButton, ...styles.stopButton }}
                onClick={handleStopScrub}
                title="停止"
              >
                <Square size={14} />
              </button>
            </div>
          )}
          <button
            style={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? '折叠' : '展开'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
      <div style={styles.content}>
        {/* Scheduled Scrub */}
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>
            <Clock size={14} />
            已计划的校验:
          </div>
          <div style={styles.infoValue}>
            {scrubTask?.enabled
              ? getScheduleDescription(scrubTask.schedule)
              : '未设置'}
          </div>
          <button
            style={styles.linkButton}
            onClick={() => {
              if (onConfigureScrub) {
                onConfigureScrub(pool.id, scrubTask)
              } else {
                setShowScrubConfigDialog(true)
              }
            }}
          >
            {scrubTask?.enabled ? '配置' : '设置'}
          </button>
        </div>

        {/* Auto TRIM */}
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>
            <HardDrive size={14} />
            自动 TRIM (SSD):
          </div>
          <div style={styles.infoValue}>{pool.autotrim?.value === 'on' ? '开' : '关'}</div>
          <button
            style={styles.linkButton}
            onClick={() => {
              if (onEditAutotrim) {
                onEditAutotrim(pool)
              } else {
                setShowAutotrimDialog(true)
              }
            }}
          >
            编辑
          </button>
        </div>

        {/* Active Scan */}
        {scan && wasScanInitiated && (
          <div style={styles.scanSection}>
            <div style={styles.scanHeader}>
              <RefreshCw size={16} style={{ animation: isPaused ? 'none' : 'spin 1s linear infinite' }} />
              <span>{isPaused ? '已暂停' : '正在校验'}: {scan.percentage.toFixed(1)}%</span>
              {scan.total_secs_left && !isPaused && (
                <span style={styles.timeLeft}>约剩余 {formatDuration(scan.total_secs_left)}</span>
              )}
            </div>
            <div style={styles.scanProgress}>
              <div
                style={{
                  ...styles.scanProgressBar,
                  width: `${scan.percentage}%`,
                  backgroundColor: isPaused ? colors.warning : colors.primary,
                }}
              />
            </div>
            <div style={styles.scanDetails}>
              <span>已处理: {formatBytes(scan.bytes_processed)}</span>
              <span>总计: {formatBytes(scan.bytes_to_process)}</span>
              {scan.errors > 0 && (
                <span style={{ color: colors.danger }}>
                  错误: {scan.errors}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Last Scan Info - show when scan exists and not currently scanning */}
        {scan && !wasScanInitiated && (
          <>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                <Clock size={14} />
                最后扫描:
              </div>
              <div style={styles.infoValue}>
                {scan.end_time
                  ? `${new Date(scan.end_time.$date).toLocaleString()} ${getScanStateLabel()}`
                  : '从未'}
              </div>
            </div>
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>
                上次扫描错误:
              </div>
              <div style={{ ...styles.infoValue, color: scan.errors > 0 ? colors.danger : colors.text }}>
                {scan.errors}
              </div>
            </div>
            {getScanDuration() && (
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>
                  扫描耗时:
                </div>
                <div style={styles.infoValue}>{getScanDuration()}</div>
              </div>
            )}
          </>
        )}
      </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Scrub Confirmation Dialog */}
      <Modal
        open={showScrubConfirm}
        onClose={() => setShowScrubConfirm(false)}
        title="启动校验"
        width={400}
      >
        <div style={styles.dialogContent}>
          <p>确定要对池 <strong>{pool.name}</strong> 启动校验吗？</p>
          <p style={{ fontSize: 12, color: colors.textSecondary }}>
            校验会对您的池进行数据完整性检查，可能需要较长时间。
          </p>
        </div>
        <div style={styles.dialogActions}>
          <button
            style={styles.dialogCancelButton}
            onClick={() => setShowScrubConfirm(false)}
          >
            取消
          </button>
          <button
            style={styles.dialogConfirmButton}
            onClick={handleScrubConfirm}
          >
            确定
          </button>
        </div>
      </Modal>

      {/* Autotrim Dialog */}
      <Modal
        open={showAutotrimDialog}
        onClose={() => setShowAutotrimDialog(false)}
        title="编辑自动 TRIM"
        width={400}
      >
        <div style={styles.dialogContent}>
          <p>自动 TRIM 会在 SSD 上启用 TRIM 命令来回收删除文件后释放的空间。</p>
          <div style={styles.dialogOptionGroup}>
            <label style={styles.dialogRadioLabel}>
              <input
                type="radio"
                name="autotrim"
                value="on"
                defaultChecked={pool.autotrim?.value === 'on'}
                style={{ marginRight: 8 }}
              />
              开启 - 启用自动 TRIM
            </label>
            <label style={styles.dialogRadioLabel}>
              <input
                type="radio"
                name="autotrim"
                value="off"
                defaultChecked={pool.autotrim?.value === 'off'}
                style={{ marginRight: 8 }}
              />
              关闭 - 禁用自动 TRIM
            </label>
          </div>
        </div>
        <div style={styles.dialogActions}>
          <button
            style={styles.dialogCancelButton}
            onClick={() => setShowAutotrimDialog(false)}
          >
            取消
          </button>
          <button
            style={styles.dialogConfirmButton}
            onClick={() => handleAutotrimConfirm(pool.autotrim?.value === 'on' ? 'off' : 'on')}
          >
            保存
          </button>
        </div>
      </Modal>

      {/* Scrub Config Dialog (placeholder) */}
      <Modal
        open={showScrubConfigDialog}
        onClose={() => setShowScrubConfigDialog(false)}
        title={scrubTask?.enabled ? '配置校验任务' : '设置校验任务'}
        width={500}
      >
        <div style={styles.dialogContent}>
          {scrubTask?.enabled ? (
            <p>当前校验计划: {getScheduleDescription(scrubTask.schedule)}</p>
          ) : (
            <p>尚未为池 <strong>{pool.name}</strong> 设置校验任务。</p>
          )}
          <p style={{ fontSize: 12, color: colors.textSecondary }}>
            校验任务配置功能正在开发中...
          </p>
        </div>
        <div style={styles.dialogActions}>
          <button
            style={styles.dialogCancelButton}
            onClick={() => setShowScrubConfigDialog(false)}
          >
            关闭
          </button>
        </div>
      </Modal>
    </div>
  )
}

function getStatusIconData(pool: Pool, _errorCount: number): StatusIconData {
  const poolStatus = pool.status as string
  const statusLabel = poolStatusLabels[poolStatus] || poolStatus

  if (!pool.healthy && poolStatus === 'ONLINE') {
    return {
      icon: <AlertTriangle size={16} color="white" />,
      color: colors.warning,
      tooltip: `池状态${statusLabel}，有错误`,
    }
  }

  if (poolStatus === 'DEGRADED') {
    return {
      icon: <AlertTriangle size={16} color="white" />,
      color: colors.warning,
      tooltip: `池状态: ${statusLabel}`,
    }
  }

  if (poolStatus === 'FAULTED' || poolStatus === 'UNAVAILABLE') {
    return {
      icon: <XCircle size={16} color="white" />,
      color: colors.danger,
      tooltip: `池状态: ${statusLabel}`,
    }
  }

  if (!pool.healthy) {
    return {
      icon: <XCircle size={16} color="white" />,
      color: colors.danger,
      tooltip: '池不健康',
    }
  }

  return {
    icon: <CheckCircle size={16} color="white" />,
    color: colors.success,
    tooltip: '一切正常',
  }
}

function getErrorText(pool: Pool, errorCount: number): string {
  const statusStr = poolStatusLabels[pool.status as string] || pool.status

  if (errorCount === 0) {
    return `${statusStr}，没有错误`
  }

  return `${statusStr}，${errorCount} 个错误`
}

function getScheduleDescription(schedule: Schedule): string {
  if (!schedule) return '未设置'

  const parts: string[] = []

  if (schedule.hour) {
    parts.push(`于 ${schedule.hour}:00`)
  }

  if (schedule.dow) {
    const dayMap: Record<string, string> = {
      '0': '周日',
      '1': '周一',
      '2': '周二',
      '3': '周三',
      '4': '周四',
      '5': '周五',
      '6': '周六',
      '7': '周日',
    }
    const days = schedule.dow.split(',').map(d => dayMap[d] || d).join('、')
    parts.push(`仅在 ${days}`)
  }

  return parts.join(' ') || '已计划'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)

  return `${value.toFixed(i >= 2 ? 1 : 0)} ${sizes[i]}`
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  scrubButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  scanControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  scanControlButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  stopButton: {
    backgroundColor: colors.danger,
  },
  timeLeft: {
    marginLeft: 'auto',
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    color: 'white',
    fontSize: 13,
    fontWeight: 500,
  },
  statusText: {
    fontSize: 13,
    color: 'white',
    fontWeight: 500,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: colors.textSecondary,
    minWidth: 140,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
  },
  linkButton: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: colors.primary,
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  },
  scanSection: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  scanHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: 500,
    color: colors.primary,
  },
  scanProgress: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  scanProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  scanDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: colors.textSecondary,
  },
  lastScanSection: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: 13,
  },
  lastScanLabel: {
    color: colors.textSecondary,
    marginRight: 8,
  },
  lastScanValue: {
    color: colors.text,
    fontWeight: 500,
  },
  dialogContent: {
    marginBottom: 20,
  },
  dialogActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  dialogCancelButton: {
    padding: '10px 20px',
    backgroundColor: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: colors.text,
  },
  dialogConfirmButton: {
    padding: '10px 20px',
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
  },
  dialogOptionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  dialogRadioLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    color: colors.text,
    cursor: 'pointer',
  },
}