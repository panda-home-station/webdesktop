import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { subscribeMaximizedWindow, requestWinAction } from '../sdk/desktop'

export default function StatusBar() {
  const [healthy, setHealthy] = useState<boolean>(false)
  const [version, setVersion] = useState<string>('')
  const [ts, setTs] = useState<number>(0)
  const [open, setOpen] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const [maxWin, setMaxWin] = useState<{ id: string; title: string } | null>(null)

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

  useEffect(() => {
    const unsub = subscribeMaximizedWindow((info) => setMaxWin(info))
    return () => unsub()
  }, [])

  return (
    <div style={{ height: 32, display: 'flex', alignItems: 'center', padding: '0 8px', background: '#f3f4f6', color: '#111827', fontFamily: 'sans-serif', position: 'relative' }}>
      {maxWin && (
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <span style={{ fontWeight: 600 }}>{maxWin.title}</span>
        </div>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {maxWin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="win-btn" onClick={() => requestWinAction(maxWin.id, 'minimize')}>
              <svg width="14" height="14" viewBox="0 0 24 24">
                <rect x="5" y="12" width="14" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
            <button className="win-btn" onClick={() => requestWinAction(maxWin.id, 'toggleMax')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button className="win-btn close" onClick={() => requestWinAction(maxWin.id, 'close')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div style={{ position: 'relative' }} ref={ref}>
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
    </div>
  )
}
