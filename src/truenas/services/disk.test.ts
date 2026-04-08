/**
 * Disk Service Tests
 *
 * Tests for disk API service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { diskService } from './disk'

// Mock truenasApi
vi.mock('../api', () => ({
  truenasApi: {
    call: vi.fn(),
    subscribe: vi.fn(),
  },
}))

describe('DiskService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('query', () => {
    it('should call disk.query with no arguments', async () => {
      const { truenasApi } = await import('../api')
      const mockDisks = [{ id: 'disk1' }, { id: 'disk2' }]
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(mockDisks)

      const result = await diskService.query()

      expect(truenasApi.call).toHaveBeenCalledWith('disk.query', [])
      expect(result).toEqual(mockDisks)
    })

    it('should call disk.query with filters', async () => {
      const { truenasApi } = await import('../api')
      const filters = [['type', '=', 'HDD']]
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue([])

      await diskService.query(filters)

      expect(truenasApi.call).toHaveBeenCalledWith('disk.query', filters)
    })

    it('should call disk.query with options', async () => {
      const { truenasApi } = await import('../api')
      const filters = []
      const options = { partitions: true }
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue([])

      await diskService.query(filters, options)

      expect(truenasApi.call).toHaveBeenCalledWith('disk.query', filters, options)
    })
  })

  describe('details', () => {
    it('should call disk.details', async () => {
      const { truenasApi } = await import('../api')
      const mockDetails = { used: [], unused: [] }
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(mockDetails)

      const result = await diskService.details()

      expect(truenasApi.call).toHaveBeenCalledWith('disk.details', undefined)
      expect(result).toEqual(mockDetails)
    })
  })

  describe('update', () => {
    it('should call disk.update with identifier and params', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'disk1' })

      await diskService.update('disk1', { hddstandby: 60 } as never)

      expect(truenasApi.call).toHaveBeenCalledWith('disk.update', 'disk1', { hddstandby: 60 })
    })
  })

  describe('wipe', () => {
    it('should call disk.wipe', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      await diskService.wipe({ devname: 'ada0' } as never)

      expect(truenasApi.call).toHaveBeenCalledWith('disk.wipe', { devname: 'ada0' })
    })
  })

  describe('format', () => {
    it('should call disk.format', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      await diskService.format('ada0')

      expect(truenasApi.call).toHaveBeenCalledWith('disk.format', 'ada0')
    })
  })

  describe('getTemperatures', () => {
    it('should call disk.temperatures', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await diskService.getTemperatures(['ada0', 'ada1'])

      expect(truenasApi.call).toHaveBeenCalledWith('disk.temperatures', ['ada0', 'ada1'])
    })
  })

  describe('temperatureAlerts', () => {
    it('should call alert.list with disk temperature filters', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue([])

      await diskService.temperatureAlerts(['ada0'])

      expect(truenasApi.call).toHaveBeenCalledWith(
        'alert.list',
        [['klass', '=', 'DiskTemperature'], ['args.devname', 'in', ['ada0']]]
      )
    })
  })

  describe('temperatureAgg', () => {
    it('should call disk.temperature_agg', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await diskService.temperatureAgg(['ada0'], 7)

      expect(truenasApi.call).toHaveBeenCalledWith('disk.temperature_agg', ['ada0'], { days: 7 })
    })

    it('should call without days parameter', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue({})

      await diskService.temperatureAgg(['ada0'])

      expect(truenasApi.call).toHaveBeenCalledWith('disk.temperature_agg', ['ada0'], { days: undefined })
    })
  })
})
