import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

export default function StatusBar() {
  const [healthy, setHealthy] = useState<boolean>(false)
  const [version, setVersion] = useState<string>('')
  const [ts, setTs] = useState<number>(0)

  useEffect(() => {
    let mounted = true
    const poll = async () => {
      try {
        const h = await api.health()
        if (!mounted) return
        setHealthy(h.status === 'ok')
        setTs(h.ts)
      } catch {
        if (!mounted) return
        setHealthy(false)
      }
    }
    const loadVersion = async () => {
      try {
        const v = await api.version()
        if (!mounted) return
        setVersion(v.version)
      } catch {}
    }
    poll()
    loadVersion()
    const id = setInterval(poll, 5000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const dotStyle = useMemo(
    () => ({
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: 10,
      backgroundColor: healthy ? '#22c55e' : '#ef4444',
      marginRight: 8
    }),
    [healthy]
  )

  return (
    <div style={{ height: 32, display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--titlebar-bg)', color: 'var(--text)', fontFamily: 'sans-serif', gap: 12, backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--win-border)' }}>
      <span style={dotStyle} />
      <span>后端 {healthy ? '在线' : '离线'}</span>
      <span>版本 {version || '-'}</span>
      <span>时间戳 {ts || '-'}</span>
    </div>
  )
}
