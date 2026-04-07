/**
 * Window Management Store
 *
 * Zustand store for managing desktop window state
 * Handles window lifecycle, positioning, z-order, and persistence
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface WindowState {
  id: string
  title: string
  appId: string
  iconUrl?: string
  x: number
  y: number
  w: number
  h: number
  minimized: boolean
  maximized: boolean
  prev?: { x: number; y: number; w: number; h: number }
  content?: React.ReactNode
}

interface WindowsStore {
  // State
  windows: WindowState[]
  zOrder: string[]
  maxRestoredWindow: { id: string; title: string } | null
  animating: boolean

  // Actions
  addWindow: (window: Omit<WindowState, 'id'> & { id?: string }) => string
  updateWindow: (id: string, updates: Partial<WindowState>) => void
  removeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, w: number, h: number, x?: number, y?: number) => void
  setMaximizedWindow: (window: { id: string; title: string } | null) => void
  setAnimating: (animating: boolean) => void
  clearAllWindows: () => void

  // Computed
  getActiveWindow: () => WindowState | null
  getWindowById: (id: string) => WindowState | undefined
  getWindowsByAppId: (appId: string) => WindowState[]
  getVisibleWindows: () => WindowState[]
  getMaximizedWindow: () => WindowState | null
}

const clampWindow = (window: WindowState, screenW: number, screenH: number, minW: number, minH: number): WindowState => {
  const dockLeft = 12
  const dockWidth = 60
  const dockGap = 0
  const statusH = 0

  // Ensure screen dimensions are valid numbers
  const safeScreenW = Number.isFinite(screenW) ? screenW : 1920
  const safeScreenH = Number.isFinite(screenH) ? screenH : 1080

  if (window.maximized) {
    const x = dockLeft + dockWidth + dockGap
    const wmax = Math.max(minW, safeScreenW - x)
    const hmax = safeScreenH - statusH
    if (window.w !== wmax || window.h !== hmax || window.x !== x || window.y !== 0) {
      return { ...window, w: wmax, h: hmax, x, y: 0 }
    }
    return window
  }

  // Keep non-maximized windows visible
  let currentW = Math.max(minW, window.w)
  let currentH = Math.max(minH, window.h)
  const currentX = window.x
  const currentY = window.y

  // Force shrink if larger than viewport, but not smaller than minW/minH
  if (currentW > safeScreenW) currentW = Math.max(minW, safeScreenW)
  if (currentH > safeScreenH) currentH = Math.max(minH, safeScreenH)

  // Allow dragging out of bounds but with limits
  // Left/Right: keep 30px visible
  // Top: >= -1 (allow covering 1px border/gap)
  const limitMinX = 30 - currentW
  const limitMaxX = safeScreenW - 30
  const limitMinY = -1
  const limitMaxY = safeScreenH - 30 - statusH

  const nx = Math.max(limitMinX, Math.min(currentX, limitMaxX))
  const ny = Math.max(limitMinY, Math.min(currentY, limitMaxY))

  if (nx !== currentX || ny !== currentY || currentW !== window.w || currentH !== window.h) {
    return { ...window, x: nx, y: ny, w: currentW, h: currentH }
  }
  return window
}

export const useWindowsStore = create<WindowsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      windows: [],
      zOrder: [],
      maxRestoredWindow: null,
      animating: false,

      addWindow: (winData) => {
        const id = winData.id || `${winData.appId}-${Date.now()}`
        const newWindow: WindowState = {
          id,
          title: winData.title,
          appId: winData.appId,
          iconUrl: winData.iconUrl,
          x: winData.x ?? 60,
          y: winData.y ?? 60,
          w: winData.w ?? 600,
          h: winData.h ?? 400,
          minimized: winData.minimized ?? false,
          maximized: winData.maximized ?? false,
          prev: winData.prev,
          content: winData.content,
        }

        // Clamp to screen bounds
        const screenW = typeof globalThis.window !== 'undefined' ? globalThis.window.innerWidth : 1920
        const screenH = typeof globalThis.window !== 'undefined' ? globalThis.window.innerHeight : 1080
        const clamped = clampWindow(newWindow, screenW, screenH, 300, 200)

        set((state) => ({
          windows: [...state.windows, clamped],
          zOrder: [...state.zOrder, id],
        }))

        return id
      },

      updateWindow: (id, updates) => {
        set((state) => ({
          windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }))
      },

      removeWindow: (id) => {
        set((state) => ({
          windows: state.windows.filter((w) => w.id !== id),
          zOrder: state.zOrder.filter((z) => z !== id),
        }))
      },

      focusWindow: (id) => {
        set((state) => ({
          zOrder: [...state.zOrder.filter((z) => z !== id), id],
        }))
      },

      minimizeWindow: (id) => {
        get().updateWindow(id, { minimized: true })
      },

      restoreWindow: (id) => {
        get().updateWindow(id, { minimized: false })
        get().focusWindow(id)
      },

      maximizeWindow: (id) => {
        const state = get()
        const win = state.windows.find((w) => w.id === id)
        if (!win) return

        const dockLeft = 12
        const dockWidth = 60
        const dockGap = 0
        const H = typeof globalThis.window !== 'undefined' ? globalThis.window.innerHeight : 1080
        const W = typeof globalThis.window !== 'undefined' ? globalThis.window.innerWidth : 1920

        if (!win.maximized) {
          // Maximize
          const prev = { x: win.x, y: win.y, w: win.w, h: win.h }
          const x = dockLeft + dockWidth + dockGap
          const wmax = Math.max(300, W - x)
          get().updateWindow(id, { prev, x, y: 0, w: wmax, h: H, maximized: true })
        } else {
          // Restore
          const p = win.prev ?? { x: 60, y: 60, w: 600, h: 400 }
          const restored = clampWindow({ ...win, x: p.x, y: p.y, w: p.w, h: p.h }, W, H, 300, 200)
          get().updateWindow(id, { ...restored, maximized: false, prev: undefined })
        }

        get().focusWindow(id)
      },

      moveWindow: (id, x, y) => {
        const state = get()
        const win = state.windows.find((w) => w.id === id)
        if (!win) return

        const screenW = typeof globalThis.window !== 'undefined' ? globalThis.window.innerWidth : 1920
        const screenH = typeof globalThis.window !== 'undefined' ? globalThis.window.innerHeight : 1080
        const clamped = clampWindow({ ...win, x, y }, screenW, screenH, 300, 200)
        get().updateWindow(id, { x: clamped.x, y: clamped.y })
      },

      resizeWindow: (id, w, h, x, y) => {
        const state = get()
        const win = state.windows.find((winItem) => winItem.id === id)
        if (!win) return

        const screenW = typeof globalThis.window !== 'undefined' ? globalThis.window.innerWidth : 1920
        const screenH = typeof globalThis.window !== 'undefined' ? globalThis.window.innerHeight : 1080
        const clamped = clampWindow(
          { ...win, w, h, x: x ?? win.x, y: y ?? win.y },
          screenW,
          screenH,
          300,
          200
        )
        get().updateWindow(id, { w: clamped.w, h: clamped.h, x: clamped.x, y: clamped.y })
      },

      setMaximizedWindow: (window) => {
        set({ maxRestoredWindow: window })
      },

      setAnimating: (animating) => {
        set({ animating })
      },

      clearAllWindows: () => {
        set({ windows: [], zOrder: [], maxRestoredWindow: null })
      },

      // Computed getters
      getActiveWindow: () => {
        const state = get()
        const topId = state.zOrder[state.zOrder.length - 1]
        return state.windows.find((w) => w.id === topId) ?? null
      },

      getWindowById: (id) => {
        return get().windows.find((w) => w.id === id)
      },

      getWindowsByAppId: (appId) => {
        return get().windows.filter((w) => w.appId === appId)
      },

      getVisibleWindows: () => {
        return get().windows.filter((w) => !w.minimized)
      },

      getMaximizedWindow: () => {
        const state = get()
        const maxId = state.zOrder.find((id) => state.windows.find((w) => w.id === id && w.maximized))
        return state.windows.find((w) => w.id === maxId) ?? null
      },
    }),
    {
      name: 'windows-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data, not React content
        windows: state.windows.map((w) => ({
          id: w.id,
          title: w.title,
          appId: w.appId,
          iconUrl: w.iconUrl,
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
          minimized: w.minimized,
          maximized: w.maximized,
          prev: w.prev, // Also save prev to restore maximized windows correctly
        })),
        zOrder: state.zOrder,
      }),
    }
  )
)
