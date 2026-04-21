import React, { useState, useEffect } from 'react'
import { User, LogOut, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '@truenas/stores/auth'
import { truenasApi } from '../../truenas/api'
import { LoginExMechanism } from '../../shared/types/auth.interface'

interface LockScreenProps {
  onUnlock: () => void
  onLogout?: () => void
  wallpaper?: string
  username?: string
}

export default function LockScreen({ onUnlock, onLogout, wallpaper, username }: LockScreenProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState(new Date())

  const { user } = useAuthStore()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!password) return

    setLoading(true)
    setError('')
    try {
      // Verify password via TrueNAS API
      const result = await truenasApi.call('auth.login_ex', {
        mechanism: LoginExMechanism.PasswordPlain,
        username: user?.pw_name,
        password: password,
      }) as { response_type: string }

      if (result.response_type === 'SUCCESS') {
        onUnlock()
        setPassword('')
      } else {
        setError('密码错误，请重试')
        setPassword('')
      }
    } catch {
      setError('密码错误，请重试')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        overflow: 'hidden',
        userSelect: 'none',
        background: '#000',
      }}
    >
      {/* Background with Blur */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${wallpaper || '/wallpaper_default.webp'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) blur(20px)',
          transform: 'scale(1.1)',
        }}
      />

      {/* Content Container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        {/* Time */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: 80, fontWeight: 200, lineHeight: 1 }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div style={{ fontSize: 22, fontWeight: 300, marginTop: 10 }}>
            {time.toLocaleDateString([], { month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        {/* User Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            marginTop: 60,
            width: 320,
            position: 'relative',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <User size={48} strokeWidth={1.5} color="#fff" />
          </div>

          {/* Username with Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 20, fontWeight: 500, letterSpacing: 0.5 }}>
            <span>{user?.pw_name || username || 'User'}</span>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  borderRadius: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>

          {/* Password Input */}
          <form onSubmit={handleUnlock} style={{ width: '100%', position: 'relative' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="输入密码"
              disabled={loading}
              autoFocus
              className={`lock-input ${error ? 'error' : ''}`}
            />

            <button type="submit" disabled={loading || !password} className="submit-button">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            </button>
          </form>

          {/* Error Message */}
          <div
            style={{
              height: 20,
              marginTop: -10,
              color: '#fca5a5',
              fontSize: 13,
              textAlign: 'center',
              opacity: error ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            {error}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .lock-input {
          width: 100%;
          height: 46px;
          border-radius: 23px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 0 46px 0 20px;
          color: #fff;
          font-size: 15px;
          outline: none;
          backdrop-filter: blur(10px);
          transition: all 0.2s;
          box-sizing: border-box;
          box-shadow: none !important;
        }

        .lock-input:focus {
          background: rgba(0,0,0,0.5);
          border-color: rgba(255,255,255,0.3);
          box-shadow: none !important;
        }

        .lock-input.error {
          border-color: #ef4444;
        }

        .lock-input::placeholder {
          color: rgba(255,255,255,0.4);
        }

        /* Autofill fix - Force dark background and white text */
        .lock-input:-webkit-autofill,
        .lock-input:-webkit-autofill:hover,
        .lock-input:-webkit-autofill:focus,
        .lock-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(40, 40, 40, 0.8) inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .submit-button {
          position: absolute;
          right: 5px;
          top: 5px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #fff;
          outline: none;
          box-shadow: none !important;
        }

        .submit-button:hover:not(:disabled) {
          background: rgba(255,255,255,0.25);
        }

        .submit-button:disabled {
          cursor: default;
          opacity: 0.5;
          background: transparent;
        }
      `}</style>
    </div>
  )
}
