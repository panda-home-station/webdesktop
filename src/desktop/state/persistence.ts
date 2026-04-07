/**
 * Unified State Persistence Layer
 *
 * Provides a unified interface for storing state with different persistence strategies:
 * - LocalStorage: persists across browser sessions
 * - SessionStorage: persists for current session only
 * - Memory: in-memory only, cleared on page reload
 */

export type StorageType = 'localStorage' | 'sessionStorage' | 'memory'

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
    this.prefix = config.prefix ?? ''
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
    return this.storage === memoryStorageInstance ? 'memory' : (this.storage === window.localStorage ? 'localStorage' : 'sessionStorage')
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
