import React from 'react'

export default function LoginLoading() {
  return (
    <div className="card loadingCard">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: '#ffffff',
          fontSize: 14,
        }}
      >
        <div className="spinner" />
        <span>登录中...</span>
      </div>
    </div>
  )
}
