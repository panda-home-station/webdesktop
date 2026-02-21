import React, { useEffect, useMemo, useRef, useState, useContext } from 'react'
import { Sidebar } from '../../../src/components/Sidebar'
import { WindowContext } from '../../../src/sdk/window'
import { instance as axios, api } from '../../../src/api/client'
import Icon from '@mdi/react'
import { mdiAccountCircleOutline, mdiImageOutline, mdiShieldLockOutline } from '@mdi/js'
import { getWallpaper as getDesktopWallpaper, setWallpaper as setDesktopWallpaper } from '../../../src/state/desktop'

type Item = 'profile' | 'wallpapers' | 'security'

const WALL_DIR = '/AppData/Wallpapers'

const fmApi = {
  async fsMkdir(path: string) {
    await axios.post('/api/docs/mkdir', { path })
  },
  async fsList(path: string) {
    const r = await axios.get('/api/docs/list', { params: { path, limit: 200, offset: 0 } })
    return r.data as { path: string; entries: { id?: string; name: string; is_dir: boolean }[] }
  },
  async fsUpload(dir: string, file: File) {
    const fd = new FormData()
    fd.append('path', dir)
    fd.append('size', String(file.size))
    fd.append('offset', '0')
    fd.append('file', file)
    await axios.post('/api/docs/upload', fd)
  },
  fsDownloadUrl(path: string) {
    const host = window.location.hostname || 'localhost'
    const apiPort = (import.meta as any).env?.VITE_PNAS_PORT ?? '8000'
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
    const base = `${protocol}://${host}:${apiPort}`
    const token = localStorage.getItem('authToken') || ''
    const u = new URL(`${base}/api/docs/download`)
    u.searchParams.set('path', path || '')
    if (token) u.searchParams.set('token', token)
    return u.toString()
  },
  getUser(): { user_id: string; username: string } | null {
    try {
      const raw = localStorage.getItem('authUser')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }
}

export default function UserCenter() {
  const win = useContext(WindowContext)
  const [active, setActive] = useState<string>('profile')

  useEffect(() => {
    if (win && win.setTitle) {
      const tabName = active === 'profile' ? '账户信息' : active === 'wallpapers' ? '主题与壁纸' : '安全'
      win.setTitle(`User Center - ${tabName}`)
    }
  }, [active, win])

  const user = fmApi.getUser()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [busy, setBusy] = useState(false)
  const [entries, setEntries] = useState<{ name: string; is_dir: boolean }[]>([])
  const imgs = useMemo(() => {
    const allow = new Set(['jpg', 'jpeg', 'png', 'webp'])
    return entries.filter(e => !e.is_dir && allow.has((e.name.split('.').pop() || '').toLowerCase()))
  }, [entries])

  const curWallpaper = getDesktopWallpaper()

  useEffect(() => {
    if (active !== 'wallpapers') return
    ;(async () => {
      setBusy(true)
      try {
        await fmApi.fsMkdir(WALL_DIR)
      } catch {}
      try {
        const rs = await fmApi.fsList(WALL_DIR)
        setEntries(rs.entries)
      } catch {
        setEntries([])
      } finally {
        setBusy(false)
      }
    })()
  }, [active])

  useEffect(() => {
    ;(async () => {
      try {
        const url = getDesktopWallpaper()
        if (url) {
          try {
            const ev = new CustomEvent('desktop:wallpaper', { detail: { url } })
            window.dispatchEvent(ev)
          } catch {}
        }
      } catch {}
    })()
  }, [])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: 'transparent' }} className="noselect">
      <Sidebar
        activeId={active}
        onSelect={(id) => setActive(id as Item)}
        items={[
          { id: 'profile', label: '账户信息', icon: <Icon path={mdiAccountCircleOutline} size="20px" /> },
          { id: 'wallpapers', label: '主题与壁纸', icon: <Icon path={mdiImageOutline} size="20px" /> },
          { id: 'security', label: '安全设置', icon: <Icon path={mdiShieldLockOutline} size="20px" /> }
        ]}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 12 }}>
        {active === 'profile' && (
          <div style={{ padding: 16, display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 700 }}>账户信息</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#64748b', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {(user?.username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div>用户名：{user?.username || '未登录'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>用户ID：{user?.user_id || '-'}</div>
              </div>
            </div>
          </div>
        )}
        {active === 'wallpapers' && (
          <div style={{ padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>主题与壁纸</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>目录：{WALL_DIR}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--button-border)', background: 'var(--button-bg)', color: 'var(--text)' }}
                onClick={() => setDesktopWallpaper(null)}
                title="恢复默认壁纸"
              >
                使用默认壁纸
              </button>
              <label
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--button-border)', background: 'var(--button-bg)', color: 'var(--text)', cursor: 'pointer' }}
              >
                上传壁纸
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const files = e.target.files
                    if (!files || files.length === 0) return
                    setBusy(true)
                    try {
                      for (const f of Array.from(files)) {
                        await fmApi.fsUpload(WALL_DIR, f)
                      }
                      const rs = await fmApi.fsList(WALL_DIR)
                      setEntries(rs.entries)
                    } finally {
                      setBusy(false)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }}
                />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {imgs.map(it => {
                const full = WALL_DIR.endsWith('/') ? `${WALL_DIR}${it.name}` : `${WALL_DIR}/${it.name}`
                const url = fmApi.fsDownloadUrl(full)
                const selected = curWallpaper && curWallpaper.includes(it.name)
                return (
                  <button
                    key={it.name}
                    title={it.name}
                    onClick={() => setDesktopWallpaper(full)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: 8,
                      borderRadius: 10,
                      border: selected ? '2px solid #3b82f6' : '1px solid var(--button-border)',
                      background: 'var(--button-bg)',
                      color: 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={url} alt="" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', borderRadius: 8 }} />
                    <div style={{ fontSize: 12, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                  </button>
                )
              })}
              {!busy && imgs.length === 0 && (
                <div style={{ padding: 8, fontSize: 12, color: 'var(--muted)' }}>目录为空，请上传壁纸</div>
              )}
              {busy && <div style={{ padding: 8, fontSize: 12, color: 'var(--muted)' }}>处理中...</div>}
            </div>
          </div>
        )}
        {active === 'security' && (
          <SecuritySettings />
        )}
      </div>
    </div>
  )
}

function SecuritySettings() {
  const [idleTimeout, setIdleTimeout] = useState(0)
  const [idleAction, setIdleAction] = useState('lock')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSecuritySettings().then(settings => {
      setIdleTimeout(settings.idle_timeout)
      setIdleAction(settings.idle_action)
      setLoading(false)
    })
  }, [])

  const handleTimeoutChange = async (val: number) => {
    setIdleTimeout(val)
    await api.setSecuritySettings({ idle_timeout: val, idle_action: idleAction })
    window.dispatchEvent(new CustomEvent('pnas:settings-changed'))
  }

  const handleActionChange = async (val: string) => {
    setIdleAction(val)
    await api.setSecuritySettings({ idle_timeout: idleTimeout, idle_action: val })
    window.dispatchEvent(new CustomEvent('pnas:settings-changed'))
  }

  if (loading) {
    return <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>加载中...</div>
  }

  return (
    <div style={{ padding: 16, display: 'grid', gap: 16 }}>
      <div style={{ fontWeight: 700 }}>安全设置</div>
      
      <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>自动锁定与退出</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>当您在指定时间内没有操作时，系统将自动执行锁定屏幕或退出登录的操作。</div>
          
          <div style={{ display: 'grid', gap: 10, padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>空闲等待时间</span>
              <select 
                value={idleTimeout} 
                onChange={(e) => handleTimeoutChange(parseInt(e.target.value))}
                style={{ 
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--button-border)',
                  background: 'var(--button-bg)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none'
                }}
              >
                <option value={0}>从不</option>
                <option value={1}>1 分钟</option>
                <option value={5}>5 分钟</option>
                <option value={15}>15 分钟</option>
                <option value={30}>30 分钟</option>
                <option value={60}>1 小时</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>空闲时操作</span>
              <select 
                value={idleAction} 
                onChange={(e) => handleActionChange(e.target.value)}
                style={{ 
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--button-border)',
                  background: 'var(--button-bg)',
                  color: 'var(--text)',
                  fontSize: 13,
                  outline: 'none'
                }}
              >
                <option value="lock">锁定屏幕</option>
                <option value="logout">退出登录</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>登录保护</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>为了您的账户安全，建议定期更改密码。</div>
          <button
            style={{ 
              padding: '8px 12px', 
              borderRadius: 8, 
              border: '1px solid var(--button-border)', 
              background: 'var(--button-bg)', 
              color: 'var(--text)',
              fontSize: 13,
              width: 'fit-content',
              cursor: 'pointer'
            }}
            onClick={() => {}}
          >
            修改登录密码
          </button>
        </div>
      </div>
    </div>
  )
}
