import React, { useState } from 'react'
import { Modal, ModalProps } from '@src/components/Modal'
import { truenasApi } from '@src/truenas/api'
import { useAuthStore } from '@src/truenas/stores/auth.store'
import { ApiKey, ApiTimestamp } from './UserApiKeys'

interface ApiKeyFormProps extends Omit<ModalProps, 'children'> {
  editingKey?: ApiKey
  onSuccess?: (key: string) => void
}

export function ApiKeyForm({ open, editingKey, onSuccess, onClose, ...modalProps }: ApiKeyFormProps) {
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [nonExpiring, setNonExpiring] = useState(true)
  const [reset, setReset] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const username = user?.pw_name

  // Initialize form when editing
  React.useEffect(() => {
    if (editingKey) {
      setName(editingKey.name)
      if (editingKey.expires_at?.$date) {
        setExpiresAt(new Date(editingKey.expires_at.$date))
        setNonExpiring(false)
      } else {
        setExpiresAt(null)
        setNonExpiring(true)
      }
    } else {
      setName('')
      setExpiresAt(null)
      setNonExpiring(true)
      setReset(false)
    }
    setError(null)
  }, [editingKey, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('请输入 API Key 名称')
      return
    }

    if (!username) {
      setError('无法获取用户信息')
      return
    }

    setLoading(true)
    try {
      const expiresAtValue = (nonExpiring || !expiresAt)
        ? null
        : { $date: expiresAt!.getTime() }

      if (editingKey) {
        // Update existing key
        const result = await truenasApi.call('api_key.update', [
          editingKey.id,
          { name, reset, expires_at: expiresAtValue },
        ]) as { key?: string }
        if (result?.key) {
          onSuccess?.(result.key)
        }
      } else {
        // Create new key
        const result = await truenasApi.call('api_key.create', [{
          name,
          username,
          expires_at: expiresAtValue?.$date ? expiresAtValue : null,
        }]) as { key?: string }
        if (result?.key) {
          onSuccess?.(result.key)
        }
      }
      onClose()
    } catch (err: any) {
      console.error('API key operation error:', err)
      setError(err?.message || '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 42,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '0 14px',
    background: '#f9fafb',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontSize: 14,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 4,
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      {...modalProps}
      title={editingKey ? '编辑 API Key' : '创建 API Key'}
      width={450}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            取消
          </button>
          <button
            type="submit"
            form="api-key-form"
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#9ca3af' : '#3b82f6',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '处理中...' : editingKey ? '更新' : '创建'}
          </button>
        </div>
      }
    >
      <form id="api-key-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        {error && (
          <div
            style={{
              color: '#b91c1c',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 6 }}>
          <div style={labelStyle}>名称</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入 API Key 名称"
            className="panda-input-autofill-fix"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            disabled={loading}
            maxLength={200}
          />
          <div style={{ fontSize: 12, color: '#6b7280' }}>API Key 的描述性名称</div>
        </div>

        {editingKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="reset"
              checked={reset}
              onChange={(e) => setReset(e.target.checked)}
              disabled={loading}
              style={{
                width: 18,
                height: 18,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            />
            <label
              htmlFor="reset"
              style={{
                fontSize: 14,
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                userSelect: 'none',
              }}
            >
              重置密钥
            </label>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              这将生成新的 API Key 值
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="nonExpiring"
            checked={nonExpiring}
            onChange={(e) => setNonExpiring(e.target.checked)}
            disabled={loading}
            style={{
              width: 18,
              height: 18,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          />
          <label
            htmlFor="nonExpiring"
            style={{
              fontSize: 14,
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              userSelect: 'none',
            }}
          >
            永不过期
          </label>
        </div>

        {!nonExpiring && (
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={labelStyle}>过期日期</div>
            <input
              type="date"
              value={expiresAt ? expiresAt.toISOString().split('T')[0] : ''}
              onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value) : null)}
              style={{
                ...inputStyle,
                padding: '0 14px',
              }}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        )}
      </form>
    </Modal>
  )
}
