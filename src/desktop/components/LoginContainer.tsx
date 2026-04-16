import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import LoginForm from './LoginForm'
import { truenasApi, ConnectionState } from '@truenas/api'

export default function LoginContainer() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check initial connection state
    setIsConnected(truenasApi.getConnectionState() === ConnectionState.Connected)

    // Subscribe to connection state changes
    const unsubscribe = truenasApi.onConnectionStateChange((state) => {
      setIsConnected(state === ConnectionState.Connected)
    })

    return unsubscribe
  }, [])

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

      {!isConnected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
            color: '#92400e',
          }}
        >
          <WifiOff size={16} />
          <span>无法连接到服务器，请检查网络连接</span>
        </div>
      )}

      <LoginForm />
    </div>
  )
}
