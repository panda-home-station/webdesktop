/**
 * Auth Store Tests
 *
 * Tests for authentication state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './auth'
import { LoginResult } from '../types/login-result.enum'
import { mockLoggedInUser } from '../../test/mocks/truenasApi'

// Mock the auth service
vi.mock('../../truenas/services/auth', () => ({
  authService: {
    logout: vi.fn().mockResolvedValue(undefined),
    refreshUser: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock the persistence module
vi.mock('../../desktop/state/persistence', () => ({
  createTypedStore: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    remove: vi.fn(),
    reset: vi.fn(),
    has: vi.fn().mockReturnValue(false),
  })),
  persistentStorage: {
    set: vi.fn(),
    get: vi.fn().mockReturnValue(null),
    remove: vi.fn(),
  },
  sessionStorage: {
    set: vi.fn(),
    get: vi.fn().mockReturnValue(null),
    remove: vi.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasTwoFactor: false,
      token: null,
      loginError: null,
    })
  })

  describe('Initial State', () => {
    it('should initialize with null user and unauthenticated', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBe(null)
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.hasTwoFactor).toBe(false)
      expect(state.token).toBe(null)
      expect(state.loginError).toBe(null)
    })
  })

  describe('setUser', () => {
    it('should set user', () => {
      const store = useAuthStore.getState()
      store.setUser(mockLoggedInUser)

      expect(useAuthStore.getState().user).toEqual(mockLoggedInUser)
    })

    it('should allow setting user to null', () => {
      const store = useAuthStore.getState()
      store.setUser(mockLoggedInUser)
      store.setUser(null)

      expect(useAuthStore.getState().user).toBe(null)
    })
  })

  describe('setAuthenticated', () => {
    it('should set authenticated state', () => {
      const store = useAuthStore.getState()
      store.setAuthenticated(true)

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      const store = useAuthStore.getState()
      store.setLoading(true)

      expect(useAuthStore.getState().isLoading).toBe(true)
    })
  })

  describe('setHasTwoFactor', () => {
    it('should set two-factor state', () => {
      const store = useAuthStore.getState()
      store.setHasTwoFactor(true)

      expect(useAuthStore.getState().hasTwoFactor).toBe(true)
    })
  })

  describe('setToken', () => {
    it('should set token', () => {
      const store = useAuthStore.getState()
      store.setToken('test-token')

      expect(useAuthStore.getState().token).toBe('test-token')
    })

    it('should allow setting token to null', () => {
      const store = useAuthStore.getState()
      store.setToken('test-token')
      store.setToken(null)

      expect(useAuthStore.getState().token).toBe(null)
    })
  })

  describe('setLoginError', () => {
    it('should set login error', () => {
      const store = useAuthStore.getState()
      store.setLoginError('Invalid credentials')

      expect(useAuthStore.getState().loginError).toBe('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('should clear auth state after logout', async () => {
      const store = useAuthStore.getState()

      // Setup authenticated state
      store.setUser(mockLoggedInUser)
      store.setAuthenticated(true)
      store.setToken('test-token')

      // Perform logout
      await store.logout()

      const state = useAuthStore.getState()
      expect(state.user).toBe(null)
      expect(state.isAuthenticated).toBe(false)
      expect(state.token).toBe(null)
    })
  })

  describe('clearAuth', () => {
    it('should clear all authentication state', () => {
      const store = useAuthStore.getState()

      // Setup state
      store.setUser(mockLoggedInUser)
      store.setAuthenticated(true)
      store.setHasTwoFactor(true)
      store.setToken('test-token')
      store.setLoginError('Some error')

      // Clear
      store.clearAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBe(null)
      expect(state.isAuthenticated).toBe(false)
      expect(state.hasTwoFactor).toBe(false)
      expect(state.token).toBe(null)
      expect(state.loginError).toBe(null)
    })
  })

  describe('refreshUser', () => {
    it('should call authService.refreshUser', async () => {
      const store = useAuthStore.getState()

      // Should not throw
      await expect(store.refreshUser()).resolves.not.toThrow()
    })
  })
})
