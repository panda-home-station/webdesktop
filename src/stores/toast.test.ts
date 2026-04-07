/**
 * Toast Store Tests
 *
 * Tests for toast state management
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useToastStore } from './toast'

describe('Toast Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useToastStore.getState()
    store.dismissAllToasts()
  })

  it('should initialize with empty state', () => {
    const store = useToastStore.getState()

    expect(store.toasts).toEqual([])
    expect(store.maxToasts).toBe(5)
    expect(store.defaultDuration).toBe(5000)
  })

  it('should add a toast', () => {
    const store = useToastStore.getState()

    store.showSuccess('Test Success', 'This is a test message')

    const updated = useToastStore.getState()
    expect(updated.toasts).toHaveLength(1)
    expect(updated.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Test Success',
      description: 'This is a test message',
    })
  })

  it('should limit max toasts', () => {
    const store = useToastStore.getState()
    store.setMaxToasts(3)

    // Add more than max
    for (let i = 0; i < 5; i++) {
      store.showInfo(`Toast ${i}`, `Description ${i}`)
    }

    const updated = useToastStore.getState()
    expect(updated.toasts).toHaveLength(3)
  })

  it('should dismiss a toast', () => {
    const store = useToastStore.getState()
    store.showWarning('Warning Toast')

    const { toasts: [toast] } = useToastStore.getState()
    store.dismissToast(toast.id)

    const updated = useToastStore.getState()
    expect(updated.toasts).toHaveLength(0)
  })

  it('should dismiss all toasts', () => {
    const store = useToastStore.getState()

    store.showSuccess('Toast 1')
    store.showError('Toast 2')
    store.showInfo('Toast 3')

    expect(useToastStore.getState().toasts).toHaveLength(3)

    store.dismissAllToasts()

    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('should support different toast types', () => {
    const store = useToastStore.getState()

    store.showSuccess('Success', 'Success message')
    store.showError('Error', 'Error message')
    store.showWarning('Warning', 'Warning message')
    store.showInfo('Info', 'Info message')

    const toasts = useToastStore.getState().toasts
    expect(toasts).toHaveLength(4)

    expect(toasts[0].type).toBe('success')
    expect(toasts[1].type).toBe('error')
    expect(toasts[2].type).toBe('warning')
    expect(toasts[3].type).toBe('info')
  })

  it('should support custom duration', () => {
    const store = useToastStore.getState()
    store.showInfo('Auto-dismiss', 'Will dismiss after 1s', { duration: 1000 })

    const toast = useToastStore.getState().toasts[0]
    expect(toast.duration).toBe(1000)
  })

  it('should support actions', () => {
    const store = useToastStore.getState()
    const actionClick = vi.fn()

    store.showSuccess('Action Toast', 'Click me', {
      action: {
        label: 'Click Me',
        onClick: actionClick,
      },
    })

    const toast = useToastStore.getState().toasts[0]
    expect(toast.action).toMatchObject({
      label: 'Click Me',
      onClick: actionClick,
    })
  })
})
