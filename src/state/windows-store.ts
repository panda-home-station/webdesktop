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

  if (window.maximized) {
    const x = dockLeft + dockWidth + dockGap
    const wmax = Math.max(minW, screenW - x)
    const hmax = screenH - statusH
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
  if (currentW > screenW) currentW = Math.max(minW, screenW)
  if (currentH > screenH) currentH = Math.max(minH, screenH)

  // Allow dragging out of bounds but with limits
  // Left/Right: keep 30px visible
  // Top: >= -1 (allow covering 1px border/gap)
  const limitMinX = 30 - currentW
  const limitMaxX = screenW - 30
  const limitMinY = -1
  const limitMaxY = screenH - 30 - statusH

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

      addWindow: (window) => {
        const id = window.id || `${window.appId}-${Date.now()}`
        const newWindow: WindowState = {
          id,
          title: window.title,
          appId: window.appId,
          iconUrl: window.iconUrl,
          x: window.x ?? 60,
          y: window.y ?? 60,
          w: window.w ?? 600,
          h: window.h ?? 400,
          minimized: window.minimized ?? false,
          maximized: window.maximized ?? false,
          prev: window.prev,
          content: window.content,
        }

        // Clamp to screen bounds
        const clamped = clampWindow(newWindow, window.innerWidth, window.innerHeight, 300, 200)

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
        const window = state.windows.find((w) => w.id === id)
        if (!window) return

        const dockLeft = 12
        const dockWidth = 60
        const dockGap = 0
        const H = window.innerHeight
        const W = window.innerWidth

        if (!window.maximized) {
          // Maximize
          const prev = { x: window.x, y: window.y, w: window.w, h: window.h }
          const x = dockLeft + dockWidth + dockGap
          const wmax = Math.max(300, W - x)
          get().updateWindow(id, { prev, x, y: 0, w: wmax, h: H, maximized: true })
        } else {
          // Restore
          const p = window.prev ?? { x: 60, y: 60, w: 600, h: 400 }
          const restored = clampWindow({ ...window, x: p.x, y: p.y, w: p.w, h: p.h }, W, H, 300, 200)
          get().updateWindow(id, { ...restored, maximized: false, prev: undefined })
        }

        get().focusWindow(id)
      },

      moveWindow: (id, x, y) => {
        const state = get()
        const window = state.windows.find((w) => w.id === id)
        if (!window) return

        const clamped = clampWindow({ ...window, x, y }, window.innerWidth, window.innerHeight, 300, 200)
        get().updateWindow(id, { x: clamped.x, y: clamped.y })
      },

      resizeWindow: (id, w, h, x, y) => {
        const state = get()
        const window = state.windows.find((win) => win.id === id)
        if (!window) return

        const clamped = clampWindow(
          { ...window, w, h, x: x ?? window.x, y: y ?? window.y },
          window.innerWidth,
          window.innerHeight,
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
        })),
        zOrder: state.zOrder,
      }),
    }
  )
)
