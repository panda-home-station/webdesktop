/**
 * Vitest Global Test Setup
 *
 * This file runs before each test file and sets up the testing environment.
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(),
}))

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock console.error for expected error suppressions in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress specific expected errors in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
