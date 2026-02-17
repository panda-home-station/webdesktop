import { instance as axios } from '../../../src/api/client'
import { Container, Image, Mirror, Network, Volume } from './types'

export const podmanApi = {
  async listContainers() {
    const r = await axios.get('/api/podman/containers')
    return r.data as Container[]
  },
  async listImages() {
    const r = await axios.get('/api/podman/images')
    return r.data as Image[]
  },
  async listVolumes() {
    try {
      const r = await axios.get('/api/podman/volumes')
      return r.data as Volume[]
    } catch (e) {
      console.warn('Failed to list volumes', e)
      return []
    }
  },
  async listNetworks() {
    try {
      const r = await axios.get('/api/podman/networks')
      return r.data as Network[]
    } catch (e) {
      console.warn('Failed to list networks', e)
      return []
    }
  },
  async listGpus() {
    try {
      const r = await axios.get('/api/podman/gpus')
      return r.data as { id: string, name: string }[]
    } catch (e) {
      console.warn('Failed to list gpus', e)
      return []
    }
  },
  async start(id: string) {
    await axios.post('/api/podman/container/start', { id })
  },
  async stop(id: string) {
    await axios.post('/api/podman/container/stop', { id })
  },
  async restart(id: string) {
    await axios.post('/api/podman/container/restart', { id })
  },
  async remove(id: string) {
    await axios.post('/api/podman/container/remove', { id })
  },
  async pull(image: string, tag?: string) {
    await axios.post('/api/podman/image/pull', { image, tag })
  },
  async removeImage(id: string) {
    await axios.post('/api/podman/image/remove', { id })
  },
  async createContainer(payload: any) {
    await axios.post('/api/podman/container/create', payload)
  },
  async createVolume(name: string, driver?: string, labels?: { [key: string]: string }) {
    await axios.post('/api/podman/volume/create', { name, driver, labels })
  },
  async removeVolume(name: string) {
    await axios.post('/api/podman/volume/remove', { name })
  },
  async mirrorsGet() {
    const r = await axios.get('/api/podman/mirrors')
    return (Array.isArray(r.data) ? r.data : []) as Mirror[]
  },
  async mirrorsSet(items: Mirror[]) {
    await axios.post('/api/podman/mirrors', items)
  },
  async registrySearch(q: string, page = 1, pageSize = 24) {
    const r = await axios.get('/api/podman/registry/search', { params: { q, page, page_size: pageSize } })
    const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
    return {
      items: Array.isArray(data.results) ? data.results : [],
      hasNext: !!data.next,
      hasPrev: !!data.prev
    }
  },
  async fsList(path: string) {
    const r = await axios.get('/api/docs/list', { params: { path, limit: 1000, offset: 0 } })
    return r.data as { path: string; entries: { name: string; is_dir: boolean }[] }
  },
  async registryHot(page = 1, pageSize = 24) {
    const r = await axios.get('/api/podman/registry/hot', { params: { page, page_size: pageSize } })
    const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
    return {
      items: Array.isArray(data.results) ? data.results : [],
      hasNext: !!data.next,
      hasPrev: !!data.prev
    }
  },
  async checkPorts(ports: number[]) {
    const r = await axios.post('/api/system/check_ports', { ports })
    return r.data.results as { port: number, in_use: boolean, error?: string }[]
  }
}
