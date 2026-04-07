/**
 * Alert Store Tests
 *
 * Tests for alert state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AlertLevel, AlertClassName } from '../types/alert.enum'

// Mock truenasApi before importing the store
vi.mock('../../truenas/api', () => ({
  truenasApi: {
    call: vi.fn(),
    subscribe: vi.fn(),
  },
}))

// Import store (default export)
import useAlertStore from './alert'
import type { Alert } from '../types/alert.interface'

describe('Alert Store', () => {
  // Sample alert factory
  const createAlert = (overrides: Partial<Alert> = {}): Alert => ({
    id: `alert-${Math.random().toString(36).slice(2, 9)}`,
    key: 'test-key',
    level: AlertLevel.Info,
    klass: AlertClassName.VolumeStatus,
    dismissed: false,
    datetime: { $date: Date.now() },
    last_occurrence: { $date: Date.now() },
    formatted: 'Test alert',
    text: 'Test alert text',
    source: 'test',
    args: {},
    mail: '',
    node: 'primary',
    one_shot: false,
    uuid: 'test-uuid',
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useAlertStore.setState({
      alerts: [],
      isLoading: false,
      isPanelOpen: false,
      error: null,
    })
  })

  describe('Initial State', () => {
    it('should have empty alerts array', () => {
      expect(useAlertStore.getState().alerts).toEqual([])
    })

    it('should have isLoading as false', () => {
      expect(useAlertStore.getState().isLoading).toBe(false)
    })

    it('should have isPanelOpen as false', () => {
      expect(useAlertStore.getState().isPanelOpen).toBe(false)
    })

    it('should have error as null', () => {
      expect(useAlertStore.getState().error).toBe(null)
    })
  })

  describe('setAlerts', () => {
    it('should set alerts', () => {
      const alerts = [createAlert({ id: '1' })]
      useAlertStore.getState().setAlerts(alerts)

      expect(useAlertStore.getState().alerts).toHaveLength(1)
    })
  })

  describe('addAlert', () => {
    it('should add a new alert', () => {
      useAlertStore.getState().addAlert(createAlert({ id: 'new-alert' }))

      expect(useAlertStore.getState().alerts).toHaveLength(1)
      expect(useAlertStore.getState().alerts[0].id).toBe('new-alert')
    })
  })

  describe('updateAlert', () => {
    it('should update an existing alert', () => {
      useAlertStore.getState().setAlerts([createAlert({ id: 'test-id' })])
      useAlertStore.getState().updateAlert('test-id', { level: AlertLevel.Warning })

      expect(useAlertStore.getState().alerts[0].level).toBe(AlertLevel.Warning)
    })
  })

  describe('dismissAlert', () => {
    it('should dismiss alert', () => {
      useAlertStore.getState().setAlerts([createAlert({ id: '1', key: 'same-key' })])
      useAlertStore.getState().dismissAlert('1')

      expect(useAlertStore.getState().alerts[0].dismissed).toBe(true)
    })
  })

  describe('setIsLoading', () => {
    it('should set loading state', () => {
      useAlertStore.getState().setIsLoading(true)
      expect(useAlertStore.getState().isLoading).toBe(true)
    })
  })

  describe('setError', () => {
    it('should set error', () => {
      useAlertStore.getState().setError('Test error')
      expect(useAlertStore.getState().error).toBe('Test error')
    })
  })

  describe('setIsPanelOpen', () => {
    it('should set panel open state', () => {
      useAlertStore.getState().setIsPanelOpen(true)
      expect(useAlertStore.getState().isPanelOpen).toBe(true)
    })
  })

  describe('fetchAlerts', () => {
    it('should call truenasApi.call with alert.list', async () => {
      const { truenasApi } = await import('../../truenas/api')
      const mockAlerts = [createAlert({ id: '1' })]
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(mockAlerts)

      await useAlertStore.getState().fetchAlerts()

      expect(truenasApi.call).toHaveBeenCalledWith('alert.list')
    })

    it('should set alerts on successful fetch', async () => {
      const { truenasApi } = await import('../../truenas/api')
      const mockAlerts = [createAlert({ id: '1' }), createAlert({ id: '2' })]
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(mockAlerts)

      await useAlertStore.getState().fetchAlerts()

      expect(useAlertStore.getState().alerts).toHaveLength(2)
    })

    it('should set error on failed fetch', async () => {
      const { truenasApi } = await import('../../truenas/api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'))

      await useAlertStore.getState().fetchAlerts()

      expect(useAlertStore.getState().error).toBe('API Error')
    })
  })
})
