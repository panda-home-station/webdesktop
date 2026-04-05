import React from 'react'
import LoginForm from './LoginForm'

export default function LoginContainer() {
  return (
    <div className="card loginCard">
      <h2
        style={{
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 600,
          marginBottom: 24,
          color: '#1f2937',
        }}
      >
        PHS WebDesktop
      </h2>
      <LoginForm />
    </div>
  )
}
