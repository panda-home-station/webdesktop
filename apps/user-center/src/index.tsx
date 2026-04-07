import React, { useEffect, useMemo, useRef, useState, useContext, useCallback } from 'react'
import { Sidebar } from '@src/components/Sidebar'
import { WindowContext, useWindow } from '@src/sdk/window'
import { useAuthStore } from '@src/truenas/stores/auth'
import Icon from '@mdi/react'
import {
  mdiAccountCircleOutline,
  mdiImageOutline,
  mdiShieldLockOutline,
  mdiKeyVariant,
  mdiLockOutline
} from '@mdi/js'
import { getWallpaper as getDesktopWallpaper, setWallpaper as setDesktopWallpaper } from '@src/state/desktop'
import { ChangePasswordDialog } from './components/ChangePasswordDialog'
import { UserApiKeys } from './components/UserApiKeys'

// Mock API for now - will be replaced with TrueNAS API
const api = {
  fsMkdir: async (path: string) => { },
  fsList: async (path: string) => ({ entries: [] }),
  fsUpload: async (path: string, file: File) => { },
  fsDownloadUrl: (path: string) => '',
  getSecuritySettings: async () => ({ idle_timeout: 0, idle_action: 'lock' }),
  setSecuritySettings: async (settings: any) => { },
}

type Item = 'profile' | 'wallpapers' | 'security' | 'change-password' | 'api-keys'

const WALL_DIR = '/AppData/Wallpapers'

export default function UserCenter() {
  const win = useWindow()
  const [active, setActive] = useState<string>('profile')
  const { user } = useAuthStore()

  // Dialog states
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)

  // Track last active tab to prevent duplicate title updates
  const lastActiveRef = useRef('')

  // Update window title based on active tab
  useEffect(() => {
    if (lastActiveRef.current === active) {
      return
    }
    lastActiveRef.current = active

    const tabName = active === 'profile' ? '账户信息' :
                     active === 'wallpapers' ? '主题与壁纸' :
                     active === 'security' ? '安全设置' :
                     active === 'change-password' ? '更改密码' :
                     active === 'api-keys' ? '我的API Key' : ''
    win.setTitle(`User Center - ${tabName}`)
  }, [active])

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
        await api.fsMkdir(WALL_DIR)
      } catch {}
      try {
        const rs = await api.fsList(WALL_DIR)
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
          { id: 'security', label: '安全设置', icon: <Icon path={mdiShieldLockOutline} size="20px" /> },
          { id: 'change-password', label: '更改密码', icon: <Icon path={mdiLockOutline} size="20px" /> },
          { id: 'api-keys', label: '我的API Key', icon: <Icon path={mdiKeyVariant} size="20px" /> }
        ]}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12, gap: 12 }}>
        {active === 'profile' && (
          <div style={{ padding: 16, display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 700 }}>账户信息</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#64748b', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {(user?.pw_name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div>用户名：{user?.pw_name || '未登录'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>用户ID：{user?.pw_uid || '-'}</div>
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
                        await api.fsUpload(WALL_DIR, f)
                      }
                      const rs = await api.fsList(WALL_DIR)
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
                const url = api.fsDownloadUrl(full)
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
        {active === 'change-password' && (
          <ChangePasswordSection />
        )}
        {active === 'api-keys' && (
          <UserApiKeys />
        )}
      </div>

      {/* Dialogs */}
      {showChangePasswordDialog && (
        <ChangePasswordDialog
          open={showChangePasswordDialog}
          onClose={() => setShowChangePasswordDialog(false)}
          onSuccess={() => {
            // Password changed successfully
          }}
        />
      )}
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
      </div>
    </div>
  )
}

function ChangePasswordSection() {
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)

  return (
    <>
      <div style={{ padding: 16, display: 'grid', gap: 16 }}>
        <div style={{ fontWeight: 700 }}>更改密码</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          为了您的账户安全，请定期更改密码。
        </div>
        <button
          onClick={() => setShowChangePasswordDialog(true)}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            width: 'fit-content',
          }}
        >
          更改密码
        </button>
      </div>

      {showChangePasswordDialog && (
        <ChangePasswordDialog
          open={showChangePasswordDialog}
          onClose={() => setShowChangePasswordDialog(false)}
          onSuccess={() => {
            // Password changed successfully
          }}
        />
      )}
    </>
  )
}
