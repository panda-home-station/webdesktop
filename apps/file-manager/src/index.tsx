import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../../src/api/client'

export default function FileManager() {
  const [path, setPath] = useState<string>('/')
  const [entries, setEntries] = useState<
    { name: string; is_dir: boolean; size: number; modified_ts: number }[]
  >([])
  const [loading, setLoading] = useState<boolean>(false)
  const [active, setActive] = useState<string>('home')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const r = await api.fsList(path)
        if (!mounted) return
        setEntries(r.entries)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [path])

  const up = useMemo(() => {
    if (path === '/' || path === '') return '/'
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }, [path])

  const crumbs = useMemo(() => {
    const parts = path.split('/').filter(Boolean)
    const acc: { label: string; to: string }[] = [{ label: '根目录', to: '/' }]
    let cur = ''
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : `/${p}`
      acc.push({ label: p, to: cur })
    }
    return acc
  }, [path])

  const fmtTime = (ts: number) => {
    if (!ts) return '-'
    return new Date(ts * 1000).toLocaleString()
  }

  const goto = async (to: string, key: string) => {
    setActive(key)
    if (to !== '/') {
      await api.fsMkdir(to)
    }
    setPath(to)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', height: '100%' }}>
      <div style={{ borderRight: '1px solid var(--win-border)', padding: 8, color: 'var(--text)' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>位置</div>
        <div style={{ display: 'grid', gap: 6 }}>
          <button className="puter-button" style={{ justifyContent: 'flex-start', background: active === 'home' ? 'rgba(0,0,0,0.08)' : undefined }} onClick={() => goto('/', 'home')}>主文件夹</button>
          <button className="puter-button" style={{ justifyContent: 'flex-start', background: active === 'downloads' ? 'rgba(0,0,0,0.08)' : undefined }} onClick={() => goto('/Downloads', 'downloads')}>下载</button>
          <button className="puter-button" style={{ justifyContent: 'flex-start', background: active === 'documents' ? 'rgba(0,0,0,0.08)' : undefined }} onClick={() => goto('/Documents', 'documents')}>文档</button>
          <button className="puter-button" style={{ justifyContent: 'flex-start', background: active === 'pictures' ? 'rgba(0,0,0,0.08)' : undefined }} onClick={() => goto('/Pictures', 'pictures')}>图片</button>
          <button className="puter-button" style={{ justifyContent: 'flex-start', background: active === 'music' ? 'rgba(0,0,0,0.08)' : undefined }} onClick={() => goto('/Music', 'music')}>音乐</button>
          <button className="puter-button" style={{ justifyContent: 'flex-start', background: active === 'videos' ? 'rgba(0,0,0,0.08)' : undefined }} onClick={() => goto('/Videos', 'videos')}>视频</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid var(--win-border)', color: 'var(--text)' }}>
          <button onClick={() => setPath(up)} disabled={path === '/'}>上级</button>
          <button
            onClick={async () => {
              const name = prompt('新建文件夹名称')
              if (!name) return
              const next = path.endsWith('/') ? `${path}${name}` : `${path}/${name}`
              const r = await api.fsMkdir(next)
              if (r.ok) {
                const rs = await api.fsList(path)
                setEntries(rs.entries)
              }
            }}
          >
            新建文件夹
          </button>
          <span>
            {crumbs.map((c, i) => (
              <span key={c.to}>
                <button style={{ color: '#2563eb', marginRight: 4 }} onClick={() => setPath(c.to)}>{c.label}</button>
                {i < crumbs.length - 1 ? '/' : ''}
              </span>
            ))}
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 8, color: 'var(--text)' }}>
          {loading ? (
            <div>加载中…</div>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>名称</th>
                  <th style={{ textAlign: 'left' }}>类型</th>
                  <th style={{ textAlign: 'right' }}>大小</th>
                  <th style={{ textAlign: 'right' }}>修改时间</th>
                  <th style={{ textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={`${path}/${e.name}`}>
                    <td>
                      <button
                        style={{ color: '#93c5fd' }}
                        onClick={() => {
                          if (e.is_dir) {
                            const next = path.endsWith('/') ? `${path}${e.name}` : `${path}/${e.name}`
                            setPath(next)
                          }
                        }}
                      >
                        {e.name}
                      </button>
                    </td>
                    <td>{e.is_dir ? '目录' : '文件'}</td>
                    <td style={{ textAlign: 'right' }}>{e.is_dir ? '-' : e.size}</td>
                    <td style={{ textAlign: 'right' }}>{fmtTime(e.modified_ts)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={async () => {
                          const p = path.endsWith('/') ? `${path}${e.name}` : `${path}/${e.name}`
                          const r = await api.fsDelete(p)
                          if (r.ok) {
                            const rs = await api.fsList(path)
                            setEntries(rs.entries)
                          }
                        }}
                      >
                        删除
                      </button>
                      {!e.is_dir && (
                        <a href={api.fsDownloadUrl(path.endsWith('/') ? `${path}${e.name}` : `${path}/${e.name}`)} style={{ marginLeft: 8 }}>
                          下载
                        </a>
                      )}
                      <button
                        style={{ marginLeft: 8 }}
                        onClick={async () => {
                          const oldPath = path.endsWith('/') ? `${path}${e.name}` : `${path}/${e.name}`
                          const newName = prompt('重命名为', e.name)
                          if (!newName || newName === e.name) return
                          const newPath = path.endsWith('/') ? `${path}${newName}` : `${path}/${newName}`
                          const rr = await api.fsRename(oldPath, newPath)
                          if (rr.ok) {
                            const rs = await api.fsList(path)
                            setEntries(rs.entries)
                          }
                        }}
                      >
                        重命名
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
