import React from 'react'
import { Image } from '../types'
import { iOSButtonStyle, fmtImageName } from '../utils'
import { Modal } from '../../../../src/components/Modal'

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
  onCreate: () => void
}

const inputStyle = {
  background: '#f2f2f7',
  border: 'none',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#333',
  marginBottom: 8
}

export function CreateContainerModal(props: CreateContainerModalProps) {
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

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title="创建容器"
      headerExtra={<div style={{ fontSize: 14, color: '#8e8e93' }}>步骤 {props.step} / 3</div>}
      footer={footer}
      width={500}
    >
      {props.step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>镜像</label>
            <div style={{ padding: '8px 12px', background: '#f2f2f7', borderRadius: 8, color: '#8e8e93', fontSize: 14 }}>
              {(props.image.repo_tags && props.image.repo_tags[0]) ? fmtImageName(props.image.repo_tags[0]) : props.image.id.slice(0, 12)}
            </div>
          </div>
          
          <div>
            <label style={labelStyle}>容器名称</label>
            <input 
              style={inputStyle}
              value={props.containerName}
              onChange={e => props.setContainerName(e.target.value)}
              placeholder="可选"
            />
          </div>

          <div>
            <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
              <input type="checkbox" checked={props.enableResourceLimit} onChange={e => props.setEnableResourceLimit(e.target.checked)} />
              资源限制
            </label>
            {props.enableResourceLimit && (
              <div style={{ marginTop: 12, padding: 12, background: '#f9f9f9', borderRadius: 12, display: 'grid', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 4 }}>CPU (核): {props.cpuLimit}</div>
                  <input type="range" min="1" max="16" value={props.cpuLimit} onChange={e => props.setCpuLimit(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 4 }}>内存 (GB): {props.memoryLimit}</div>
                  <input type="range" min="1" max="32" value={props.memoryLimit} onChange={e => props.setMemoryLimit(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={props.autoStart} onChange={e => props.setAutoStart(e.target.checked)} />
            开机自启动
          </label>
        </div>
      )}

      {props.step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={labelStyle}>端口映射</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} placeholder="主机端口" value={props.newHostPort} onChange={e => props.setNewHostPort(e.target.value)} />
              <input style={inputStyle} placeholder="容器端口" value={props.newContainerPort} onChange={e => props.setNewContainerPort(e.target.value)} />
              <button onClick={props.onAddPort} style={iOSButtonStyle('default')}>添加</button>
            </div>
            {props.ports.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f9f9f9', borderRadius: 8, marginTop: 8 }}>
                <span style={{ fontSize: 14 }}>{p.host} → {p.container}</span>
                <button onClick={() => props.onRemovePort(i)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}>删除</button>
              </div>
            ))}
          </div>

          <div>
            <label style={labelStyle}>存储卷挂载</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} placeholder="主机路径" value={props.newHostPath} onChange={e => props.setNewHostPath(e.target.value)} />
              <input style={inputStyle} placeholder="容器路径" value={props.newContainerPath} onChange={e => props.setNewContainerPath(e.target.value)} />
              <button onClick={props.onAddVolume} style={iOSButtonStyle('default')}>添加</button>
            </div>
            {props.volumes.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f9f9f9', borderRadius: 8, marginTop: 8 }}>
                <span style={{ fontSize: 14, wordBreak: 'break-all' }}>{v.host} → {v.container}</span>
                <button onClick={() => props.onRemoveVolume(i)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}>删除</button>
              </div>
            ))}
          </div>

          <div>
            <label style={labelStyle}>环境变量</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} placeholder="KEY" value={props.newEnvKey} onChange={e => props.setNewEnvKey(e.target.value)} />
              <input style={inputStyle} placeholder="VALUE" value={props.newEnvValue} onChange={e => props.setNewEnvValue(e.target.value)} />
              <button onClick={props.onAddEnvVar} style={iOSButtonStyle('default')}>添加</button>
            </div>
            {props.envVars.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f9f9f9', borderRadius: 8, marginTop: 8 }}>
                <span style={{ fontSize: 14 }}>{v.key} = {v.value}</span>
                <button onClick={() => props.onRemoveEnvVar(i)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}>删除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {props.step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, color: '#8e8e93', textAlign: 'center', marginBottom: 12 }}>
            请确认以下配置
          </div>
          <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8e8e93', fontSize: 13 }}>容器名称</span>
              <span style={{ fontSize: 14 }}>{props.containerName || '未命名'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8e8e93', fontSize: 13 }}>端口映射</span>
              <span style={{ fontSize: 14 }}>{props.ports.length} 个</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8e8e93', fontSize: 13 }}>存储卷</span>
              <span style={{ fontSize: 14 }}>{props.volumes.length} 个</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8e8e93', fontSize: 13 }}>环境变量</span>
              <span style={{ fontSize: 14 }}>{props.envVars.length} 个</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
