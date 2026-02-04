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
import { fmtImageName } from './utils'

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

  const loadAll = async () => {
    setLoading(true)
    try {
      const [cs, ims, vs, ns] = await Promise.all([
        podmanApi.listContainers(),
        podmanApi.listImages(),
        podmanApi.listVolumes(),
        podmanApi.listNetworks()
      ])
      setContainers(cs)
      setImages(ims)
      setVolumesList(vs)
      setNetworksList(ns)
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
    }
    await podmanApi.createContainer(payload)
    onCloseCreateContainer()
    await loadAll()
    setActive('containers')
  }

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#1f2937', background: '#f2f2f7' }} className="noselect">
      <Sidebar
        width={220}
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
              onStart={async (id) => { await podmanApi.start(id); loadAll() }}
              onStop={async (id) => { await podmanApi.stop(id); loadAll() }}
              onRestart={async (id) => { await podmanApi.restart(id); loadAll() }}
              onRemove={async (id) => { if(confirm('确认删除?')) { await podmanApi.remove(id); loadAll() } }}
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
        onAddPort={() => { if(newHostPort && newContainerPort) { setPorts([...ports, {host: newHostPort, container: newContainerPort}]); setNewHostPort(''); setNewContainerPort('') } }}
        onRemovePort={(i) => setPorts(ports.filter((_, idx) => idx !== i))}
        volumes={volumes}
        setVolumes={setVolumes}
        newHostPath={newHostPath}
        setNewHostPath={setNewHostPath}
        newContainerPath={newContainerPath}
        setNewContainerPath={setNewContainerPath}
        onAddVolume={() => { if(newHostPath && newContainerPath) { setVolumes([...volumes, {host: newHostPath, container: newContainerPath}]); setNewHostPath(''); setNewContainerPath('') } }}
        onRemoveVolume={(i) => setVolumes(volumes.filter((_, idx) => idx !== i))}
        envVars={envVars}
        setEnvVars={setEnvVars}
        newEnvKey={newEnvKey}
        setNewEnvKey={setNewEnvKey}
        newEnvValue={newEnvValue}
        setNewEnvValue={setNewEnvValue}
        onAddEnvVar={() => { if(newEnvKey) { setEnvVars([...envVars, {key: newEnvKey, value: newEnvValue}]); setNewEnvKey(''); setNewEnvValue('') } }}
        onRemoveEnvVar={(i) => setEnvVars(envVars.filter((_, idx) => idx !== i))}
        onCreate={onCreateContainer}
      />
    </div>
  )
}
