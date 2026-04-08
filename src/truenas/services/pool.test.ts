/**
 * Pool Service Tests
 *
 * Tests for pool API service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { poolService } from './pool'
import { mockPools } from '../../test/mocks/truenasApi'

// Mock truenasApi
vi.mock('../api', () => ({
  truenasApi: {
    call: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}))

describe('PoolService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('query', () => {
    it('should call pool.query with no filters', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(mockPools)

      const result = await poolService.query()

      expect(truenasApi.call).toHaveBeenCalledWith('pool.query', [])
      expect(result).toEqual(mockPools)
    })

    it('should call pool.query with filters', async () => {
      const { truenasApi } = await import('../api')
      const filters = [['status', '=', 'ONLINE']]
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue([mockPools[0]])

      const result = await poolService.query(filters)

      expect(truenasApi.call).toHaveBeenCalledWith('pool.query', filters)
      expect(result).toHaveLength(1)
    })
  })

  describe('get', () => {
    it('should get a single pool by id with extra options', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue([mockPools[0]])

      const result = await poolService.get(1)

      expect(truenasApi.call).toHaveBeenCalledWith(
        'pool.query',
        [['id', '=', 1]],
        { extra: { is_upgraded: true } }
      )
      expect(result).toEqual(mockPools[0])
    })
  })

  describe('create', () => {
    it('should call pool.create with params', async () => {
      const { truenasApi } = await import('../api')
      const createParams = { name: 'new-pool', topology: { data: [] } }
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 3 })

      const result = await poolService.create(createParams as never)

      expect(truenasApi.call).toHaveBeenCalledWith('pool.create', createParams)
      expect(result).toEqual({ id: 3 })
    })
  })

  describe('update', () => {
    it('should call pool.update with id and params', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 })

      await poolService.update(1, { comment: 'updated' })

      expect(truenasApi.call).toHaveBeenCalledWith('pool.update', 1, { comment: 'updated' })
    })
  })

  describe('delete', () => {
    it('should call pool.delete with id', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      await poolService.delete(1)

      expect(truenasApi.call).toHaveBeenCalledWith('pool.delete', 1, undefined)
    })

    it('should call pool.delete with options', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      await poolService.delete(1, { cascade: true })

      expect(truenasApi.call).toHaveBeenCalledWith('pool.delete', 1, { cascade: true })
    })
  })

  describe('export', () => {
    it('should call pool.export', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      await poolService.export(1)

      expect(truenasApi.call).toHaveBeenCalledWith('pool.export', 1, undefined)
    })

    it('should call pool.export with force option', async () => {
      const { truenasApi } = await import('../api')
      ;(truenasApi.call as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

      await poolService.export(1, { force: true })

      expect(truenasApi.call).toHaveBeenCalledWith('pool.export', 1, { force: true })
    })
  })

  describe('subscribeToChanges', () => {
    it('should subscribe to pool.query events', async () => {
      const { truenasApi } = await import('../api')
      const callback = vi.fn()

      poolService.subscribeToChanges(callback)

      expect(truenasApi.subscribe).toHaveBeenCalledWith('pool.query', callback)
    })
  })
})
