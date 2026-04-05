import React, { useState } from 'react'
import Desktop from './components/Desktop'
import LoginContainer from './components/LoginContainer'
import LoginLoading from './components/LoginLoading'
import LockScreen from './components/LockScreen'
import SmoothWallpaper from './components/SmoothWallpaper'
import { useWebSocketInit } from './hooks/useWebSocketInit'
import { useWallpaper } from './hooks/useWallpaper'
import { useAutoLogin } from './hooks/useAutoLogin'
import { useAlertInit } from './hooks/useAlertInit'
import { useAuthStore } from './truenas/stores/auth'

export default function App() {
  useWebSocketInit()
  useAlertInit()
  const wallpaper = useWallpaper()
  const [isLocked, setIsLocked] = useState(false)
  const { isAuthenticated, user } = useAuthStore()

  const isAutoLoggingIn = useAutoLogin(isAuthenticated)

  if (!isAuthenticated) {
    return (
      <div className="fullScreen panda-desktop">
        <SmoothWallpaper src={wallpaper} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {isAutoLoggingIn ? <LoginLoading /> : <LoginContainer />}
        </div>
      </div>
    )
  }

  if (isLocked) {
    return (
      <LockScreen
        wallpaper={wallpaper}
        username={user?.pw_name}
        onUnlock={() => setIsLocked(false)}
        onLogout={async () => {
          const authStore = useAuthStore.getState()
          await authStore.logout()
          window.location.reload()
        }}
      />
    )
  }

  return (
    <div className="fullScreen panda-desktop">
      <SmoothWallpaper src={wallpaper} />
      <Desktop />
    </div>
  )
}
