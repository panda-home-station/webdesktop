import { useState } from 'react'
import { Modal } from '@desktop/components/Modal'
import { Trash2 } from 'lucide-react'
import { colors } from '../../styles/theme'

interface DeleteConfirmProps {
  open: boolean
  title: string
  itemName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function DeleteConfirm({ open, title, itemName, onConfirm, onCancel }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width={300}
      bodyStyle={{ textAlign: 'center', padding: '20px' }}
      footer={
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: colors.background,
              color: colors.text,
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: colors.danger,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '删除中...' : '删除'}
          </button>
        </div>
      }
    >
      <div style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        backgroundColor: '#ffebee',
        margin: '0 auto 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Trash2 size={28} color={colors.danger} />
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: colors.text }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 14, color: colors.textSecondary, lineHeight: 1.5 }}>
        确定要删除 <strong>{itemName}</strong> 吗？此操作无法撤销。
      </p>
    </Modal>
  )
}
