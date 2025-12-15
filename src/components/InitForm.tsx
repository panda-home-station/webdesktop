import React, { useState } from 'react'
import { api } from '../api/client'

type Props = {
  onDone?: () => void
}

export default function InitForm({ onDone }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请输入管理员用户名和密码')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.initSystem(username, password)
      setOk(true)
      onDone && onDone()
    } catch {
      setError('初始化失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#111827' }}>系统初始化</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>设置管理员用户名与密码</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>管理员用户名</div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          style={{ width: '100%', height: 38, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', background: '#fff', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)', boxSizing: 'border-box', maxWidth: '100%' }}
        />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>管理员密码</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={{ width: '100%', height: 38, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', background: '#fff', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)', boxSizing: 'border-box', maxWidth: '100%' }}
        />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280' }}>确认密码</div>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          style={{ width: '100%', height: 38, border: '1px solid #e5e7eb', borderRadius: 10, padding: '0 12px', background: '#fff', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)', boxSizing: 'border-box', maxWidth: '100%' }}
        />
      </div>
      {error && (
        <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
          {error}
        </div>
      )}
      {ok && (
        <div style={{ color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
          初始化完成，请使用管理员账号登录
        </div>
      )}
      <button type="submit" className="puter-button" disabled={loading} style={{ height: 38, borderRadius: 10, background: 'linear-gradient(90deg, #10b981, #22c55e)', color: '#fff', fontWeight: 600 }}>
        {loading ? '初始化中…' : '完成初始化'}
      </button>
    </form>
  )
}
