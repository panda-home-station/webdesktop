import { truenasApi } from '@truenas/api'

export interface UserGroup {
  id: number
  bsdgrp_gid: number
  bsdgrp_group: string
  bsdgrp_builtin: boolean
  bsdgrp_sudo: boolean
  bsdgrp_sudo_nopasswd: boolean
  bsdgrp_smb: boolean
}

export interface User {
  id: number
  uid: number
  username: string
  unixhash: string
  smbhash: string
  home: string
  shell: string
  full_name: string
  builtin: boolean
  immutable: boolean
  smb: boolean
  webshare: boolean
  ssh_password_enabled: boolean
  password_disabled: boolean
  locked: boolean
  sudo_commands_nopasswd: string[]
  sudo_commands: string[]
  email: string | null
  group: UserGroup
  groups: number[]
  sshpubkey: string | null
  twofactor_auth_configured: boolean
  local: boolean
  id_type_both: boolean
  roles: string[]
  api_keys: number[]
  userns_idmap: number | null | 'DIRECT'
  password_history: unknown[] | null
  password_change_required: boolean
  password_age: number | null
  last_password_change: { $date: number } | null
}

export interface UserUpdate {
  uid?: number
  username?: string
  group?: number
  home?: string
  home_mode?: string
  shell?: string
  full_name?: string
  email?: string
  password?: string
  random_password?: boolean | null
  password_disabled?: boolean
  locked?: boolean
  smb?: boolean
  webshare?: boolean
  ssh_password_enabled?: boolean
  sudo_commands_nopasswd?: string[]
  sudo_commands?: string[]
  sshpubkey?: string
  groups?: number[]
  group_create?: boolean
  home_create?: boolean
  userns_idmap?: number | null | 'DIRECT'
}

export interface DeleteUserParams {
  delete_group?: boolean
}

export const userService = {
  async query(): Promise<User[]> {
    return truenasApi.call('user.query') as Promise<User[]>
  },

  async create(user: UserUpdate): Promise<User> {
    return truenasApi.call('user.create', [user]) as Promise<User>
  },

  async update(id: number, user: Partial<UserUpdate>): Promise<User> {
    return truenasApi.call('user.update', [id, user]) as Promise<User>
  },

  async delete(id: number, params: DeleteUserParams = {}): Promise<number> {
    return truenasApi.call('user.delete', [id, params]) as Promise<number>
  },

  async getShellChoices(): Promise<Record<string, string>> {
    return truenasApi.call('user.shell_choices') as Promise<Record<string, string>>
  },

  subscribe(callback: (data: unknown) => void): () => void {
    return truenasApi.subscribe('user.query', callback)
  },
}

export default userService
