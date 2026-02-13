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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 42,
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '0 14px',
    background: '#f9fafb',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontSize: 14
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 4
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={labelStyle}>用户名</div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          className="panda-input-autofill-fix"
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={labelStyle}>密码</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="panda-input-autofill-fix"
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
      </div>
      {error && (
        <div
          style={{
            color: '#b91c1c',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
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
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 15,
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          marginTop: 4
        }}
      >
        {loading ? '正在登录...' : '登录'}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
        <div style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>忘记密码</div>
        <div style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>没有账号？</div>
      </div>
    </form>
  )
}
