/**
 * useWindowSystem Hook Tests
 *
 * Tests for window system management hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'

// Mock dependencies
vi.mock('../useWindowSystem', () => ({
  useWindowSystem: vi.fn().mockReturnValue({
    windows: [],
    zOrder: [],
    animating: false,
    showLauncher: false,
    showQuickAgent: false,
    persistLoaded: true,
    apps: [],
    openWindow: vi.fn(),
    closeWindow: vi.fn(),
    focusWindow: vi.fn(),
    minimizeWindow: vi.fn(),
    restoreWindow: vi.fn(),
    toggleMaximize: vi.fn(),
    moveWindow: vi.fn(),
    resizeWindow: vi.fn(),
    dragFromMaximized: vi.fn(),
    toggleLauncher: vi.fn(),
    toggleQuickAgent: vi.fn(),
    showDesktop: vi.fn(),
    changeWindowTitle: vi.fn(),
    getApp: vi.fn(),
    getAppMinDimensions: vi.fn().mockReturnValue({ minW: 300, minH: 200 }),
  }),
}))

// Mock the windows store
vi.mock('../state/windows-store', () => ({
  useWindowsStore: vi.fn().mockReturnValue({
    windows: [],
    zOrder: [],
    maxRestoredWindow: null,
    animating: false,
    addWindow: vi.fn().mockReturnValue('test-window-id'),
    updateWindow: vi.fn(),
    removeWindow: vi.fn(),
    focusWindow: vi.fn(),
    minimizeWindow: vi.fn(),
    restoreWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    moveWindow: vi.fn(),
    resizeWindow: vi.fn(),
    setAnimating: vi.fn(),
    clearAllWindows: vi.fn(),
    getActiveWindow: vi.fn().mockReturnValue(null),
    getWindowById: vi.fn(),
    getWindowsByAppId: vi.fn().mockReturnValue([]),
    getVisibleWindows: vi.fn().mockReturnValue([]),
    getMaximizedWindow: vi.fn().mockReturnValue(null),
  }),
}))

// Mock framework registry
vi.mock('../../framework/registry', () => ({
  listApps: vi.fn().mockReturnValue([]),
  loadApp: vi.fn().mockResolvedValue(() => React.createElement('div')),
  AppDef: {},
}))

// Mock SDK
vi.mock('../../shared/sdk/desktop', () => ({
  subscribeOpenApp: vi.fn().mockReturnValue(() => {}),
  subscribeWinAction: vi.fn().mockReturnValue(() => {}),
  subscribeShowDesktop: vi.fn().mockReturnValue(() => {}),
  subscribeLauncher: vi.fn().mockReturnValue(() => {}),
}))

vi.mock('../../shared/sdk/permissions', () => ({
  requestPermission: vi.fn().mockReturnValue(true),
}))

describe('useWindowSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Window Actions', () => {
    it('should provide all required window actions', async () => {
      const { useWindowSystem } = await import('../useWindowSystem')
      const { result } = renderHook(() => useWindowSystem())

      const actions = [
        'openWindow',
        'closeWindow',
        'focusWindow',
        'minimizeWindow',
        'restoreWindow',
        'toggleMaximize',
        'moveWindow',
        'resizeWindow',
        'dragFromMaximized',
        'toggleLauncher',
        'toggleQuickAgent',
        'showDesktop',
        'changeWindowTitle',
      ]

      actions.forEach(action => {
        expect(result.current[action]).toBeDefined()
        expect(typeof result.current[action]).toBe('function')
      })
    })
  })

  describe('State', () => {
    it('should return initial state', async () => {
      const { useWindowSystem } = await import('../useWindowSystem')
      const { result } = renderHook(() => useWindowSystem())

      expect(result.current.windows).toEqual([])
      expect(result.current.zOrder).toEqual([])
      expect(result.current.showLauncher).toBe(false)
      expect(result.current.showQuickAgent).toBe(false)
      expect(result.current.animating).toBe(false)
    })
  })

  describe('App Helpers', () => {
    it('should provide getApp function', async () => {
      const { useWindowSystem } = await import('../useWindowSystem')
      const { result } = renderHook(() => useWindowSystem())

      expect(result.current.getApp).toBeDefined()
      expect(typeof result.current.getApp).toBe('function')
    })

    it('should provide getAppMinDimensions function', async () => {
      const { useWindowSystem } = await import('../useWindowSystem')
      const { result } = renderHook(() => useWindowSystem())

      expect(result.current.getAppMinDimensions).toBeDefined()
      expect(typeof result.current.getAppMinDimensions).toBe('function')
    })
  })

  describe('Window Lifecycle', () => {
    it('should open window with correct parameters', async () => {
      const { useWindowSystem } = await import('../useWindowSystem')
      const openWindow = vi.fn()
      ;(useWindowSystem as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        windows: [],
        zOrder: [],
        animating: false,
        showLauncher: false,
        showQuickAgent: false,
        persistLoaded: true,
        apps: [{ id: 'test-app', title: 'Test App' }],
        openWindow,
        closeWindow: vi.fn(),
        focusWindow: vi.fn(),
        minimizeWindow: vi.fn(),
        restoreWindow: vi.fn(),
        toggleMaximize: vi.fn(),
        moveWindow: vi.fn(),
        resizeWindow: vi.fn(),
        dragFromMaximized: vi.fn(),
        toggleLauncher: vi.fn(),
        toggleQuickAgent: vi.fn(),
        showDesktop: vi.fn(),
        changeWindowTitle: vi.fn(),
        getApp: vi.fn().mockReturnValue({ id: 'test-app', title: 'Test App' }),
        getAppMinDimensions: vi.fn().mockReturnValue({ minW: 400, minH: 300 }),
      })

      const { result } = renderHook(() => useWindowSystem())
      result.current.openWindow({ appId: 'test-app', title: 'Test Window' })

      expect(openWindow).toHaveBeenCalled()
      expect(openWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          appId: 'test-app',
          title: 'Test Window',
        })
      )
    })

    it('should close window', async () => {
      const { useWindowSystem } = await import('../useWindowSystem')
      const closeWindow = vi.fn()
      ;(useWindowSystem as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        windows: [],
        zOrder: [],
        animating: false,
        showLauncher: false,
        showQuickAgent: false,
        persistLoaded: true,
        apps: [],
        openWindow: vi.fn(),
        closeWindow,
        focusWindow: vi.fn(),
        minimizeWindow: vi.fn(),
        restoreWindow: vi.fn(),
        toggleMaximize: vi.fn(),
        moveWindow: vi.fn(),
        resizeWindow: vi.fn(),
        dragFromMaximized: vi.fn(),
        toggleLauncher: vi.fn(),
        toggleQuickAgent: vi.fn(),
        showDesktop: vi.fn(),
        changeWindowTitle: vi.fn(),
        getApp: vi.fn(),
        getAppMinDimensions: vi.fn(),
      })

      const { result } = renderHook(() => useWindowSystem())
      result.current.closeWindow('window-1')

      expect(closeWindow).toHaveBeenCalledWith('window-1')
    })
  })
})
