import React, { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '../../../src/components/Sidebar'
import Icon from '@mdi/react'
import { mdiViewGridOutline, mdiCubeOutline, mdiTableColumn, mdiImageFilterNone, mdiDatabase, mdiHarddisk, mdiNetwork } from '@mdi/js'
import { podmanApi } from './api'
import { Container, Image, Volume, Network, Mirror } from './types'
import { Overview } from './components/Overview'
import { ContainerList } from './components/ContainerList'
import { ImageList } from './components/ImageList'
import { RegistryView } from './components/RegistryView'
import { VolumeList } from './components/VolumeList'
import { NetworkList } from './components/NetworkList'
import { CreateContainerModal } from './components/CreateContainerModal'
import { Modal } from '../../../src/components/Modal'
import { fmtImageName } from './utils'

const btnCancelStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: 'white',
  color: '#374151',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer'
}

const btnConfirmStyle = (danger?: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  background: danger ? '#ef4444' : '#2563eb',
  color: 'white',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer'
})

const TABS = [
  { id: 'overview', label: '概览', icon: <Icon path={mdiViewGridOutline} size="20px" /> },
  { id: 'containers', label: '容器', icon: <Icon path={mdiCubeOutline} size="20px" /> },
  { id: 'images', label: '镜像', icon: <Icon path={mdiImageFilterNone} size="20px" /> },
  { id: 'volumes', label: '存储卷', icon: <Icon path={mdiHarddisk} size="20px" /> },
  { id: 'networks', label: '网络', icon: <Icon path={mdiNetwork} size="20px" /> },
  { id: 'registry', label: '仓库', icon: <Icon path={mdiDatabase} size="20px" /> },
  { id: 'compose', label: '编排', icon: <Icon path={mdiTableColumn} size="20px" /> },
]

export default function DockerManager() {
  const [active, setActive] = useState('overview')
  const [containers, setContainers] = useState<Container[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [volumesList, setVolumesList] = useState<Volume[]>([])
  const [networksList, setNetworksList] = useState<Network[]>([])
  const [gpus, setGpus] = useState<{ id: string, name: string }[]>([])
  const [loading, setLoading] = useState(false)
  
  // Registry State
  const [registryQ, setRegistryQ] = useState('')
  const [registryItems, setRegistryItems] = useState<any[]>([])
  const [registryLoading, setRegistryLoading] = useState(false)
  const [hotItems, setHotItems] = useState<any[]>([])
  const [didSearch, setDidSearch] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mirrors, setMirrors] = useState<Mirror[]>([])
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Create Container State
  const [createContainerOpen, setCreateContainerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [createStep, setCreateStep] = useState(1)
  const [containerName, setContainerName] = useState('')
  const [enableResourceLimit, setEnableResourceLimit] = useState(false)
  const [cpuLimit, setCpuLimit] = useState(2)
  const [memoryLimit, setMemoryLimit] = useState(4)
  const [autoStart, setAutoStart] = useState(true)
  const [ports, setPorts] = useState<{ host: string, container: string }[]>([])
  const [newHostPort, setNewHostPort] = useState('')
  const [newContainerPort, setNewContainerPort] = useState('')
  const [volumes, setVolumes] = useState<{ host: string, container: string }[]>([])
  const [newHostPath, setNewHostPath] = useState('')
  const [newContainerPath, setNewContainerPath] = useState('')
  const [envVars, setEnvVars] = useState<{ key: string, value: string }[]>([])
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')
  const [selectedGpu, setSelectedGpu] = useState('')

  // Confirmation State
  const [confirmState, setConfirmState] = useState<{ type: 'start' | 'stop' | 'delete' | 'restart', id: string } | null>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cs, ims, vs, ns, gs] = await Promise.all([
        podmanApi.listContainers(),
        podmanApi.listImages(),
        podmanApi.listVolumes(),
        podmanApi.listNetworks(),
        podmanApi.listGpus()
      ])
      setContainers(cs)
      setImages(ims)
      setVolumesList(vs)
      setNetworksList(ns)
      setGpus(gs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll().catch(console.error)
  }, [])

  // Registry Logic
  const onSearchRegistry = async () => {
    const q = registryQ.trim()
    if (!q) {
      setDidSearch(false)
      setRegistryItems([])
      setPage(1)
      return
    }
    setDidSearch(true)
    setPage(1)
    setRegistryLoading(true)
    try {
      const { items, hasNext, hasPrev } = await podmanApi.registrySearch(q, 1)
      setRegistryItems(items)
      setHasNext(hasNext)
      setHasPrev(hasPrev)
    } finally {
      setRegistryLoading(false)
    }
  }

  useEffect(() => {
    if (active === 'registry') {
      setDidSearch(false)
      setPage(1)
      setRegistryLoading(true)
      podmanApi.registryHot(1)
        .then(({ items, hasNext, hasPrev }) => {
          setHotItems(items)
          setHasNext(hasNext)
          setHasPrev(hasPrev)
        })
        .finally(() => setRegistryLoading(false))
    }
  }, [active])

  const onPageChange = async (newPage: number) => {
    setRegistryLoading(true)
    try {
      if (didSearch) {
        const { items, hasNext, hasPrev } = await podmanApi.registrySearch(registryQ.trim(), newPage)
        setRegistryItems(items)
        setHasNext(hasNext)
        setHasPrev(hasPrev)
      } else {
        const { items, hasNext, hasPrev } = await podmanApi.registryHot(newPage)
        setHotItems(items)
        setHasNext(hasNext)
        setHasPrev(hasPrev)
      }
      setPage(newPage)
    } finally {
      setRegistryLoading(false)
    }
  }

  const pullFromRegistry = async (ref: string) => {
    if (!ref) return
    setPulling(true)
    try {
      await podmanApi.pull(ref)
      await loadAll()
      setActive('images')
    } finally {
      setPulling(false)
    }
  }

  // Create Container Logic
  const onOpenCreateContainer = (img: Image) => {
    setSelectedImage(img)
    const imageName = (img.repo_tags && img.repo_tags[0]) ? fmtImageName(img.repo_tags[0]) : img.id.slice(0, 12)
    setContainerName(imageName.split(':')[0])
    setEnableResourceLimit(false)
    setCpuLimit(2)
    setMemoryLimit(4)
    setAutoStart(true)
    setCreateContainerOpen(true)
    setCreateStep(1)
    setPorts([])
    setVolumes([])
    setEnvVars([])
    setSelectedGpu('')
  }

  const onCloseCreateContainer = () => {
    setCreateContainerOpen(false)
    setSelectedImage(null)
  }

  const onCreateContainer = async () => {
    if (!selectedImage) return
    const payload: any = {
      image_id: selectedImage.id,
      name: containerName || undefined,
      cpu_limit: enableResourceLimit ? cpuLimit : undefined,
      memory_limit: enableResourceLimit ? memoryLimit : undefined,
      auto_start: autoStart,
      ports: ports.length > 0 ? ports : undefined,
      volumes: volumes.length > 0 ? volumes.map(v => `${v.host}:${v.container}`) : undefined,
      env: envVars.length > 0 ? envVars.map(v => `${v.key}=${v.value}`) : undefined,
      gpu_id: selectedGpu || undefined,
    }
    try {
      await podmanApi.createContainer(payload)
      onCloseCreateContainer()
      await loadAll()
      setActive('containers')
    } catch (e: any) {
      console.error(e)
      const msg = e.response?.data || e.message || 'Unknown error'
      alert(`Failed to create container: ${typeof msg === 'object' ? JSON.stringify(msg) : msg}`)
    }
  }

  const performAction = async () => {
    if (!confirmState) return
    const { type, id } = confirmState
    try {
      if (type === 'delete') await podmanApi.remove(id)
      else if (type === 'start') await podmanApi.start(id)
      else if (type === 'stop') await podmanApi.stop(id)
      else if (type === 'restart') await podmanApi.restart(id)
      
      loadAll()
      setConfirmState(null)
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Unknown error'
      alert(`${type === 'delete' ? 'Remove' : type === 'start' ? 'Start' : type === 'stop' ? 'Stop' : 'Restart'} failed: ${msg}`)
      setConfirmState(null)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#1f2937', background: '#f2f2f7', position: 'relative' }} className="noselect">
      <Sidebar
        items={TABS}
        activeId={active}
        onSelect={setActive}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {active === 'overview' && (
            <Overview 
              containers={containers} 
              images={images} 
              volumes={volumesList} 
              networks={networksList} 
              loading={loading} 
            />
          )}
          {active === 'containers' && (
            <ContainerList
              containers={containers}
              onStart={(id) => setConfirmState({ type: 'start', id })}
              onStop={(id) => setConfirmState({ type: 'stop', id })}
              onRestart={(id) => setConfirmState({ type: 'restart', id })}
              onRemove={(id) => setConfirmState({ type: 'delete', id })}
            />
          )}
          {active === 'images' && (
            <ImageList
              images={images}
              onRun={onOpenCreateContainer}
              onDelete={async (img) => { if(confirm('确认删除镜像?')) { await podmanApi.removeImage(img.id); loadAll() } }}
            />
          )}
          {active === 'volumes' && <VolumeList volumes={volumesList} />}
          {active === 'networks' && <NetworkList networks={networksList} />}
          {active === 'registry' && (
            <RegistryView
              query={registryQ}
              setQuery={setRegistryQ}
              onSearch={onSearchRegistry}
              loading={registryLoading}
              items={registryItems}
              hotItems={hotItems}
              didSearch={didSearch}
              pulling={pulling}
              onPull={pullFromRegistry}
              page={page}
              hasNext={hasNext}
              hasPrev={hasPrev}
              onNextPage={() => onPageChange(page + 1)}
              onPrevPage={() => onPageChange(page - 1)}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
          {active === 'compose' && (
            <div style={{ padding: 40, textAlign: 'center', color: '#8e8e93' }}>
              <Icon path={mdiTableColumn} size={2} color="#d1d1d6" />
              <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>Compose 管理即将上线</div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!confirmState}
        title={confirmState?.type === 'delete' ? '删除容器' : confirmState?.type === 'start' ? '启动容器' : confirmState?.type === 'stop' ? '停止容器' : '重启容器'}
        onClose={() => setConfirmState(null)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setConfirmState(null)} style={btnCancelStyle}>取消</button>
            <button onClick={performAction} style={btnConfirmStyle(confirmState?.type === 'delete' || confirmState?.type === 'stop' || confirmState?.type === 'restart')}>
              {confirmState?.type === 'delete' ? '删除' : confirmState?.type === 'start' ? '启动' : confirmState?.type === 'stop' ? '停止' : '重启'}
            </button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
          {confirmState?.type === 'delete' && (
            <>
              确定要删除此容器吗？
              <br />
              <span style={{ fontSize: 13, color: '#6b7280' }}>此操作无法撤销。</span>
            </>
          )}
          {confirmState?.type === 'start' && '确定要启动此容器吗？'}
          {confirmState?.type === 'stop' && '确定要停止此容器吗？'}
          {confirmState?.type === 'restart' && '确定要重启此容器吗？'}
        </p>
      </Modal>

      <CreateContainerModal
        open={createContainerOpen}
        onClose={onCloseCreateContainer}
        image={selectedImage}
        step={createStep}
        setStep={setCreateStep}
        containerName={containerName}
        setContainerName={setContainerName}
        enableResourceLimit={enableResourceLimit}
        setEnableResourceLimit={setEnableResourceLimit}
        cpuLimit={cpuLimit}
        setCpuLimit={setCpuLimit}
        memoryLimit={memoryLimit}
        setMemoryLimit={setMemoryLimit}
        autoStart={autoStart}
        setAutoStart={setAutoStart}
        ports={ports}
        setPorts={setPorts}
        newHostPort={newHostPort}
        setNewHostPort={setNewHostPort}
        newContainerPort={newContainerPort}
        setNewContainerPort={setNewContainerPort}
        onAddPort={() => { if(newHostPort.trim() && newContainerPort.trim()) { setPorts([...ports, {host: newHostPort.trim(), container: newContainerPort.trim()}]); setNewHostPort(''); setNewContainerPort('') } }}
        onRemovePort={(i) => setPorts(ports.filter((_, idx) => idx !== i))}
        volumes={volumes}
        setVolumes={setVolumes}
        newHostPath={newHostPath}
        setNewHostPath={setNewHostPath}
        newContainerPath={newContainerPath}
        setNewContainerPath={setNewContainerPath}
        onAddVolume={() => { if(newHostPath.trim() && newContainerPath.trim()) { setVolumes([...volumes, {host: newHostPath.trim(), container: newContainerPath.trim()}]); setNewHostPath(''); setNewContainerPath('') } }}
        onRemoveVolume={(i) => setVolumes(volumes.filter((_, idx) => idx !== i))}
        envVars={envVars}
        setEnvVars={setEnvVars}
        newEnvKey={newEnvKey}
        setNewEnvKey={setNewEnvKey}
        newEnvValue={newEnvValue}
        setNewEnvValue={setNewEnvValue}
        onAddEnvVar={() => { if(newEnvKey.trim()) { setEnvVars([...envVars, {key: newEnvKey.trim(), value: newEnvValue.trim()}]); setNewEnvKey(''); setNewEnvValue('') } }}
        onRemoveEnvVar={(i) => setEnvVars(envVars.filter((_, idx) => idx !== i))}
        gpuList={gpus}
        selectedGpu={selectedGpu}
        setSelectedGpu={setSelectedGpu}
        onCreate={onCreateContainer}
      />
    </div>
  )
}
