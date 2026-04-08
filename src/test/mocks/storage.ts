/**
 * Storage Mock
 *
 * Mock implementation for testing storage/persistence
 */


export class MockStorage implements Storage {
  private data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys())
    return keys[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  // Test helper methods
  setItems(items: Record<string, string>): void {
    Object.entries(items).forEach(([key, value]) => {
      this.data.set(key, value)
    })
  }

  getAll(): Record<string, string> {
    return Object.fromEntries(this.data.entries())
  }

  hasKey(key: string): boolean {
    return this.data.has(key)
  }
}

export const mockLocalStorage = new MockStorage()
export const mockSessionStorage = new MockStorage()

/**
 * Setup global storage mocks
 */
export function setupStorageMocks(): void {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  })

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  })
}

/**
 * Reset all storage mocks
 */
export function resetStorageMocks(): void {
  mockLocalStorage.clear()
  mockSessionStorage.clear()
}
