import React, { useEffect, useMemo, useState } from 'react'
import Desktop from './components/Desktop'
import LoginForm from './components/LoginForm'
import InitForm from './components/InitForm'
import { api } from './api/client'
import { getWallpaper } from './state/desktop'

export default function App() {
  const [user, setUser] = useState(api.getUser())
  const [wallpaper, setWallpaperUrl] = useState(getWallpaper())
  const [initChecked, setInitChecked] = useState(false)
  const [needInit, setNeedInit] = useState(false)
  useEffect(() => {
    if (api.getToken()) {
      api.whoami().then(u => {
        setUser(u)
      }).catch(() => {
        api.logout()
        setUser(null)
      })
    }
    api.initState().then(s => {
      setNeedInit(!s.initialized)
      setInitChecked(true)
    }).catch(() => {
      setInitChecked(true)
    })
  }, [])
  const bgStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : '#f3f4f6'
    }
  }, [wallpaper])
  if (!initChecked) {
    return null
  }
  if (needInit) {
    return (
      <div style={bgStyle}>
        <div
          className="puter-window"
          style={{
            width: 420,
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.86)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <InitForm onDone={() => {
            setNeedInit(false)
          }} />
        </div>
      </div>
    )
  }
  if (!user) {
    return (
      <div style={bgStyle}>
        <div
          className="puter-window"
          style={{
            width: 360,
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.86)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f6', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 18 }}>
              🔒
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>登录到系统</div>
          </div>
          <LoginForm onSuccess={() => setUser(api.getUser())} />
          <div style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 10 }}>请输入管理员或用户账号登录</div>
        </div>
      </div>
    )
  }
  return <Desktop />
}
