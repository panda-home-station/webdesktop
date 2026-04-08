import React, { useState } from 'react'
import { api } from '../api/client'
import { clearPersistState } from './state/windows-store'

type Props = {
  onDone?: () => void
}

export default function InitForm({ onDone }: Props) {
  const [deviceName, setDeviceName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deviceName || !username || !password) {
      setError('请输入完整信息')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.initSystem(deviceName, username, password)
      // 初始化成功后更新页面标题
      document.title = `${deviceName} - Panda OS`
      // 初始化成功后清除本地残留的桌面状态（如打开的应用等）
      clearPersistState()
      // 初始化成功后自动登录
      await api.login(username, password)
      setOk(true)
      setTimeout(() => {
        if (onDone) onDone()
      }, 1000)
    } catch (err) {
      setError('初始化或登录失败')
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
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.025em' }}>
          欢迎使用 Panda NAS OS
        </div>
        <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          请完成初始设置以开始体验
        </div>
      </div>
      
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={labelStyle}>设备名称</div>
        <input
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="请输入设备名"
          className="panda-input-autofill-fix"
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <div style={labelStyle}>管理员用户名</div>
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
        <div style={labelStyle}>设置密码</div>
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

      <div style={{ display: 'grid', gap: 6 }}>
        <div style={labelStyle}>确认密码</div>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="panda-input-autofill-fix"
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
      </div>

      {error && (
        <div style={{ 
          color: '#b91c1c', 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          borderRadius: 10, 
          padding: '10px 12px', 
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {error}
        </div>
      )}
      <button 
        type="submit" 
        className="panda-button" 
        disabled={loading || ok} 
        style={{ 
          height: 44, 
          borderRadius: 12, 
          background: ok 
            ? 'linear-gradient(135deg, #059669, #059669)' 
            : 'linear-gradient(135deg, #10b981, #059669)', 
          color: '#fff', 
          fontWeight: 600,
          fontSize: 15,
          border: 'none',
          cursor: (loading || ok) ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease'
        }}
      >
        {loading ? '正在初始化...' : (ok ? '初始化成功，正在进入系统...' : '开始体验')}
      </button>
    </form>
  )
}
