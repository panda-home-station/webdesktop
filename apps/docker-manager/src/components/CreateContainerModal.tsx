import React, { useState, useEffect } from 'react'
import { Image } from '../types'
import { iOSButtonStyle, fmtImageName } from '../utils'
import { Modal } from '../../../../src/components/Modal'
import { PathSelector } from './PathSelector'
import { podmanApi } from '../api'
import Icon from '@mdi/react'
import { 
  mdiInformationOutline,
  mdiHammerWrench,
  mdiFolderOutline,
  mdiPlus, 
  mdiTrashCanOutline, 
  mdiAlertCircleOutline,
  mdiServerNetwork,
  mdiHarddisk,
  mdiFormatListBulleted,
  mdiShieldAccount,
  mdiIpNetwork,
  mdiConsoleLine
} from '@mdi/js'

interface CreateContainerModalProps {
  open: boolean
  onClose: () => void
  image: Image | null
  step: number
  setStep: (s: number) => void
  containerName: string
  setContainerName: (s: string) => void
  enableResourceLimit: boolean
  setEnableResourceLimit: (b: boolean) => void
  cpuLimit: number
  setCpuLimit: (n: number) => void
  memoryLimit: number
  setMemoryLimit: (n: number) => void
  autoStart: boolean
  setAutoStart: (b: boolean) => void
  ports: { host: string, container: string }[]
  setPorts: (p: any[]) => void
  newHostPort: string
  setNewHostPort: (s: string) => void
  newContainerPort: string
  setNewContainerPort: (s: string) => void
  onAddPort: () => void
  onRemovePort: (i: number) => void
  volumes: { host: string, container: string }[]
  setVolumes: (v: any[]) => void
  newHostPath: string
  setNewHostPath: (s: string) => void
  newContainerPath: string
  setNewContainerPath: (s: string) => void
  onAddVolume: () => void
  onRemoveVolume: (i: number) => void
  envVars: { key: string, value: string }[]
  setEnvVars: (v: any[]) => void
  newEnvKey: string
  setNewEnvKey: (s: string) => void
  newEnvValue: string
  setNewEnvValue: (s: string) => void
  onAddEnvVar: () => void
  onRemoveEnvVar: (i: number) => void
  gpuList: { id: string, name: string }[]
  selectedGpu: string
  setSelectedGpu: (s: string) => void
  privileged: boolean
  setPrivileged: (b: boolean) => void
  capAdd: string[]
  setCapAdd: (c: string[]) => void
  networkMode: string
  setNetworkMode: (s: string) => void
  cmd: string
  setCmd: (s: string) => void
  onCreate: () => void
}

const inputStyle = {
  background: '#fff',
  border: '1px solid #e5e5ea',
  borderRadius: 6,
  padding: '0 12px',
  height: 36,
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s'
}

const sectionTitleStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: '#1c1c1e',
  marginBottom: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 8
}

const cardStyle = {
  background: '#f9f9f9',
  borderRadius: 12,
  padding: 10,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 10
}

const listWrapperStyle = {
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #e5e5ea',
  overflow: 'hidden'
}

const itemRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  background: '#fff',
  fontSize: 14
}

export function CreateContainerModal(props: CreateContainerModalProps) {
  const [pathSelectorOpen, setPathSelectorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('ports')
  const [editingVolumeIndex, setEditingVolumeIndex] = useState<number | null>(null)
  const [portStatus, setPortStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (props.step === 3 && props.ports.length > 0) {
      const hostPorts = props.ports.map(p => parseInt(p.host)).filter(p => !isNaN(p))
      if (hostPorts.length > 0) {
        podmanApi.checkPorts(hostPorts).then(results => {
          const status: Record<string, boolean> = {}
          results.forEach(r => {
            status[r.port.toString()] = r.in_use
          })
          setPortStatus(status)
        }).catch(err => {
          console.error('Failed to check ports:', err)
        })
      }
    }
  }, [props.step, props.ports])

  if (!props.image) return null

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
       {props.step > 1 ? (
         <button onClick={() => props.setStep(props.step - 1)} style={iOSButtonStyle('default')}>上一步</button>
       ) : <div />}
       
       <div style={{ display: 'flex', gap: 12 }}>
         <button onClick={props.onClose} style={{ ...iOSButtonStyle('default'), background: 'transparent' }}>取消</button>
         {props.step < 3 ? (
           <button onClick={() => props.setStep(props.step + 1)} style={iOSButtonStyle('primary')}>下一步</button>
         ) : (
           <button onClick={props.onCreate} style={iOSButtonStyle('primary')}>创建容器</button>
         )}
       </div>
    </div>
  )

  const exposedPorts = props.image.exposed_ports || []

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title="创建容器"
      headerExtra={<div style={{ fontSize: 14, color: '#8e8e93' }}>步骤 {props.step} / 3</div>}
      footer={footer}
      width={680}
    >
      {props.step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={sectionTitleStyle}>基本信息</label>
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>镜像</div>
                  <div style={{ padding: '0 12px', height: 36, display: 'flex', alignItems: 'center', background: '#e5e5ea', borderRadius: 6, color: '#333', fontSize: 14, fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {(props.image.repo_tags && props.image.repo_tags[0]) ? fmtImageName(props.image.repo_tags[0]) : props.image.id.slice(0, 12)}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>容器名称</div>
                  <input 
                    style={inputStyle}
                    value={props.containerName}
                    onChange={e => props.setContainerName(e.target.value)}
                    placeholder="留空自动生成"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label style={sectionTitleStyle}>硬件资源</label>
            <div style={cardStyle}>
               <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={props.enableResourceLimit} onChange={e => props.setEnableResourceLimit(e.target.checked)} />
                启用 CPU / 内存限制
              </label>
              
              {props.enableResourceLimit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 13, color: '#666', width: 100 }}>CPU: {props.cpuLimit} 核</div>
                    <input type="range" min="0.5" max="16" step="0.5" value={props.cpuLimit} onChange={e => props.setCpuLimit(Number(e.target.value))} style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 13, color: '#666', width: 100 }}>内存: {props.memoryLimit} GB</div>
                    <input type="range" min="0.5" max="32" step="0.5" value={props.memoryLimit} onChange={e => props.setMemoryLimit(Number(e.target.value))} style={{ flex: 1 }} />
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e5e5ea', paddingTop: 6, marginTop: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, color: '#666', width: 100 }}>GPU 加速</div>
                <select
                  style={{ ...inputStyle, width: 'auto', flex: 1 }}
                  value={props.selectedGpu}
                  onChange={e => props.setSelectedGpu(e.target.value)}
                >
                  <option value="">不使用 GPU</option>
                  {props.gpuList.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, marginLeft: 4 }}>
            <input type="checkbox" checked={props.autoStart} onChange={e => props.setAutoStart(e.target.checked)} />
            开机自启动
          </label>
        </div>
      )}

      {props.step === 2 && (
        <div style={{ display: 'flex', height: 420, gap: 20 }}>
          {/* Sidebar */}
          <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 4, borderRight: '1px solid #e5e5ea', paddingRight: 10 }}>
            {[
              { id: 'ports', label: '端口设置', icon: mdiServerNetwork },
              { id: 'volumes', label: '存储位置', icon: mdiHarddisk },
              { id: 'env', label: '环境变量', icon: mdiFormatListBulleted },
              { id: 'perms', label: '权限设置', icon: mdiShieldAccount },
              { id: 'network', label: '网络配置', icon: mdiIpNetwork },
              { id: 'cmd', label: '启动命令', icon: mdiConsoleLine },
            ].map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? '#e5e5ea' : 'transparent',
                  color: activeTab === tab.id ? '#000' : '#666',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 500 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Icon path={tab.icon} size={0.8} />
                {tab.label}
              </div>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {activeTab === 'ports' && (
              <div>
                <label style={sectionTitleStyle}>端口映射</label>
                <div style={{ ...cardStyle, padding: '6px 10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid transparent' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#666' }}>主机端口</div>
                          <div style={{ fontSize: 12, color: '#666' }}>容器端口</div>
                       </div>
                       <button style={{ visibility: 'hidden', padding: 4, border: 'none', background: 'none' }}>
                          <Icon path={mdiTrashCanOutline} size={0.8} />
                       </button>
                    </div>

                    <div style={{ ...listWrapperStyle, display: props.ports.length > 0 ? 'flex' : 'none', flexDirection: 'column' }}>
                      {props.ports.map((p, i) => (
                        <div key={i} style={{ ...itemRowStyle, borderBottom: i === props.ports.length - 1 ? 'none' : '1px solid #f2f2f7' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, alignItems: 'center' }}>
                             <input 
                                style={{ ...inputStyle, height: 32 }} 
                                placeholder="Host" 
                                value={p.host} 
                                onChange={e => {
                                  const newPorts = [...props.ports]
                                  newPorts[i].host = e.target.value
                                  props.setPorts(newPorts)
                                }}
                              />
                              <div style={{ position: 'relative' }}>
                                 <input 
                                    style={{ ...inputStyle, height: 32 }} 
                                    placeholder="Container" 
                                    value={p.container} 
                                    onChange={e => {
                                      const newPorts = [...props.ports]
                                      newPorts[i].container = e.target.value
                                      // Auto-fill host port if empty
                                      if (!newPorts[i].host && e.target.value) {
                                          newPorts[i].host = e.target.value
                                      }
                                      props.setPorts(newPorts)
                                    }}
                                    list={`exposed-ports-${i}`}
                                 />
                                 <datalist id={`exposed-ports-${i}`}>
                                   {exposedPorts.map(ep => <option key={ep} value={ep} />)}
                                 </datalist>
                              </div>
                          </div>
                          <button onClick={() => props.onRemovePort(i)} style={{ color: '#8e8e93', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <Icon path={mdiTrashCanOutline} size={0.8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={props.onAddPort} 
                    style={{ 
                        width: '100%', 
                        height: 36, 
                        marginTop: 12, 
                        border: '1px dashed #c7c7cc', 
                        borderRadius: 8, 
                        background: 'none', 
                        color: '#007aff', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                    }}
                  >
                    <Icon path={mdiPlus} size={0.8} /> 添加端口映射
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'volumes' && (
              <div>
                 <label style={sectionTitleStyle}>存储卷</label>
                 <div style={{ ...cardStyle, padding: '6px 10px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid transparent' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#666' }}>主机路径</div>
                          <div style={{ fontSize: 12, color: '#666' }}>容器路径</div>
                       </div>
                       <button style={{ visibility: 'hidden', padding: 4, border: 'none', background: 'none' }}>
                          <Icon path={mdiTrashCanOutline} size={0.8} />
                       </button>
                    </div>

                    {props.volumes.length > 0 && (
                      <div style={{ ...listWrapperStyle, display: 'flex', flexDirection: 'column' }}>
                        {props.volumes.map((v, i) => (
                          <div key={i} style={{ ...itemRowStyle, borderBottom: i === props.volumes.length - 1 ? 'none' : '1px solid #f2f2f7' }}>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                   <input 
                                     style={{ ...inputStyle, height: 32, padding: '0 32px 0 8px', minWidth: 0 }} 
                                     placeholder="Host Path" 
                                     value={v.host} 
                                     onChange={e => {
                                        const newVols = [...props.volumes]
                                        newVols[i].host = e.target.value
                                        props.setVolumes(newVols)
                                     }}
                                   />
                                   <button onClick={() => {
                                      setEditingVolumeIndex(i)
                                      setPathSelectorOpen(true)
                                   }} style={{ position: 'absolute', right: 0, top: 0, height: 32, width: 32, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                                     <Icon path={mdiFolderOutline} size={0.7} color="#8e8e93" />
                                   </button>
                                </div>
                                <input 
                                   style={{ ...inputStyle, height: 32, padding: '0 8px' }} 
                                   placeholder="Container Path" 
                                   value={v.container} 
                                   onChange={e => {
                                      const newVols = [...props.volumes]
                                      newVols[i].container = e.target.value
                                      props.setVolumes(newVols)
                                   }}
                                />
                             </div>
                             <button onClick={() => props.onRemoveVolume(i)} style={{ color: '#8e8e93', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <Icon path={mdiTrashCanOutline} size={0.8} />
                             </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                    <button 
                      onClick={props.onAddVolume} 
                      style={{ 
                          width: '100%', 
                          height: 36, 
                          marginTop: 12, 
                          border: '1px dashed #c7c7cc', 
                          borderRadius: 8, 
                          background: 'none', 
                          color: '#007aff', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                      }}
                    >
                      <Icon path={mdiPlus} size={0.8} /> 添加存储卷
                    </button>
                 </div>
              </div>
            )}
            
            {activeTab === 'env' && (
              <div>
                <label style={sectionTitleStyle}>环境变量</label>
                <div style={{ ...cardStyle, padding: '6px 10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid transparent' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#666' }}>变量名</div>
                          <div style={{ fontSize: 12, color: '#666' }}>变量值</div>
                       </div>
                       <button style={{ visibility: 'hidden', padding: 4, border: 'none', background: 'none' }}>
                          <Icon path={mdiTrashCanOutline} size={0.8} />
                       </button>
                    </div>

                    <div style={{ ...listWrapperStyle, display: props.envVars.length > 0 ? 'flex' : 'none', flexDirection: 'column' }}>
                      {props.envVars.map((v, i) => (
                        <div key={i} style={{ ...itemRowStyle, borderBottom: i === props.envVars.length - 1 ? 'none' : '1px solid #f2f2f7' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, alignItems: 'center' }}>
                              <input 
                                  style={{ ...inputStyle, height: 32, padding: '0 8px', flex: 1, minWidth: 0 }} 
                                  placeholder="Key"
                                  value={v.key} 
                                  onChange={e => {
                                    const newEnv = [...props.envVars]
                                    newEnv[i].key = e.target.value
                                    props.setEnvVars(newEnv)
                                  }}
                              />
                              <input 
                                  style={{ ...inputStyle, height: 32, padding: '0 8px', flex: 1, minWidth: 0 }} 
                                  placeholder="Value"
                                  value={v.value} 
                                  onChange={e => {
                                    const newEnv = [...props.envVars]
                                    newEnv[i].value = e.target.value
                                    props.setEnvVars(newEnv)
                                  }}
                              />
                          </div>
                          <button onClick={() => props.onRemoveEnvVar(i)} style={{ color: '#8e8e93', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <Icon path={mdiTrashCanOutline} size={0.8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={props.onAddEnvVar} 
                    style={{ 
                        width: '100%', 
                        height: 36, 
                        marginTop: 12, 
                        border: '1px dashed #c7c7cc', 
                        borderRadius: 8, 
                        background: 'none', 
                        color: '#007aff', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                    }}
                  >
                    <Icon path={mdiPlus} size={0.8} /> 添加环境变量
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'perms' && (
               <div>
                  <label style={sectionTitleStyle}>高级权限设置</label>
                  <div style={cardStyle}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                      <input type="checkbox" checked={props.privileged} onChange={e => props.setPrivileged(e.target.checked)} />
                      特权模式 (Privileged)
                      <div style={{ fontSize: 12, color: '#8e8e93', marginLeft: 4 }}>(慎用)</div>
                    </label>
                    <div style={{ fontSize: 12, color: '#666', marginTop: -4, marginLeft: 24 }}>
                      授予容器所有 capabilities，并解除设备访问限制。
                    </div>
                  </div>
               </div>
            )}

            {activeTab === 'network' && (
              <div>
                 <label style={sectionTitleStyle}>网络配置</label>
                 <div style={cardStyle}>
                    <div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>网络模式</div>
                      <select style={inputStyle} value={props.networkMode} onChange={e => props.setNetworkMode(e.target.value)}>
                        <option value="bridge">Bridge (默认)</option>
                        <option value="host">Host (主机网络)</option>
                        <option value="none">None (无网络)</option>
                      </select>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'cmd' && (
               <div>
                  <label style={sectionTitleStyle}>启动命令</label>
                  <div style={cardStyle}>
                     <div>
                       <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>命令 (Command)</div>
                       <input 
                          style={inputStyle} 
                          placeholder="例如: /bin/sh -c 'echo hello'" 
                          value={props.cmd} 
                          onChange={e => props.setCmd(e.target.value)} 
                       />
                       <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 4 }}>
                         覆盖镜像默认的启动命令。
                       </div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {props.step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 420, overflowY: 'auto', paddingRight: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Icon path={mdiAlertCircleOutline} size={1} color="#007aff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1f23' }}>确认配置信息</div>
              <div style={{ fontSize: 13, color: '#8e8e93' }}>请在创建前核对以下设置</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Basic Info */}
            <div style={cardStyle}>
               <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                 <Icon path={mdiInformationOutline} size={0.6} /> 基本信息
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px', fontSize: 14 }}>
                  <div style={{ color: '#666' }}>容器名称</div>
                  <div style={{ fontWeight: 500 }}>{props.containerName || <span style={{ color: '#8e8e93', fontStyle: 'italic' }}>自动生成</span>}</div>
                  
                  <div style={{ color: '#666' }}>镜像</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{(props.image.repo_tags && props.image.repo_tags[0]) || props.image.id.slice(0, 12)}</div>

                  <div style={{ color: '#666' }}>开机自启</div>
                  <div>{props.autoStart ? '是' : '否'}</div>
               </div>
            </div>

            {/* Resources */}
            <div style={cardStyle}>
               <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                 <Icon path={mdiHammerWrench} size={0.6} /> 资源与权限
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px', fontSize: 14 }}>
                  <div style={{ color: '#666' }}>资源限制</div>
                  <div>{props.enableResourceLimit ? `${props.cpuLimit} 核 / ${props.memoryLimit} GB` : '无限制'}</div>
                  
                  <div style={{ color: '#666' }}>GPU 加速</div>
                  <div>{props.selectedGpu ? (props.gpuList.find(g => g.id === props.selectedGpu)?.name || props.selectedGpu) : '未启用'}</div>

                  <div style={{ color: '#666' }}>特权模式</div>
                  <div>{props.privileged ? '已开启' : '关闭'}</div>

                  {props.capAdd.length > 0 && (
                    <>
                      <div style={{ color: '#666' }}>额外能力</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {props.capAdd.map(c => (
                          <span key={c} style={{ fontSize: 11, background: '#f2f2f7', padding: '2px 6px', borderRadius: 4, color: '#666' }}>{c}</span>
                        ))}
                      </div>
                    </>
                  )}
               </div>
            </div>

            {/* Network */}
            <div style={cardStyle}>
               <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                 <Icon path={mdiIpNetwork} size={0.6} /> 网络与端口
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 12px', fontSize: 14 }}>
                  <div style={{ color: '#666' }}>网络模式</div>
                  <div style={{ textTransform: 'capitalize' }}>{props.networkMode}</div>
                  
                  <div style={{ color: '#666' }}>端口映射</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {props.ports.length === 0 ? <span style={{ color: '#8e8e93' }}>无</span> : props.ports.map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', background: '#eee', padding: '2px 6px', borderRadius: 4 }}>{p.host || '自动'}</span>
                        <span style={{ color: '#8e8e93' }}>→</span>
                        <span style={{ fontFamily: 'monospace' }}>{p.container}</span>
                        {p.host && portStatus[p.host] === true && (
                          <span style={{ color: '#ff3b30', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon path={mdiAlertCircleOutline} size={0.6} /> 端口已被占用
                          </span>
                        )}
                        {p.host && portStatus[p.host] === false && (
                          <span style={{ color: '#34c759', fontSize: 12 }}>● 可用</span>
                        )}
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Volumes */}
            {props.volumes.length > 0 && (
              <div style={cardStyle}>
                 <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                   <Icon path={mdiHarddisk} size={0.6} /> 存储卷
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    {props.volumes.map((v, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px', background: '#fff', borderRadius: 6, border: '1px solid #e5e5ea' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                           <span style={{ color: '#8e8e93', width: 40 }}>主机:</span>
                           <span style={{ wordBreak: 'break-all' }}>{v.host || <span style={{ fontStyle: 'italic', color: '#ccc' }}>未设置</span>}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                           <span style={{ color: '#8e8e93', width: 40 }}>容器:</span>
                           <span style={{ wordBreak: 'break-all' }}>{v.container}</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Env Vars */}
            {props.envVars.length > 0 && (
               <div style={cardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon path={mdiFormatListBulleted} size={0.6} /> 环境变量
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: 13 }}>
                     {props.envVars.map((e, i) => (
                       <div key={i} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                         <span style={{ color: '#8e8e93' }}>{e.key}=</span>
                         <span>{e.value}</span>
                       </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Command */}
            {props.cmd && (
               <div style={cardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon path={mdiConsoleLine} size={0.6} /> 启动命令
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e5ea' }}>
                    {props.cmd}
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      <PathSelector 
        open={pathSelectorOpen} 
        onClose={() => {
            setPathSelectorOpen(false)
            setEditingVolumeIndex(null)
        }}
        initialPath={editingVolumeIndex !== null ? props.volumes[editingVolumeIndex].host : undefined}
        onSelect={(path) => {
          if (editingVolumeIndex !== null) {
              const newVols = [...props.volumes]
              newVols[editingVolumeIndex].host = path
              props.setVolumes(newVols)
              setEditingVolumeIndex(null)
          } else {
              props.setNewHostPath(path)
          }
        }}
      />
    </Modal>
  )
}
