import React, { useState } from 'react'
import { api } from '../api/client'

type Props = {
  onSuccess?: () => void
  onClose?: () => void
}

export default function LoginForm({ onSuccess, onClose }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.login(username, password)
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (err) {
      setError('登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>用户名</div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          style={{
            width: '100%',
            height: 38,
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '0 12px',
            background: '#fff',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
            boxSizing: 'border-box',
            maxWidth: '100%'
          }}
        />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>密码</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{
            width: '100%',
            height: 38,
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '0 12px',
            background: '#fff',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
            boxSizing: 'border-box',
            maxWidth: '100%'
          }}
        />
      </div>
      {error && (
        <div
          style={{
            color: '#b91c1c',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        className="panda-button"
        disabled={loading}
        style={{
          height: 38,
          borderRadius: 10,
          background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
          color: '#fff',
          fontWeight: 600
        }}
      >
        {loading ? '登录中…' : '登录'}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
        <div>忘记密码</div>
        <div>没有账号？联系管理员</div>
      </div>
    </form>
  )
}
