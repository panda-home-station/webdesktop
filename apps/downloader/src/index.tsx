import React, { useEffect, useState } from 'react'
import { api } from '../../../src/api/client'
import Icon from '@mdi/react'
import { mdiPlus, mdiDelete, mdiDownload, mdiPause, mdiPlay } from '@mdi/js'

type DownloadTask = {
  id: string
  url: string
  filename: string
  status: string
  progress: number
  total_bytes: number
  downloaded_bytes: number
  speed: number
  created_at: string
  error_msg?: string
}

export default function Downloader() {
  const [tasks, setTasks] = useState<DownloadTask[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [error, setError] = useState('')

  // Cast api to any because we added methods via SearchReplace but TS might complain if types aren't updated in d.ts
  // In this project structure, client.ts is the source of truth, so it should be fine if VSCode picks it up.
  // But to be safe in this file:
  const downloaderApi = api as any

  const fetchTasks = async () => {
    try {
      const data = await downloaderApi.listDownloads()
      setTasks(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleAdd = async () => {
    if (!newUrl) return
    try {
      await downloaderApi.createDownload(newUrl)
      setShowAdd(false)
      setNewUrl('')
      setError('')
      fetchTasks()
    } catch (e) {
      setError('Failed to add task')
    }
  }

  const handleControl = async (id: string, action: string) => {
    try {
      await downloaderApi.controlDownload(id, action)
      fetchTasks()
    } catch (e) {
      console.error(e)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSec: number) => {
    return formatBytes(bytesPerSec) + '/s'
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5', color: '#333' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={() => setShowAdd(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '5px', 
            padding: '8px 16px', background: '#1890ff', color: '#fff', 
            border: 'none', borderRadius: '4px', cursor: 'pointer' 
          }}
        >
          <Icon path={mdiPlus} size={0.8} />
          New Task
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left', color: '#666' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Size</th>
              <th style={{ padding: '12px' }}>Progress</th>
              <th style={{ padding: '12px' }}>Speed</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon path={mdiDownload} size={0.8} color="#666" />
                  <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.url}>
                    {task.filename}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>{formatBytes(task.total_bytes)}</td>
                <td style={{ padding: '12px', width: '200px' }}>
                  <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${task.progress}%`, height: '100%', background: task.status === 'error' ? '#ff4d4f' : '#1890ff', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{task.progress.toFixed(1)}%</div>
                </td>
                <td style={{ padding: '12px' }}>{task.status === 'downloading' ? formatSpeed(task.speed) : '-'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                    background: task.status === 'done' ? '#f6ffed' : task.status === 'error' ? '#fff1f0' : '#e6f7ff',
                    color: task.status === 'done' ? '#52c41a' : task.status === 'error' ? '#ff4d4f' : '#1890ff',
                    border: `1px solid ${task.status === 'done' ? '#b7eb8f' : task.status === 'error' ? '#ffa39e' : '#91d5ff'}`
                  }}>
                    {task.status}
                  </span>
                  {task.status === 'error' && <div style={{ fontSize: '10px', color: 'red' }}>{task.error_msg}</div>}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {task.status === 'downloading' && (
                      <button onClick={() => handleControl(task.id, 'pause')} style={{ border: 'none', background: 'none', cursor: 'pointer' }} title="Pause">
                        <Icon path={mdiPause} size={0.8} color="#faad14" />
                      </button>
                    )}
                    {(task.status === 'paused' || task.status === 'error') && (
                      <button onClick={() => handleControl(task.id, 'resume')} style={{ border: 'none', background: 'none', cursor: 'pointer' }} title="Resume">
                        <Icon path={mdiPlay} size={0.8} color="#52c41a" />
                      </button>
                    )}
                    <button onClick={() => handleControl(task.id, 'delete')} style={{ border: 'none', background: 'none', cursor: 'pointer' }} title="Delete">
                      <Icon path={mdiDelete} size={0.8} color="#ff4d4f" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No downloads yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0 }}>Add Download Task</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>URL / Magnet Link</label>
              <input 
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://... or magnet:?..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} style={{ padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Download</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
