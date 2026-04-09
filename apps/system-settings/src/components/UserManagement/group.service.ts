import { truenasApi } from '@truenas/api'
import type { Group, GroupUpdate } from '@truenas/types/group-types'

export type { Group, GroupUpdate }

interface GroupQueryParams {
  builtin?: boolean
}

export const groupService = {
  async query(params?: GroupQueryParams): Promise<Group[]> {
    const filterConditions: unknown[] = []

    // By default, exclude builtin groups (similar to webui behavior)
    if (params?.builtin !== false && params?.builtin !== true) {
      filterConditions.push(['builtin', '=', false])
    }
    if (params?.builtin === false) {
      filterConditions.push(['builtin', '=', false])
    }
    if (params?.builtin === true) {
      filterConditions.push(['builtin', '=', true])
    }

    return truenasApi.call('group.query', filterConditions, {}) as Promise<Group[]>
  },

  async create(group: GroupUpdate): Promise<number> {
    return truenasApi.call('group.create', group) as Promise<number>
  },

  async update(id: number, group: Partial<GroupUpdate>): Promise<number> {
    return truenasApi.call('group.update', id, group) as Promise<number>
  },

  async delete(id: number): Promise<number> {
    return truenasApi.call('group.delete', id) as Promise<number>
  },

  async getNextGid(): Promise<number> {
    return truenasApi.call('group.get_next_gid') as Promise<number>
  },

  subscribe(callback: (data: unknown) => void): () => void {
    return truenasApi.subscribe('group.query', callback)
  },
}

export default groupService
