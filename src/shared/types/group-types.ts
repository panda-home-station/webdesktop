/**
 * Group types - TrueNAS group types
 */

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
