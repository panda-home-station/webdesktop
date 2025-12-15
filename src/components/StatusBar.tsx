import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

export default function StatusBar() {
  const [healthy, setHealthy] = useState<boolean>(false)
  const [version, setVersion] = useState<string>('')
  const [ts, setTs] = useState<number>(0)
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      const el = ref.current
      if (!el) return
      if (!el.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  return (
    <div style={{ height: 32, display: 'flex', alignItems: 'center', padding: '0 8px', background: '#f3f4f6', color: '#111827', fontFamily: 'sans-serif' }}>
      <div style={{ marginLeft: 'auto', position: 'relative' }} ref={ref}>
        <button
          className="puter-button"
          style={{ height: 24, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 8px' }}
          onClick={() => setOpen(x => !x)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#3b82f6" />
            <path d="M4 20a8 8 0 0 1 16 0" fill="#60a5fa" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {open && (
          <div
            className="puter-window"
            style={{
              position: 'absolute',
              right: 0,
              top: 28,
              width: 280,
              padding: 0,
              zIndex: 10001
            }}
          >
            <div style={{ padding: 12, background: 'rgba(0,0,0,0.06)', borderBottom: '1px solid var(--win-border)', borderTopLeftRadius: 'var(--win-radius)', borderTopRightRadius: 'var(--win-radius)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#111827' }}>用户信息</div>
              <div>用户名：guest</div>
              <div>角色：标准用户</div>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>系统信息</div>
              <div>后端：{healthy ? '在线' : '离线'}</div>
              <div>版本：{version || '-'}</div>
              <div>时间戳：{ts || '-'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
