import { useState } from 'react'
import { Modal, ModalProps } from '@desktop/components/Modal'

interface KeyCreatedDialogProps extends Omit<ModalProps, 'children'> {
  apiKey: string
}

export function KeyCreatedDialog({ apiKey, onClose, ...modalProps }: KeyCreatedDialogProps) {
  const [copied, setCopied] = useState(false)
  const apiKeyHidden = '*'.repeat(Math.min(apiKey.length, 40))

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      {...modalProps}
      title="API Key 已创建"
      width={500}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            完成
          </button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          您的 API Key 已成功创建。请妥善保管此密钥，因为此对话框关闭后您将无法再次看到它。
          如果丢失，您需要创建新的 API Key。
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>API Key</div>
          <div
            style={{
              padding: 12,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 12,
              wordBreak: 'break-all',
              color: '#374151',
            }}
          >
            {apiKeyHidden}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: copied ? '#059669' : '#374151',
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? '已复制' : '复制 API Key'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
