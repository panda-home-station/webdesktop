import { useCallback, useEffect, useState } from 'react'
import { truenasApi } from '@truenas/api'
import { useAuthStore } from '@truenas/stores/auth'
import { ApiKeyForm } from './ApiKeyForm'
import { KeyCreatedDialog } from './KeyCreatedDialog'

export interface ApiTimestamp {
  $date: number
}

export interface ApiKey {
  created_at: ApiTimestamp
  expires_at: ApiTimestamp
  id: number
  key: string
  keyhash: string
  local: boolean
  revoked: boolean
  name: string
  username: string
  user_identifier: number
}

export function UserApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | undefined>()
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [deletingKey, setDeletingKey] = useState<number | null>(null)

  const { user } = useAuthStore()
  const currentUsername = user?.pw_name

  const loadApiKeys = useCallback(async () => {
    setLoading(true)
    try {
      const keys = await truenasApi.call('api_key.query', [[], { order_by: ['-created_at'] }]) as ApiKey[]
      // Filter to show only keys for current user (non-admins)
      const filteredKeys = currentUsername
        ? keys.filter(key => key.username === currentUsername)
        : keys
      setApiKeys(filteredKeys)
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUsername])

  useEffect(() => {
    loadApiKeys()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUsername])

  const handleCreateKey = () => {
    setEditingKey(undefined)
    setShowForm(true)
  }

  const handleEditKey = (key: ApiKey) => {
    if (key.revoked) return
    setEditingKey(key)
    setShowForm(true)
  }

  const handleDeleteKey = async (key: ApiKey) => {
    if (!confirm(`确定要删除 API Key "${key.name}" 吗？`)) {
      return
    }

    setDeletingKey(key.id)
    try {
      await truenasApi.call('api_key.delete', [key.id])
      await loadApiKeys()
    } catch (error) {
      console.error('Failed to delete API key:', error)
      alert('删除 API Key 失败，请稍后重试')
    } finally {
      setDeletingKey(null)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingKey(undefined)
  }

  const handleKeyCreated = (key: string) => {
    setCreatedKey(key)
    loadApiKeys()
  }

  const formatDate = (timestamp: ApiTimestamp) => {
    if (!timestamp?.$date) return '从未'
    return new Date(timestamp.$date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRelativeDate = (timestamp: ApiTimestamp) => {
    if (!timestamp?.$date) return '永不'
    const now = Date.now()
    const diff = timestamp.$date - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days <= 0) return '已过期'
    if (days === 1) return '1 天'
    if (days < 7) return `${days} 天`
    if (days < 30) return `${Math.floor(days / 7)} 周`
    if (days < 365) return `${Math.floor(days / 30)} 月`
    return `${Math.floor(days / 365)} 年`
  }

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>我的 API Key</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            管理您的 API Key，用于通过 API 访问 TrueNAS
          </div>
        </div>
        <button
          onClick={handleCreateKey}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          创建 API Key
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>加载中的...</div>
      ) : apiKeys.length === 0 ? (
 (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: '#6b7280',
              background: '#f9fafb',
              borderRadius: 12,
              border: '1px dashed #d1d5db',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 8 }}>暂无 API Key</div>
            <div style={{ fontSize: 13 }}>点击&quot;创建 API Key&quot;按钮开始创建</div>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {apiKeys.map((key) => (
            <div
              key={key.id}
              style={{
                padding: 16,
                background: '#fff',
                border: key.revoked ? '1px solid #fee2e2' : '1px solid #e5e7eb',
                borderRadius: 12,
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>名称</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{key.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>用户名</div>
                  <div style={{ fontSize: 14 }}>{key.username}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>本地</div>
                  <div style={{ fontSize: 14 }}>{key.local ? '是' : '否'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>状态</div>
                  <div style={{ fontSize: 14, color: key.revoked ? '#dc2626' : '#059669' }}>
                    {key.revoked ? '已撤销' : '有效'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>创建时间</div>
                  <div style={{ fontSize: 14 }}>{formatDate(key.created_at)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>过期时间</div>
                  <div style={{ fontSize: 14 }}>{getRelativeDate(key.expires_at)}</div>
                </div>
              </div>

              {!key.revoked && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => handleEditKey(key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      color: '#374151',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteKey(key)}
                    disabled={deletingKey === key.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #fee2e2',
                      background: deletingKey === key.id ? '#fca5a5' : '#fff',
                      color: '#dc2626',
                      fontSize: 13,
                      cursor: deletingKey === key.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ApiKeyForm
          open={showForm}
          editingKey={editingKey}
          onClose={handleFormClose}
          onSuccess={handleKeyCreated}
        />
      )}

      {createdKey && (
        <KeyCreatedDialog
          apiKey={createdKey}
          onClose={() => setCreatedKey(null)}
        />
      )}
    </div>
  )
}
