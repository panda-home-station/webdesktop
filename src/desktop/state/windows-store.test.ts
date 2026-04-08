/**
 * Windows Store Tests
 *
 * Tests for window state management
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useWindowsStore } from './windows-store'

describe('Windows Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWindowsStore.setState({
      windows: [],
      zOrder: [],
      maxRestoredWindow: null,
      animating: false,
    })
  })

  describe('Initial State', () => {
    it('should initialize with empty windows', () => {
      const state = useWindowsStore.getState()
      expect(state.windows).toEqual([])
      expect(state.zOrder).toEqual([])
      expect(state.animating).toBe(false)
      expect(state.maxRestoredWindow).toBe(null)
    })
  })

  describe('addWindow', () => {
    it('should add a new window', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({
        title: 'Test Window',
        appId: 'test-app',
        x: 100,
        y: 100,
        w: 600,
        h: 400,
      })

      const state = useWindowsStore.getState()
      expect(state.windows).toHaveLength(1)
      expect(state.windows[0].id).toBe(id)
      expect(state.windows[0].title).toBe('Test Window')
      expect(state.windows[0].appId).toBe('test-app')
    })

    it('should add window id to zOrder', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({
        title: 'Window 1',
        appId: 'app1',
      })

      const state = useWindowsStore.getState()
      expect(state.zOrder).toContain(id)
    })

    it('should use provided id if given', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({
        id: 'custom-id',
        title: 'Custom ID Window',
        appId: 'test',
      })

      expect(id).toBe('custom-id')
      expect(useWindowsStore.getState().windows[0].id).toBe('custom-id')
    })

    it('should clamp window to screen bounds', () => {
      const store = useWindowsStore.getState()
      store.addWindow({
        title: 'Large Window',
        appId: 'test',
        x: -1000,
        y: -1000,
        w: 10000,
        h: 10000,
      })

      const state = useWindowsStore.getState()
      // Window should be clamped
      expect(state.windows[0].w).toBeLessThanOrEqual(globalThis.window?.innerWidth ?? 1920)
      expect(state.windows[0].h).toBeLessThanOrEqual(globalThis.window?.innerHeight ?? 1080)
    })
  })

  describe('updateWindow', () => {
    it('should update window properties', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({
        title: 'Original',
        appId: 'test',
      })

      store.updateWindow(id, { title: 'Updated', x: 200 })

      const state = useWindowsStore.getState()
      const window = state.windows.find(w => w.id === id)
      expect(window?.title).toBe('Updated')
      expect(window?.x).toBe(200)
    })

    it('should not affect other windows', () => {
      const store = useWindowsStore.getState()
      const id1 = store.addWindow({ title: 'Window 1', appId: 'app1' })
      const id2 = store.addWindow({ title: 'Window 2', appId: 'app2' })

      store.updateWindow(id1, { title: 'Updated' })

      const state = useWindowsStore.getState()
      expect(state.windows.find(w => w.id === id2)?.title).toBe('Window 2')
    })
  })

  describe('removeWindow', () => {
    it('should remove window by id', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({ title: 'To Remove', appId: 'test' })

      store.removeWindow(id)

      const state = useWindowsStore.getState()
      expect(state.windows).toHaveLength(0)
    })

    it('should remove id from zOrder', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({ title: 'Test', appId: 'test' })

      store.removeWindow(id)

      const state = useWindowsStore.getState()
      expect(state.zOrder).not.toContain(id)
    })
  })

  describe('focusWindow', () => {
    it('should move window id to end of zOrder', () => {
      const store = useWindowsStore.getState()
      const id1 = store.addWindow({ title: 'First', appId: 'app1' })
      const id2 = store.addWindow({ title: 'Second', appId: 'app2' })

      store.focusWindow(id1)

      const state = useWindowsStore.getState()
      expect(state.zOrder).toEqual([id2, id1])
    })
  })

  describe('minimizeWindow', () => {
    it('should set minimized to true', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({ title: 'Test', appId: 'test' })

      store.minimizeWindow(id)

      const window = useWindowsStore.getState().windows.find(w => w.id === id)
      expect(window?.minimized).toBe(true)
    })
  })

  describe('restoreWindow', () => {
    it('should set minimized to false and focus', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({ title: 'Test', appId: 'test', minimized: true })

      store.restoreWindow(id)

      const window = useWindowsStore.getState().windows.find(w => w.id === id)
      expect(window?.minimized).toBe(false)
    })
  })

  describe('maximizeWindow', () => {
    it('should maximize window and save prev state', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({
        title: 'Test',
        appId: 'test',
        x: 100,
        y: 100,
        w: 600,
        h: 400,
      })

      store.maximizeWindow(id)

      const window = useWindowsStore.getState().windows.find(w => w.id === id)
      expect(window?.maximized).toBe(true)
      expect(window?.prev).toEqual({ x: 100, y: 100, w: 600, h: 400 })
    })

    it('should restore from maximized state', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({
        title: 'Test',
        appId: 'test',
        x: 100,
        y: 100,
        w: 600,
        h: 400,
        maximized: true,
        prev: { x: 100, y: 100, w: 600, h: 400 },
      })

      store.maximizeWindow(id)

      const window = useWindowsStore.getState().windows.find(w => w.id === id)
      expect(window?.maximized).toBe(false)
    })
  })

  describe('moveWindow', () => {
    it('should update window position', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({ title: 'Test', appId: 'test', x: 0, y: 0 })

      store.moveWindow(id, 300, 200)

      const window = useWindowsStore.getState().windows.find(w => w.id === id)
      expect(window?.x).toBe(300)
      expect(window?.y).toBe(200)
    })
  })

  describe('resizeWindow', () => {
    it('should update window size', () => {
      const store = useWindowsStore.getState()
      const id = store.addWindow({ title: 'Test', appId: 'test', w: 600, h: 400 })

      store.resizeWindow(id, 800, 600)

      const window = useWindowsStore.getState().windows.find(w => w.id === id)
      expect(window?.w).toBe(800)
      expect(window?.h).toBe(600)
    })
  })

  describe('setAnimating', () => {
    it('should set animating state', () => {
      const store = useWindowsStore.getState()
      expect(store.animating).toBe(false)

      store.setAnimating(true)
      expect(useWindowsStore.getState().animating).toBe(true)

      store.setAnimating(false)
      expect(useWindowsStore.getState().animating).toBe(false)
    })
  })

  describe('clearAllWindows', () => {
    it('should remove all windows', () => {
      const store = useWindowsStore.getState()
      store.addWindow({ title: 'Window 1', appId: 'app1' })
      store.addWindow({ title: 'Window 2', appId: 'app2' })

      store.clearAllWindows()

      const state = useWindowsStore.getState()
      expect(state.windows).toEqual([])
      expect(state.zOrder).toEqual([])
    })
  })

  describe('Computed Getters', () => {
    beforeEach(() => {
      const store = useWindowsStore.getState()
      store.addWindow({ id: 'w1', title: 'Window 1', appId: 'app1', x: 0, y: 0, w: 100, h: 100 })
      store.addWindow({ id: 'w2', title: 'Window 2', appId: 'app1', x: 0, y: 0, w: 100, h: 100, minimized: true })
      store.addWindow({ id: 'w3', title: 'Window 3', appId: 'app2', x: 0, y: 0, w: 100, h: 100 })
      store.setAnimating(false)
    })

    it('getActiveWindow should return topmost window', () => {
      const store = useWindowsStore.getState()
      const active = store.getActiveWindow()
      expect(active?.id).toBe('w3')
    })

    it('getWindowById should find window', () => {
      const store = useWindowsStore.getState()
      const window = store.getWindowById('w2')
      expect(window?.title).toBe('Window 2')
    })

    it('getWindowsByAppId should filter by appId', () => {
      const store = useWindowsStore.getState()
      const windows = store.getWindowsByAppId('app1')
      expect(windows).toHaveLength(2)
    })

    it('getVisibleWindows should exclude minimized', () => {
      const store = useWindowsStore.getState()
      const visible = store.getVisibleWindows()
      expect(visible).toHaveLength(2)
      expect(visible.every(w => !w.minimized)).toBe(true)
    })
  })
})
