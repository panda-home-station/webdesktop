import React, { useEffect, useState, useMemo, useContext } from 'react'
import { api } from '../../../src/api/client'
import { Modal } from '../../../src/components/Modal'
import { WindowContext } from '../../../src/sdk/window'
import Icon from '@mdi/react'
import {
  mdiPlus,
  mdiDelete,
  mdiDownload,
  mdiPause,
  mdiPlay,
  mdiAllInclusive,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiFolder,
  mdiArrowLeft,
  mdiCogOutline,
  mdiChevronDown,
  mdiChevronUp,
  mdiFile
} from '@mdi/js'
import { Sidebar } from '../../../src/components/Sidebar'

type SubTask = {
    filename: string
    progress: number
    total_bytes: number
    downloaded_bytes: number
    speed: number
    status: string
}

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
  virtual_path?: string
  sub_tasks?: SubTask[]
}

type TorrentFile = {
    index: number
    name: string
    size: number
}

type MagnetInfo = {
    token: string
    files: TorrentFile[]
}

const statusMap: Record<string, string> = {
  downloading: '下载中',
  paused: '已暂停',
  done: '已完成',
  error: '错误',
  pending: '等待中'
}

const formatPathDisplay = (path: string) => {
  if (path === '/') return '我的文件'
  if (path === '/AppData') return '应用文件'
  let display = path
  if (display.startsWith('/AppData')) {
    display = display.replace('/AppData', '应用文件')
  } else {
    display = '我的文件' + display
  }
  return display.replace(/\//g, ' > ')
}

const PathPicker = ({ initialPath, onClose, onSelect }: { initialPath: string; onClose: () => void; onSelect: (p: string) => void }) => {
  const [currentPath, setCurrentPath] = useState(initialPath || '/')
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    api.fsList(currentPath).then((res) => {
      if (res && res.entries) {
        setEntries(res.entries)
      } else {
        setEntries([])
      }
    })
  }, [currentPath])

  const handleCreateFolder = async () => {
    const name = prompt('请输入新文件夹名称')
    if (!name) return
    const newDir = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    await api.fsMkdir(newDir)
    const res = await api.fsList(currentPath)
    if (res && res.entries) setEntries(res.entries)
  }

  const roots = [
    { id: 'home', label: '我的文件', path: '/', icon: mdiFolder },
    { id: 'app', label: '应用文件', path: '/AppData', icon: mdiCogOutline }
  ]
  
  const activeRoot = roots.find(r => r.path === '/AppData' && currentPath.startsWith('/AppData')) || roots[0]
  const dirs = entries.filter(e => e.is_dir)

  return (
    <div style={{
      height: '100%',
      background: '#fff', display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>选择存储位置</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', color: '#999' }}>×</button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <div style={{ width: '160px', background: '#f9f9f9', borderRight: '1px solid #eee', padding: '10px 0', display: 'flex', flexDirection: 'column' }}>
          {roots.map(r => (
            <div 
              key={r.id}
              onClick={() => setCurrentPath(r.path)}
              style={{
                padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                background: activeRoot.id === r.id ? '#e6f7ff' : 'transparent',
                color: activeRoot.id === r.id ? '#1890ff' : '#555',
                borderRight: activeRoot.id === r.id ? '3px solid #1890ff' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
               <Icon path={r.icon} size={0.9} />
               <span style={{ fontSize: '14px', fontWeight: activeRoot.id === r.id ? 500 : 400 }}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff' }}>
          {/* Breadcrumb & Actions */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => {
                   if (currentPath === '/' || currentPath === '/AppData') return
                   const parts = currentPath.split('/').filter(Boolean)
                   parts.pop()
                   const parent = parts.length === 0 ? '/' : '/' + parts.join('/')
                   if (activeRoot.path === '/AppData' && !parent.startsWith('/AppData')) {
                      setCurrentPath('/AppData')
                   } else {
                      setCurrentPath(parent)
                   }
                }}
                disabled={currentPath === '/' || currentPath === '/AppData'}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', opacity: (currentPath === '/' || currentPath === '/AppData') ? 0.3 : 1, display: 'flex', padding: '4px' }}
                title="返回上一级"
              >
                <Icon path={mdiArrowLeft} size={0.9} color="#666" />
              </button>
              
              <div style={{ flex: 1, fontSize: '13px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                 {formatPathDisplay(currentPath)}
              </div>

              <button 
                onClick={handleCreateFolder} 
                style={{ 
                  border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer', 
                  color: '#666', display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '4px', fontSize: '12px'
                }}
              >
                 <Icon path={mdiPlus} size={0.7} />
                 <span>新建文件夹</span>
              </button>
          </div>

          {/* Directory List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
             {dirs.map(d => (
               <div 
                 key={d.name}
                 onClick={() => setCurrentPath(currentPath === '/' ? `/${d.name}` : `${currentPath}/${d.name}`)}
                 style={{ 
                   padding: '12px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', 
                   display: 'flex', alignItems: 'center', gap: '12px',
                   fontSize: '14px', color: '#333',
                   transition: 'background 0.2s'
                 }}
                 onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
               >
                  <Icon path={mdiFolder} size={1} color="#fbbf24" />
                  <span>{d.name}</span>
               </div>
             ))}
             {dirs.length === 0 && (
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', gap: '10px' }}>
                 <Icon path={mdiFolder} size={2} color="#f0f0f0" />
                 <span style={{ fontSize: '13px' }}>暂无子文件夹</span>
               </div>
             )}
          </div>

          {/* Footer Action */}
          <div style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '8px 20px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#666' }}>取消</button>
              <button onClick={() => onSelect(currentPath)} style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 0 rgba(0,0,0,0.045)' }}>确定</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Downloader() {
  const win = useContext(WindowContext)
  const [tasks, setTasks] = useState<DownloadTask[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newPath, setNewPath] = useState('/下载')
  const [showPicker, setShowPicker] = useState(false)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (win && win.setTitle) {
      const map: Record<string, string> = {
        all: '全部任务',
        downloading: '下载中',
        paused: '已暂停',
        done: '已完成',
        error: '错误'
      }
      win.setTitle(`Downloader - ${map[activeFilter] || '全部任务'}`)
    }
  }, [activeFilter, win])

  const [resolving, setResolving] = useState(false)
  const [magnetInfo, setMagnetInfo] = useState<MagnetInfo | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const next = new Set(expandedTasks)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedTasks(next)
  }

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
    
    if (newUrl.startsWith('magnet:')) {
         setResolving(true)
         setError('')
         try {
             const res = await downloaderApi.resolveMagnet(newUrl)
             setMagnetInfo(res)
             setSelectedFiles(res.files.map((f: any) => f.index))
         } catch(e) {
             setError('解析磁力链接失败')
         } finally {
             setResolving(false)
         }
         return
    }

    try {
      await downloaderApi.createDownload(newUrl, newPath)
      setShowAdd(false)
      setNewUrl('')
      setNewPath('/下载')
      setError('')
      fetchTasks()
    } catch (e) {
      setError('添加任务失败')
    }
  }
  
  const handleStartMagnet = async () => {
      if (!magnetInfo) return
      try {
          await downloaderApi.startMagnetDownload(magnetInfo.token, selectedFiles, newPath)
          setShowAdd(false)
          setMagnetInfo(null)
          setNewUrl('')
          setNewPath('/下载')
          setError('')
          fetchTasks()
      } catch(e: any) {
          console.error(e)
          const errorMsg = e.response?.data || e.message || '开始下载失败';
          setError(typeof errorMsg === 'string' ? errorMsg : '开始下载失败')
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

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return tasks
    return tasks.filter(t => t.status === activeFilter)
  }, [tasks, activeFilter])

  const sidebarSections = [
    {
      title: '任务状态',
      items: [
        { id: 'all', label: '所有任务', icon: <Icon path={mdiAllInclusive} size="20px" /> },
        { id: 'downloading', label: '下载中', icon: <Icon path={mdiDownload} size="20px" /> },
        { id: 'paused', label: '已暂停', icon: <Icon path={mdiPause} size="20px" /> },
        { id: 'done', label: '已完成', icon: <Icon path={mdiCheckCircle} size="20px" /> },
        { id: 'error', label: '错误', icon: <Icon path={mdiAlertCircle} size="20px" /> },
      ]
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', background: '#f5f5f5', color: '#333', userSelect: 'none', position: 'relative' }}>
      <Sidebar
        sections={sidebarSections}
        activeId={activeFilter}
        onSelect={setActiveFilter}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff' }}>
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
            新建任务
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left', color: '#666' }}>
                <th style={{ padding: '12px' }}>文件名</th>
                <th style={{ padding: '12px', width: '100px' }}>大小</th>
                <th style={{ padding: '12px', width: '200px' }}>进度</th>
                <th style={{ padding: '12px', width: '120px' }}>速度</th>
                <th style={{ padding: '12px', width: '100px' }}>状态</th>
                <th style={{ padding: '12px', width: '140px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <React.Fragment key={task.id}>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {task.sub_tasks && task.sub_tasks.length > 0 ? (
                        <button onClick={() => toggleExpand(task.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <Icon path={expandedTasks.has(task.id) ? mdiChevronUp : mdiChevronDown} size={0.8} color="#666" />
                        </button>
                    ) : (
                        <Icon path={mdiDownload} size={0.8} color="#666" />
                    )}
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
                      {statusMap[task.status] || task.status}
                    </span>
                    {task.status === 'error' && <div style={{ fontSize: '10px', color: 'red' }}>{task.error_msg}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {task.status === 'done' && (
                        <button 
                          onClick={() => openApp('file-manager', { initialPath: task.virtual_path || '/' })}
                          style={{ border: 'none', background: 'none', cursor: 'pointer' }} 
                          title="打开文件夹"
                        >
                          <Icon path={mdiFolder} size={0.8} color="#1890ff" />
                        </button>
                      )}
                      {task.status === 'downloading' && (
                        <button onClick={() => handleControl(task.id, 'pause')} style={{ border: 'none', background: 'none', cursor: 'pointer' }} title="暂停">
                          <Icon path={mdiPause} size={0.8} color="#faad14" />
                        </button>
                      )}
                      {(task.status === 'paused' || task.status === 'error') && (
                        <button onClick={() => handleControl(task.id, 'resume')} style={{ border: 'none', background: 'none', cursor: 'pointer' }} title="继续">
                          <Icon path={mdiPlay} size={0.8} color="#52c41a" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleControl(task.id, 'delete')} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer' }} 
                        title={task.status === 'done' ? "移除记录 (保留文件)" : "删除任务"}
                      >
                        <Icon path={mdiDelete} size={0.8} color="#ff4d4f" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedTasks.has(task.id) && task.sub_tasks && task.sub_tasks.map((sub, idx) => (
                    <tr key={`${task.id}-${idx}`} style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                         <td style={{ padding: '12px 12px 12px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <Icon path={mdiFile} size={0.7} color="#999" />
                             <div style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.filename}>
                                {sub.filename}
                             </div>
                         </td>
                         <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>{formatBytes(sub.total_bytes)}</td>
                         <td style={{ padding: '12px', width: '200px' }}>
                            <div style={{ width: '100%', height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${sub.progress}%`, height: '100%', background: '#1890ff', transition: 'width 0.3s' }} />
                            </div>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{sub.progress.toFixed(1)}%</div>
                         </td>
                         <td style={{ padding: '12px', color: '#666', fontSize: '13px' }}>{sub.status === 'downloading' ? formatSpeed(sub.speed) : '-'}</td>
                         <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#999' }}>{sub.status === 'done' ? '已完成' : statusMap[sub.status] || sub.status}</span>
                         </td>
                         <td style={{ padding: '12px' }}></td>
                    </tr>
                ))}
                </React.Fragment>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    暂无任务
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Modal */}
        <Modal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          width={600}
          title={showPicker ? null : magnetInfo ? "选择下载文件" : "新建下载任务"}
          bodyStyle={showPicker ? { padding: 0, height: 500 } : { padding: 24 }}
          footer={showPicker ? null : (
             resolving ? null : (
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                 <button onClick={() => {
                    if (magnetInfo) {
                      setMagnetInfo(null);
                      setNewUrl('');
                    } else {
                      setShowAdd(false);
                    }
                 }} style={{ padding: '8px 24px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#666' }}>取消</button>
                 <button onClick={magnetInfo ? handleStartMagnet : handleAdd} style={{ padding: '8px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 0 rgba(0,0,0,0.045)' }}>
                    {magnetInfo ? "立即下载" : "下载"}
                 </button>
               </div>
             )
          )}
        >
          {showPicker ? (
            <PathPicker 
               initialPath={newPath} 
               onClose={() => setShowPicker(false)} 
               onSelect={(p) => { setNewPath(p); setShowPicker(false); }} 
            />
          ) : resolving ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', minHeight: '200px' }}>
               <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid #f3f3f3', borderTop: '3px solid #1890ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
               <div style={{ color: '#666' }}>正在解析种子信息...</div>
               <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : magnetInfo ? (
            <>
               <div style={{ height: '300px', overflow: 'auto', border: '1px solid #eee', borderRadius: '4px', marginBottom: '16px' }}>
                  {magnetInfo.files.map(file => (
                      <div key={file.index} style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                              type="checkbox" 
                              checked={selectedFiles.includes(file.index)}
                              onChange={e => {
                                  if (e.target.checked) {
                                      setSelectedFiles([...selectedFiles, file.index])
                                  } else {
                                      setSelectedFiles(selectedFiles.filter(i => i !== file.index))
                                  }
                              }}
                              style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }} title={file.name}>{file.name}</div>
                          <div style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap' }}>{formatBytes(file.size)}</div>
                      </div>
                  ))}
              </div>
              <div style={{ padding: '8px 12px', background: '#f9f9f9', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                  <span>已选 {selectedFiles.length} 个文件</span>
                  <span>总大小: {formatBytes(magnetInfo.files.filter(f => selectedFiles.includes(f.index)).reduce((acc, cur) => acc + cur.size, 0))}</span>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666', fontWeight: 500 }}>存储位置</div>
                <div 
                  onClick={() => setShowPicker(true)}
                  style={{ 
                    width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', 
                    cursor: 'pointer', background: '#fafafa', color: '#666', display: 'flex', alignItems: 'center', 
                    boxSizing: 'border-box', transition: 'all 0.2s'
                  }}
                >
                  <Icon path={mdiFolder} size={0.8} color="#888" style={{ marginRight: '8px' }} />
                  <span style={{ color: '#333', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                    {formatPathDisplay(newPath)}
                  </span>
                </div>
              </div>

              {error && <div style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666', fontWeight: 500 }}>下载链接</div>
                <textarea 
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="请输入 http、https、ftp、ftps、磁力链接等"
                  rows={8}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #d9d9d9', 
                    userSelect: 'text', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    fontSize: '14px', lineHeight: '1.5'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666', fontWeight: 500 }}>存储位置</div>
                <div 
                  onClick={() => setShowPicker(true)}
                  style={{ 
                    width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', 
                    cursor: 'pointer', background: '#fafafa', color: '#666', display: 'flex', alignItems: 'center', 
                    boxSizing: 'border-box', transition: 'all 0.2s'
                  }}
                >
                  <Icon path={mdiFolder} size={0.8} color="#888" style={{ marginRight: '8px' }} />
                  <span style={{ color: '#333', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                    {formatPathDisplay(newPath)}
                  </span>
                </div>
              </div>
              {error && <div style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
            </>
          )}
        </Modal>      </div>
    </div>
  )
}
