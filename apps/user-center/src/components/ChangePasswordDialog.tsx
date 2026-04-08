import { useState } from 'react'
import { Modal, ModalProps } from '@desktop/components/Modal'
import { truenasApi } from '@truenas/api'
import { useAuthStore } from '@truenas/stores/auth'

interface ChangePasswordDialogProps extends Omit<ModalProps, 'children'> {
  onSuccess?: () => void
}

export function ChangePasswordDialog({ onSuccess, ...modalProps }: ChangePasswordDialogProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { user } = useAuthStore()
  const username = user?.pw_name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationError(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setValidationError('新密码和确认密码不匹配')
      return
    }

    if (!username) {
      setError('无法获取用户信息')
      return
    }

    setLoading(true)
    try {
      await truenasApi.call('user.set_password', [{
        old_password: oldPassword,
        new_password: newPassword,
        username,
      }])
      // Success
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      // Try to extract error message from backend response
      // Check for validation errors from TrueNAS backend
      let errorMessage = err?.message ||
                        err?.strerror ||
                        err?.reason ||
                        '更改密码失败，请稍后重试'

      // Check for validation errors in data.extra format
      // TrueNAS returns validation errors as: { data: { extra: [['field', 'message'], ...] } }
      if (err?.data?.extra && Array.isArray(err.data.extra)) {
        const fieldErrors = err.data.extra as [string, string][]
        const oldPasswordError = fieldErrors.find(([field]) =>
          field.includes('old_password') || field.includes('oldPassword') || field.includes('old')
        )
        const newPasswordError = fieldErrors.find(([field]) =>
          field.includes('new_password') || field.includes('newPassword') || field.includes('new')
        )

        if (oldPasswordError) {
          errorMessage = oldPasswordError[1] || '当前密码错误'
        } else if (newPasswordError) {
          errorMessage = newPasswordError[1] || '新密码不符合要求'
          setValidationError(errorMessage)
          setLoading(false)
          return
        }
      }

      // Check if data contains error information in other formats
      if (err?.data) {
        const dataMessage = err.data.error?.message ||
                          err.data.message ||
                          err.data.strerror ||
                          err.data.reason
        if (dataMessage) {
          errorMessage = dataMessage
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setSuccess(false)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    modalProps.onClose()
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
      {...modalProps}
      title={success ? '密码修改成功' : '更改密码'}
      width={450}
      onClose={success ? handleSuccessClose : modalProps.onClose}
      footer={
        success ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={handleSuccessClose}
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
              确定
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              disabled={loading}
              onClick={modalProps.onClose}
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
              form="change-password-form"
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
              {loading ? '更改中...' : '确认更改'}
            </button>
          </div>
        )
      }
    >
      {success ? (
        <div style={{ display: 'grid', gap: 16, textAlign: 'center', padding: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#d1fae5',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto',
            }}
          >
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 16, color: '#374151', lineHeight: 1.6 }}>
            您的密码已成功修改！
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            下次登录时请使用新密码
          </div>
        </div>
      ) : (
        <form id="change-password-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
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

          {validationError && (
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
              {validationError}
            </div>
          )}

          <div style={{ display: 'grid', gap: 6 }}>
            <div style={labelStyle}>当前密码</div>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入当前密码"
              className="panda-input-autofill-fix"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <div style={labelStyle}>新密码</div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码"
              className="panda-input-autofill-fix"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <div style={labelStyle}>确认新密码</div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              className="panda-input-autofill-fix"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              disabled={loading}
            />
          </div>
        </form>
      )}
    </Modal>
  )
}
