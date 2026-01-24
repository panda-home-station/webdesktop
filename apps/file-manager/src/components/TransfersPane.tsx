import React from 'react'
import Icon from '@mdi/react'
import { mdiUpload, mdiDownload, mdiFolderOutline, mdiCheckCircleOutline, mdiPause, mdiPlay, mdiClose } from '@mdi/js'
import type { FileTask } from '../../../src/sdk/desktop'

type Props = {
  tasks: FileTask[]
  transferTab: 'upload' | 'download'
  setTransferTab: (t: 'upload' | 'download') => void
  fmtSize: (n: number) => string
  getAvgSpeed: (id: string) => number
  onTogglePause: (t: FileTask) => void
  onRemoveTask: (t: FileTask) => void
  onClearCompleted: () => void
  navigate: (to: string) => void
}

export default function TransfersPane({
  tasks,
  transferTab,
  setTransferTab,
  fmtSize,
  getAvgSpeed,
  onTogglePause,
  onRemoveTask,
  onClearCompleted,
  navigate
}: Props) {
  const uploads = tasks.filter(t => t.kind === 'upload')
  const downloads = tasks.filter(t => t.kind === 'download')
  const visible = transferTab === 'upload' ? uploads : downloads
  const runningUploads = tasks.filter(t => t.kind === 'upload' && t.status === 'running').length
  const runningDownloads = tasks.filter(t => t.kind === 'download' && t.status === 'running').length
  const fmtSpeed = (bps?: number) => {
    const v = typeof bps === 'number' && bps >= 0 ? bps : 0
    return `${fmtSize(v)}/s`
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <button
            className="puter-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0 10px',
              borderRadius: 6,
              background: transferTab === 'upload' ? '#2563eb' : 'var(--button-bg)',
              color: transferTab === 'upload' ? '#fff' : '#111827',
              border: transferTab === 'upload' ? '1px solid #2563eb' : '1px solid var(--button-border)'
            }}
            onClick={() => setTransferTab('upload')}
          >
            上传
            {runningUploads > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {runningUploads}
              </span>
            )}
          </button>
          <button
            className="puter-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0 10px',
              borderRadius: 6,
              background: transferTab === 'download' ? '#2563eb' : 'var(--button-bg)',
              color: transferTab === 'download' ? '#fff' : '#111827',
              border: transferTab === 'download' ? '1px solid #2563eb' : '1px solid var(--button-border)'
            }}
            onClick={() => setTransferTab('download')}
          >
            下载
            {runningDownloads > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, background: '#34d399', color: '#fff', fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {runningDownloads}
              </span>
            )}
          </button>
        </div>
        <button
          className="puter-button pressable"
          style={{ marginLeft: 'auto' }}
          onClick={onClearCompleted}
        >
          清除已完成
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12, borderTop: '1px solid #e5e7eb' }}>
        {visible.length === 0 ? null : (
          <div style={{ display: 'grid', gap: 6 }}>
            {visible.map(t => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '24px 4fr 120px 140px 72px 72px', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--win-border)', borderRadius: 8 }}>
                <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.kind === 'upload'
                    ? (t.status === 'done'
                      ? <Icon path={mdiCheckCircleOutline} size={0.9} color="#10b981" />
                      : <Icon path={mdiUpload} size={0.9} />)
                    : <Icon path={mdiDownload} size={0.9} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 60%' }}>{t.name}</span>
                  <span style={{ marginLeft: 16, fontSize: 12, lineHeight: 1.2, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 40%' }}>存储目录: {t.dir}</span>
                </div>
                {!(t.kind === 'upload' && t.status === 'done') ? (
                  <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, t.progress ?? (t.status === 'done' ? 100 : 0)))}%`, height: '100%', background: '#60a5fa' }} />
                  </div>
                ) : <div />}
                <div style={{ fontSize: 13, lineHeight: 1.2, color: 'var(--muted)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.status === 'running' ? (
                    <>
                      <span>{fmtSize(t.loaded || 0)} / {fmtSize(t.total || 0)}</span>
                      <span style={{ marginLeft: 8 }}>{fmtSpeed(getAvgSpeed(t.id))}</span>
                    </>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right', color: t.status === 'error' ? '#ef4444' : '#111827', fontSize: 13, lineHeight: 1.2 }}>
                  {t.status === 'error'
                    ? '失败'
                    : t.status === 'paused'
                      ? '暂停'
                      : (t.kind === 'upload' && t.status === 'done')
                        ? ''
                        : `${Math.min(100, Math.max(0, t.progress ?? 0))}%`}
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  {(t.kind === 'upload' && t.status === 'done') && (
                    <button
                      className="puter-icon-button"
                      style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => navigate(t.dir)}
                      title="打开文件目录"
                    >
                      <Icon path={mdiFolderOutline} size={0.8} color="#2563eb" />
                    </button>
                  )}
                  {t.status !== 'done' && (
                    <button 
                      className="puter-icon-button"
                      style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => onTogglePause(t)}
                      title={t.status === 'running' ? '暂停' : '继续'}
                    >
                      <Icon path={t.status === 'running' ? mdiPause : mdiPlay} size={0.8} color="#6b7280" />
                    </button>
                  )}
                  <button 
                    className="puter-icon-button"
                    style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => onRemoveTask(t)}
                    title="删除任务"
                  >
                    <Icon path={mdiClose} size={0.8} color="#6b7280" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
