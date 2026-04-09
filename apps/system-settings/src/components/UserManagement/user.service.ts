import { truenasApi } from '@truenas/api'
import type { User, UserUpdate, DeleteUserParams } from '@truenas/types/user-types'

export type { User, UserUpdate, DeleteUserParams }

export const userService = {
  async query(params?: { local?: boolean; builtin?: boolean }): Promise<User[]> {
    const filterConditions: unknown[] = []

    // Default: show local users only (local=true, builtin=false)
    const localOnly = params?.local !== false

    if (localOnly) {
      filterConditions.push(['local', '=', true])
      // When showing local users, exclude builtin users by default
      // (TrueNAS has many builtin users that are not actual local users)
      if (params?.builtin !== false && params?.builtin !== true) {
        filterConditions.push(['builtin', '=', false])
      }
    }
    if (params?.builtin === false) {
      filterConditions.push(['builtin', '=', false])
    }
    if (params?.builtin === true) {
      filterConditions.push(['builtin', '=', true])
    }

    return truenasApi.call('user.query', filterConditions, {}) as Promise<User[]>
  },

  async create(user: UserUpdate): Promise<User> {
    return truenasApi.call('user.create', user) as Promise<User>
  },

  async update(id: number, user: Partial<UserUpdate>): Promise<User> {
    return truenasApi.call('user.update', id, user) as Promise<User>
  },

  async delete(id: number, params: DeleteUserParams = {}): Promise<number> {
    return truenasApi.call('user.delete', id, params) as Promise<number>
  },

  async getShellChoices(): Promise<Record<string, string>> {
    return truenasApi.call('user.shell_choices') as Promise<Record<string, string>>
  },

  subscribe(callback: (data: unknown) => void): () => void {
    return truenasApi.subscribe('user.query', callback)
  },
}

export default userService
