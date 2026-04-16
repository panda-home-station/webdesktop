/**
 * Unified State Persistence Layer
 *
 * Provides a unified interface for storing state with different persistence strategies:
 * - LocalStorage: persists across browser sessions (shared between windows)
 * - SessionStorage: persists for current session only (shared between windows)
 * - WindowStorage: session storage private to each browser tab (isolated per window)
 * - Memory: in-memory only, cleared on page reload
 */

import { getWindowId } from './window-identity'

export type StorageType = 'localStorage' | 'sessionStorage' | 'windowPrivate' | 'memory'

interface PersistenceConfig {
  type: StorageType
  prefix?: string
}

// In-memory storage
const memoryStorage = new Map<string, string>()

/**
 * Get storage based on type
 */
function getStorage(type: StorageType): Storage {
  switch (type) {
    case 'localStorage':
      return window.localStorage
    case 'sessionStorage':
      return window.sessionStorage
    case 'windowPrivate':
      // windowPrivate uses sessionStorage but with window-specific prefix
      return window.sessionStorage
    case 'memory':
      return memoryStorage as unknown as Storage
    default:
      return window.localStorage
  }
}

/**
 * Memory storage shim
 */
class MemoryStorage implements Storage {
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
}

const memoryStorageInstance = new MemoryStorage()

/**
 * Storage manager with prefix support
 */
class StorageManager {
  private storage: Storage
  private prefix: string

  constructor(config: PersistenceConfig) {
    this.storage =
      config.type === 'memory'
        ? memoryStorageInstance
        : (getStorage(config.type) as Storage)

    // For windowPrivate storage, include the window ID in the prefix
    if (config.type === 'windowPrivate') {
      this.prefix = `phs_${getWindowId()}_${config.prefix ?? ''}`
    } else {
      this.prefix = config.prefix ?? ''
    }
  }

  /**
   * Get prefixed key
   */
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key
  }

  /**
   * Get item from storage
   */
  get<T = unknown>(key: string): T | null {
    try {
      const fullKey = this.getKey(key)
      const item = this.storage.getItem(fullKey)

      if (item === null) return null

      return JSON.parse(item) as T
    } catch (error) {
      console.error(`Failed to get item "${key}" from storage:`, error)
      return null
    }
  }

  /**
   * Set item in storage
   */
  set<T = unknown>(key: string, value: T): boolean {
    try {
      const fullKey = this.getKey(key)
      const serialized = JSON.stringify(value)
      this.storage.setItem(fullKey, serialized)
      return true
    } catch (error) {
      console.error(`Failed to set item "${key}" in storage:`, error)
      return false
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.getKey(key)
      this.storage.removeItem(fullKey)
      return true
    } catch (error) {
      console.error(`Failed to remove item "${key}" from storage:`, error)
      return false
    }
  }

  /**
   * Check if item exists
   */
  has(key: string): boolean {
    const fullKey = this.getKey(key)
    return this.storage.getItem(fullKey) !== null
  }

  /**
   * Clear all items with this prefix
   */
  clear(): boolean {
    try {
      if (this.prefix) {
        // Only clear items with this prefix
        const keys: string[] = []
        for (let i = 0; i < this.storage.length; i++) {
          const key = this.storage.key(i)
          if (key && key.startsWith(`${this.prefix}:`)) {
            keys.push(key)
          }
        }
        keys.forEach((key) => this.storage.removeItem(key))
      } else {
        // Clear all
        this.storage.clear()
      }
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }

  /**
   * Get all keys with this prefix
   */
  keys(): string[] {
    const result: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key) {
        if (this.prefix) {
          if (key.startsWith(`${this.prefix}:`)) {
            result.push(key.slice(this.prefix.length + 1))
          }
        } else {
          result.push(key)
        }
      }
    }
    return result
  }

  /**
   * Get storage type
   */
  getStorageType(): StorageType {
    if (this.storage === memoryStorageInstance) return 'memory'
    if (this.storage === window.localStorage) return 'localStorage'
    // Since windowPrivate also uses sessionStorage, we check the prefix to differentiate
    if (this.prefix.includes('win_')) return 'windowPrivate'
    return 'sessionStorage'
  }
}

/**
 * Create a new storage manager
 */
export function createStorageManager(config: PersistenceConfig): StorageManager {
  return new StorageManager(config)
}

/**
 * Pre-configured storage managers for common use cases
 */
export const persistentStorage = createStorageManager({
  type: 'localStorage',
  prefix: 'phs',
})

export const sessionStorage = createStorageManager({
  type: 'sessionStorage',
  prefix: 'phs',
})

export const memoryStorageManager = createStorageManager({
  type: 'memory',
  prefix: 'phs',
})

/**
 * Window-private storage manager
 * Each browser tab gets its own isolated storage
 * Uses sessionStorage internally but with window-specific prefix
 *
 * Returns a Storage-compatible object for use with Zustand persist middleware
 */
export function createWindowStorage(prefix?: string): Storage {
  const manager = createStorageManager({
    type: 'windowPrivate',
    prefix: prefix ?? '',
  })

  // Return a Storage-compatible interface
  return {
    getItem: (key: string) => manager.get<string>(key) ?? null,
    setItem: (key: string, value: string) => manager.set(key, value),
    removeItem: (key: string) => manager.remove(key),
    key: (index: number) => manager.keys()[index] ?? null,
    get length(): number {
      return manager.keys().length
    },
    clear: () => manager.clear(),
  }
}

/**
 * Typed storage helpers
 */
export function createTypedStore<T>(
  key: string,
  defaultValue: T,
  config?: PersistenceConfig
) {
  const storage = config ? createStorageManager(config) : persistentStorage

  return {
    get(): T {
      const value = storage.get<T>(key)
      return value !== null ? value : defaultValue
    },

    set(value: T): void {
      storage.set(key, value)
    },

    reset(): void {
      storage.set(key, defaultValue)
    },

    remove(): void {
      storage.remove(key)
    },

    has(): boolean {
      return storage.has(key)
    },
  }
}
