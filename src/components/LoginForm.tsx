import React, { useState } from 'react'
import { authService } from '../truenas/services/auth.service'
import { useAuthStore } from '../truenas/stores/auth.store'
import { LoginResult } from '../truenas/types/login-result.enum'
import { LoginExResponseType, LoginRedirectResponse } from '../truenas/types/auth.interface'

type Props = {
  onSuccess?: () => void
  onClose?: () => void
}

export default function LoginForm({ onSuccess, onClose }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { hasTwoFactor, setHasTwoFactor } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasTwoFactor) {
      if (!otp) {
        setError('请输入双因素认证码')
        return
      }
    } else {
      if (!username || !password) {
        setError('请输入用户名和密码')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const { loginResult, loginResponse } = await authService.login(
        username,
        password,
        hasTwoFactor ? otp : null,
      )

      if (loginResult === LoginResult.Success) {
        // Login successful
        setHasTwoFactor(false)
        setPassword('')
        setOtp('')
        onSuccess && onSuccess()
        onClose && onClose()
      } else if (loginResult === LoginResult.NoOtp) {
        // OTP required
        setPassword('')
        setOtp('')
      } else if (loginResult === LoginResult.Redirect) {
        // Handle redirect
        const links = (loginResponse as LoginRedirectResponse).urls
          .map((url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
          })
          .join(', ')
        setError(`无法在当前 URL 登录。请导航到: ${links}`)
      } else {
        // Show error message
        setError(authService.getLoginErrorMessage(loginResult, hasTwoFactor))
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const cancelOtpLogin = () => {
    setHasTwoFactor(false)
    setPassword('')
    setOtp('')
    setError('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 42,
    border:		 '1px solid #e5e7eb',
    borderRadius: 12,
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
    <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
      {!hasTwoFactor && (
        <>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={labelStyle}>用户名</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="root"
              className="panda-input-autofill-fix"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
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
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          </div>
        </>
      )}

      {hasTwoFactor && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={labelStyle}>双因素认证码</div>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="请输入 6 位认证码"
            className="panda-input-autofill-fix"
            style={inputStyle}
            maxLength={6}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
          <button
            type="button"
            onClick={cancelOtpLogin}
            style={{
              fontSize: 13,
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            返回密码登录
          </button>
        </div>
      )}

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
            gap: 8,
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
          boxShadow:
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          marginTop: 4,
        }}
      >
        {loading ? '正在登录...' : hasTwoFactor ? '验证' : '登录'}
      </button>

      {!hasTwoFactor && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            fontSize: 13,
            color: '#6b7280',
            marginTop: 4,
          }}
        >
          <div
            style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            忘记密码
          </div>
        </div>
      )}
    </form>
  )
}
