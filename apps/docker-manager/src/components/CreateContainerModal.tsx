import React, { useState } from 'react'
import { Image } from '../types'
import { iOSButtonStyle, fmtImageName } from '../utils'
import { Modal } from '../../../../src/components/Modal'
import { PathSelector } from './PathSelector'
import Icon from '@mdi/react'
import { mdiFolder, mdiPlus, mdiTrashCan, mdiAlertCircleOutline } from '@mdi/js'

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
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8
}

const cardStyle = {
  background: '#f9f9f9',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12
}

const itemRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #f2f2f7',
  fontSize: 14
}

export function CreateContainerModal(props: CreateContainerModalProps) {
  const [pathSelectorOpen, setPathSelectorOpen] = useState(false)

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={sectionTitleStyle}>基本信息</label>
            <div style={cardStyle}>
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>镜像</div>
                <div style={{ padding: '8px 12px', background: '#e5e5ea', borderRadius: 6, color: '#333', fontSize: 14, fontFamily: 'monospace' }}>
                  {(props.image.repo_tags && props.image.repo_tags[0]) ? fmtImageName(props.image.repo_tags[0]) : props.image.id.slice(0, 12)}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>容器名称</div>
                <input 
                  style={inputStyle}
                  value={props.containerName}
                  onChange={e => props.setContainerName(e.target.value)}
                  placeholder="留空自动生成"
                />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>CPU (核): {props.cpuLimit}</div>
                    <input type="range" min="0.5" max="16" step="0.5" value={props.cpuLimit} onChange={e => props.setCpuLimit(Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>内存 (GB): {props.memoryLimit}</div>
                    <input type="range" min="0.5" max="32" step="0.5" value={props.memoryLimit} onChange={e => props.setMemoryLimit(Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e5e5ea', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>GPU 加速</div>
                <select
                  style={inputStyle}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={sectionTitleStyle}>端口映射</label>
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>主机端口</div>
                  <input style={inputStyle} placeholder="例如: 8080" value={props.newHostPort} onChange={e => props.setNewHostPort(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>容器端口</div>
                   <input 
                      style={inputStyle} 
                      placeholder="例如: 80" 
                      value={props.newContainerPort} 
                      onChange={e => props.setNewContainerPort(e.target.value)}
                      list="exposed-ports"
                   />
                   <datalist id="exposed-ports">
                     {exposedPorts.map(p => <option key={p} value={p} />)}
                   </datalist>
                </div>
                <button onClick={props.onAddPort} style={{ ...iOSButtonStyle('primary'), height: 36 }}>
                  <Icon path={mdiPlus} size={0.8} /> 添加
                </button>
              </div>

              {props.ports.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {props.ports.map((p, i) => (
                    <div key={i} style={itemRowStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#007aff', fontWeight: 600 }}>{p.host}</span>
                        <span style={{ color: '#8e8e93' }}>➜</span>
                        <span>{p.container}</span>
                      </div>
                      <button onClick={() => props.onRemovePort(i)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <Icon path={mdiTrashCan} size={0.8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
             <label style={sectionTitleStyle}>存储卷</label>
             <div style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                   <div>
                     <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>主机路径</div>
                     <div style={{ display: 'flex', gap: 8 }}>
                       <input style={inputStyle} placeholder="/选择主机路径" value={props.newHostPath} onChange={e => props.setNewHostPath(e.target.value)} />
                       <button onClick={() => setPathSelectorOpen(true)} style={{ height: 36, width: 36, background: '#f2f2f7', border: '1px solid #e5e5ea', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                         <Icon path={mdiFolder} size={0.8} color="#007aff" />
                       </button>
                     </div>
                   </div>
                   <div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>容器路径</div>
                      <input style={inputStyle} placeholder="/data" value={props.newContainerPath} onChange={e => props.setNewContainerPath(e.target.value)} />
                   </div>
                   <button onClick={props.onAddVolume} style={{ ...iOSButtonStyle('primary'), height: 36 }}>
                      <Icon path={mdiPlus} size={0.8} /> 添加
                   </button>
                </div>
                
                {props.volumes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {props.volumes.map((v, i) => (
                      <div key={i} style={itemRowStyle}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                               <Icon path={mdiFolder} size={0.7} color="#8e8e93" />
                               <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={v.host}>{v.host}</span>
                            </div>
                            <span style={{ color: '#8e8e93' }}>➜</span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={v.container}>{v.container}</span>
                         </div>
                         <button onClick={() => props.onRemoveVolume(i)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <Icon path={mdiTrashCan} size={0.8} />
                         </button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
          
          <div>
            <label style={sectionTitleStyle}>环境变量</label>
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>变量名 (Key)</div>
                  <input style={inputStyle} placeholder="KEY" value={props.newEnvKey} onChange={e => props.setNewEnvKey(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>变量值 (Value)</div>
                  <input style={inputStyle} placeholder="VALUE" value={props.newEnvValue} onChange={e => props.setNewEnvValue(e.target.value)} />
                </div>
                <button onClick={props.onAddEnvVar} style={{ ...iOSButtonStyle('primary'), height: 36 }}>
                  <Icon path={mdiPlus} size={0.8} /> 添加
                </button>
              </div>

              {props.envVars.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {props.envVars.map((v, i) => (
                    <div key={i} style={itemRowStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{v.key}</span>
                        <span style={{ color: '#8e8e93' }}>=</span>
                        <span style={{ wordBreak: 'break-all' }}>{v.value}</span>
                      </div>
                      <button onClick={() => props.onRemoveEnvVar(i)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <Icon path={mdiTrashCan} size={0.8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {props.step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', paddingTop: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
             <Icon path={mdiAlertCircleOutline} size={1.5} color="#007aff" />
          </div>
          
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1c1f23' }}>确认创建容器?</div>
          <div style={{ color: '#8f959e', textAlign: 'center', maxWidth: 400, lineHeight: 1.5 }}>
            容器创建后将自动启动。请确保端口未被占用，且挂载路径权限正确。
          </div>

          <div style={{ width: '100%', maxWidth: 500, background: '#f9f9f9', borderRadius: 8, padding: 24, marginTop: 16, border: '1px solid #e1e3e5' }}>
             <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, fontSize: 14 }}>
               <div style={{ color: '#8f959e' }}>容器名称</div>
               <div style={{ fontWeight: 500 }}>{props.containerName || '未命名'}</div>
               
               <div style={{ color: '#8f959e' }}>镜像</div>
               <div style={{ fontFamily: 'monospace' }}>{(props.image.repo_tags && props.image.repo_tags[0]) || props.image.id.slice(0, 12)}</div>
               
               <div style={{ color: '#8f959e' }}>端口映射</div>
               <div>{props.ports.length} 个</div>
               
               <div style={{ color: '#8f959e' }}>存储卷</div>
               <div>{props.volumes.length} 个</div>

               <div style={{ color: '#8f959e' }}>资源限制</div>
               <div>{props.enableResourceLimit ? `${props.cpuLimit}核 / ${props.memoryLimit}GB` : '未启用'}</div>
             </div>
          </div>
        </div>
      )}

      <PathSelector 
        open={pathSelectorOpen} 
        onClose={() => setPathSelectorOpen(false)}
        onSelect={(path) => {
          props.setNewHostPath(path)
          setPathSelectorOpen(false)
        }}
      />
    </Modal>
  )
}
