import { truenasApi } from '@truenas/api'

export interface Group {
  id: number
  gid: number
  name: string
  builtin: boolean
  immutable: boolean
  smb: boolean
  sudo_commands_nopasswd: string[]
  sudo_commands: string[]
  local: boolean
  id_type_both: boolean
  roles: string[]
  users: number[]
  sid: string | null
}

export interface GroupUpdate {
  gid?: number
  name?: string
  smb?: boolean
  sudo_commands_nopasswd?: string[]
  sudo_commands?: string[]
  roles?: string[]
  users?: number[]
}

export const groupService = {
  async query(): Promise<Group[]> {
    return truenasApi.call('group.query') as Promise<Group[]>
  },

  async create(group: GroupUpdate): Promise<number> {
    return truenasApi.call('group.create', [group]) as Promise<number>
  },

  async update(id: number, group: Partial<GroupUpdate>): Promise<number> {
    return truenasApi.call('group.update', [id, group]) as Promise<number>
  },

  async delete(id: number): Promise<number> {
    return truenasApi.call('group.delete', [id]) as Promise<number>
  },

  async getNextGid(): Promise<number> {
    return truenasApi.call('group.get_next_gid') as Promise<number>
  },

  subscribe(callback: (data: unknown) => void): () => void {
    return truenasApi.subscribe('group.query', callback)
  },
}

export default groupService
