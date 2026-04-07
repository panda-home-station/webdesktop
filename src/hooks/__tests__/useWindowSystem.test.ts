/**
 * useWindowSystem Hook Tests
 *
 * Tests for window system management hook
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('useWindowSystem', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => import('../useWindowSystem').then((mod) => mod.useWindowSystem()))

    expect(result.current).toBeDefined()
    expect(result.current.windows).toEqual([])
    expect(result.current.showLauncher).toBe(false)
  })

  it('should provide window actions', () => {
    const { result } = renderHook(() => import('../useWindowSystem').then((mod) => mod.useWindowSystem()))

    const {
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      restoreWindow,
      toggleMaximize,
    } = result.current

    expect(typeof openWindow).toBe('function')
    expect(typeof closeWindow).toBe('function')
    expect(typeof focusWindow).toBe('function')
    expect(typeof minimizeWindow).toBe('function')
    expect(typeof restoreWindow).toBe('function')
    expect(typeof toggleMaximize).toBe('function')
  })
})
