import React, { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '../../../src/components/Sidebar'
import { api } from '../../../src/api/client'
import Icon from '@mdi/react'
import { mdiAccountCircleOutline, mdiImageOutline } from '@mdi/js'

type Item = 'profile' | 'wallpapers'

const WALL_DIR = '/AppData/Wallpapers'
const WP_KEY = 'wallpaperUrl'

export default function UserCenter() {
  const [active, setActive] = useState<Item>('profile')
  const user = api.getUser()

  const [busy, setBusy] = useState(false)
  const [entries, setEntries] = useState<{ name: string; is_dir: boolean }[]>([])
  const imgs = useMemo(() => {
    const allow = new Set(['jpg', 'jpeg', 'png', 'webp'])
    return entries.filter(e => !e.is_dir && allow.has((e.name.split('.').pop() || '').toLowerCase()))
  }, [entries])

  const curWallpaper = localStorage.getItem(WP_KEY) || ''

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

  const setWallpaper = (url: string | null) => {
    if (!url) localStorage.removeItem(WP_KEY)
    else localStorage.setItem(WP_KEY, url)
    try {
      const ev = new CustomEvent('desktop:wallpaper', { detail: { url: url || '' } })
      window.dispatchEvent(ev)
    } catch {}
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: 'transparent' }} className="noselect">
      <Sidebar
        width={220}
        activeId={active}
        onSelect={(id) => setActive(id as Item)}
        items={[
          { id: 'profile', label: '账户信息', icon: <Icon path={mdiAccountCircleOutline} size={1} /> },
          { id: 'wallpapers', label: '主题与壁纸', icon: <Icon path={mdiImageOutline} size={1} /> }
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
                onClick={() => setWallpaper(null)}
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
                      e.currentTarget.value = ''
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
                    onClick={() => setWallpaper(url)}
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
      </div>
    </div>
  )
}
