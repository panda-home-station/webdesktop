/**
 * TrueNAS API Mock
 *
 * Mock implementation for testing TrueNAS API calls
 */

import { vi } from 'vitest'

export interface MockApiResponse<T = unknown> {
  data?: T
  error?: string
}

export interface TruenasApiMock {
  call: ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
  unsubscribe: ReturnType<typeof vi.fn>
  onConnectionStateChange: ReturnType<typeof vi.fn>
  getConnectionState: ReturnType<typeof vi.fn>
  connected: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

/**
 * Create a mock TrueNAS API
 */
export function createTruenasApiMock(): TruenasApiMock {
  return {
    call: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
    unsubscribe: vi.fn(),
    onConnectionStateChange: vi.fn().mockReturnValue(() => {}),
    getConnectionState: vi.fn().mockReturnValue('connected'),
    connected: vi.fn().mockReturnValue(true),
    disconnect: vi.fn(),
  }
}

/**
 * Default mock pool data
 */
export const mockPools = [
  {
    id: 1,
    name: 'pool1',
    status: 'ONLINE',
    topology: {
      data: [
        { type: 'RAIDZ1', children: [{ guid: 'disk1' }, { guid: 'disk2' }, { guid: 'disk3' }] },
      ],
    },
    size: 1000000000000,
    allocated: 500000000000,
  },
  {
    id: 2,
    name: 'pool2',
    status: 'ONLINE',
    topology: {
      data: [
        { type: 'MIRROR', children: [{ guid: 'disk4' }, { guid: 'disk5' }] },
      ],
    },
    size: 2000000000000,
    allocated: 800000000000,
  },
]

/**
 * Default mock alert data
 */
export const mockAlerts = [
  {
    id: 'alert-1',
    key: 'volume-status',
    level: 'CRITICAL' as const,
    klass: 'VolumeStatus' as const,
    dismissed: false,
    datetime: { $date: Date.now() },
    last_occurrence: { $date: Date.now() },
    formatted: 'Pool pool1 is degraded',
    text: 'Pool pool1 has a degraded configuration',
    source: 'volume-status',
    args: {},
    mail: '',
    node: 'primary',
    one_shot: false,
    uuid: 'uuid-1',
  },
  {
    id: 'alert-2',
    key: 'smart-warning',
    level: 'WARNING' as const,
    klass: 'SMART' as const,
    dismissed: false,
    datetime: { $date: Date.now() - 3600000 },
    last_occurrence: { $date: Date.now() - 3600000 },
    formatted: 'SMART error on disk ada0',
    text: 'SMART errors detected on disk ada0',
    source: 'smartd',
    args: {},
    mail: '',
    node: 'primary',
    one_shot: false,
    uuid: 'uuid-2',
  },
]

/**
 * Default mock logged-in user
 */
export const mockLoggedInUser = {
  pw_dir: '/home/admin',
  pw_gecos: 'Admin User',
  pw_gid: 0,
  pw_name: 'admin',
  pw_shell: '/bin/bash',
  pw_uid: 0,
  attributes: {
    preferences: {},
    dashState: [],
    appsAgreement: true,
  },
  privilege: {
    roles: { $set: ['FULL_ADMIN'] },
    web_shell: true,
    webui_access: true,
  },
  account_attributes: [],
  two_factor_config: {
    secret_configured: false,
    otp_enabled: false,
  },
}
