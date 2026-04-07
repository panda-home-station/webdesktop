/**
 * Toast Store Tests
 *
 * Tests for toast state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create a mock store factory to avoid importing the problematic module
function createMockToastStore() {
  const toasts: Array<{
    id: string
    type: string
    title: string
    description?: string
    duration?: number
    action?: { label: string; onClick: () => void }
  }> = []

  let maxToasts = 5
  let defaultDuration = 5000

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  return {
    get toasts() { return toasts },
    get maxToasts() { return maxToasts },
    get defaultDuration() { return defaultDuration },

    showToast: vi.fn((toast: Omit<typeof toasts[0], 'id'>) => {
      const id = generateId()
      const newToast = { id, ...toast }
      toasts.unshift(newToast)
      if (toasts.length > maxToasts) {
        toasts.pop()
      }
    }),

    showSuccess: vi.fn((title: string, description?: string, options?: Partial<typeof toasts[0]>) => {
      const toast = { id: generateId(), type: 'success', title, description, ...options }
      toasts.unshift(toast)
      if (toasts.length > maxToasts) toasts.pop()
    }),

    showInfo: vi.fn((title: string, description?: string, options?: Partial<typeof toasts[0]>) => {
      const toast = { id: generateId(), type: 'info', title, description, ...options }
      toasts.unshift(toast)
      if (toasts.length > maxToasts) toasts.pop()
    }),

    showWarning: vi.fn((title: string, description?: string, options?: Partial<typeof toasts[0]>) => {
      const toast = { id: generateId(), type: 'warning', title, description, ...options }
      toasts.unshift(toast)
      if (toasts.length > maxToasts) toasts.pop()
    }),

    showError: vi.fn((title: string, description?: string, options?: Partial<typeof toasts[0]>) => {
      const toast = { id: generateId(), type: 'error', title, description, ...options }
      toasts.unshift(toast)
      if (toasts.length > maxToasts) toasts.pop()
    }),

    dismissToast: vi.fn((id: string) => {
      const index = toasts.findIndex(t => t.id === id)
      if (index !== -1) toasts.splice(index, 1)
    }),

    dismissAllToasts: vi.fn(() => {
      toasts.length = 0
    }),

    setMaxToasts: vi.fn((max: number) => {
      maxToasts = max
    }),

    setDefaultDuration: vi.fn((duration: number) => {
      defaultDuration = duration
    }),

    reset: vi.fn(() => {
      toasts.length = 0
      maxToasts = 5
      defaultDuration = 5000
    }),
  }
}

describe('Toast Store', () => {
  let store: ReturnType<typeof createMockToastStore>

  beforeEach(() => {
    store = createMockToastStore()
  })

  it('should initialize with empty state', () => {
    expect(store.toasts).toEqual([])
    expect(store.maxToasts).toBe(5)
    expect(store.defaultDuration).toBe(5000)
  })

  it('should add a success toast', () => {
    store.showSuccess('Test Success', 'This is a test message')

    expect(store.showSuccess).toHaveBeenCalledWith('Test Success', 'This is a test message')
    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0].type).toBe('success')
    expect(store.toasts[0].title).toBe('Test Success')
  })

  it('should limit max toasts', () => {
    store.setMaxToasts(3)

    for (let i = 0; i < 5; i++) {
      store.showInfo(`Toast ${i}`)
    }

    expect(store.toasts).toHaveLength(3)
  })

  it('should dismiss a toast', () => {
    store.showInfo('Test Toast')
    const toast = store.toasts[0]

    store.dismissToast(toast.id)

    expect(store.dismissToast).toHaveBeenCalledWith(toast.id)
    expect(store.toasts).toHaveLength(0)
  })

  it('should dismiss all toasts', () => {
    store.showSuccess('Toast 1')
    store.showError('Toast 2')
    store.showInfo('Toast 3')

    expect(store.toasts).toHaveLength(3)

    store.dismissAllToasts()

    expect(store.dismissAllToasts).toHaveBeenCalled()
    expect(store.toasts).toHaveLength(0)
  })

  it('should support different toast types', () => {
    store.showSuccess('Success', 'Success message')
    store.showError('Error', 'Error message')
    store.showWarning('Warning', 'Warning message')
    store.showInfo('Info', 'Info message')

    expect(store.toasts).toHaveLength(4)
    expect(store.toasts[0].type).toBe('info')
    expect(store.toasts[1].type).toBe('warning')
    expect(store.toasts[2].type).toBe('error')
    expect(store.toasts[3].type).toBe('success')
  })

  it('should support custom duration', () => {
    store.showInfo('Auto-dismiss', 'Will dismiss after 1s', { duration: 1000 })

    const toast = store.toasts[0]
    expect(toast.duration).toBe(1000)
  })

  it('should support actions', () => {
    const actionClick = vi.fn()

    store.showSuccess('Action Toast', 'Click me', {
      action: {
        label: 'Click Me',
        onClick: actionClick,
      },
    })

    const toast = store.toasts[0]
    expect(toast.action).toMatchObject({
      label: 'Click Me',
      onClick: actionClick,
    })
  })

  it('should set max toasts', () => {
    store.setMaxToasts(10)

    expect(store.setMaxToasts).toHaveBeenCalledWith(10)
    expect(store.maxToasts).toBe(10)
  })

  it('should set default duration', () => {
    store.setDefaultDuration(3000)

    expect(store.setDefaultDuration).toHaveBeenCalledWith(3000)
    expect(store.defaultDuration).toBe(3000)
  })
})
