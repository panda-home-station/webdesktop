import axios from 'axios'
import { Container, Image, Mirror, Network, Volume } from './types'

const getToken = () => localStorage.getItem('authToken') || ''

export const podmanApi = {
  async listContainers() {
    const token = getToken()
    const r = await axios.get('/api/podman/containers', { params: token ? { token } : {} })
    return r.data as Container[]
  },
  async listImages() {
    const token = getToken()
    const r = await axios.get('/api/podman/images', { params: token ? { token } : {} })
    return r.data as Image[]
  },
  async listVolumes() {
    const token = getToken()
    // Assuming endpoint exists
    try {
      const r = await axios.get('/api/podman/volumes', { params: token ? { token } : {} })
      return r.data as Volume[]
    } catch (e) {
      console.warn('Failed to list volumes', e)
      return []
    }
  },
  async listNetworks() {
    const token = getToken()
    // Assuming endpoint exists
    try {
      const r = await axios.get('/api/podman/networks', { params: token ? { token } : {} })
      return r.data as Network[]
    } catch (e) {
      console.warn('Failed to list networks', e)
      return []
    }
  },
  async listGpus() {
    const token = getToken()
    try {
      const r = await axios.get('/api/podman/gpus', { params: token ? { token } : {} })
      return r.data as { id: string, name: string }[]
    } catch (e) {
      console.warn('Failed to list gpus', e)
      return []
    }
  },
  async start(id: string) {
    const token = getToken()
    await axios.post('/api/podman/container/start', { id }, { params: token ? { token } : {} })
  },
  async stop(id: string) {
    const token = getToken()
    await axios.post('/api/podman/container/stop', { id }, { params: token ? { token } : {} })
  },
  async restart(id: string) {
    const token = getToken()
    await axios.post('/api/podman/container/restart', { id }, { params: token ? { token } : {} })
  },
  async remove(id: string) {
    const token = getToken()
    await axios.post('/api/podman/container/remove', { id }, { params: token ? { token } : {} })
  },
  async pull(image: string, tag?: string) {
    const token = getToken()
    await axios.post('/api/podman/image/pull', { image, tag }, { params: token ? { token } : {} })
  },
  async removeImage(id: string) {
    const token = getToken()
    await axios.post('/api/podman/image/remove', { id }, { params: token ? { token } : {} })
  },
  async createContainer(payload: any) {
    const token = getToken()
    await axios.post('/api/podman/container/create', payload, { params: token ? { token } : {} })
  },
  async mirrorsGet() {
    const token = getToken()
    const r = await axios.get('/api/podman/mirrors', { params: token ? { token } : {} })
    return (Array.isArray(r.data) ? r.data : []) as Mirror[]
  },
  async mirrorsSet(items: Mirror[]) {
    const token = getToken()
    await axios.post('/api/podman/mirrors', items, { params: token ? { token } : {} })
  },
  async registrySearch(q: string, page = 1, pageSize = 24) {
    const token = getToken()
    const r = await axios.get('/api/podman/registry/search', { params: { q, page, page_size: pageSize, ...(token ? { token } : {}) } })
    const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
    return {
      items: Array.isArray(data.results) ? data.results : [],
      hasNext: !!data.next,
      hasPrev: !!data.prev
    }
  },
  async registryHot(page = 1, pageSize = 24) {
    const token = getToken()
    const r = await axios.get('/api/podman/registry/hot', { params: { page, page_size: pageSize, ...(token ? { token } : {}) } })
    const data = r.data as { results: any[]; next?: boolean; prev?: boolean }
    return {
      items: Array.isArray(data.results) ? data.results : [],
      hasNext: !!data.next,
      hasPrev: !!data.prev
    }
  }
}
