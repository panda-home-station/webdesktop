/**
 * Toast Store
 *
 * Zustand store for managing toast notifications
 */

import { create } from 'zustand'
import type { ToastType } from '../components/Toast'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastStore {
  // State
  toasts: Toast[]
  maxToasts: number
  defaultDuration: number

  // Actions
  showToast: (toast: Omit<Toast, 'id'>) => void
  showSuccess: (title: string, description?: string, options?: Partial<Toast>) => void
  showInfo: (title: string, description?: string, options?: Partial<Toast>) => void
  showWarning: (title: string, description?: string, options?: Partial<Toast>) => void
  showError: (title: string, description?: string, options?: Partial<Toast>) => void
  dismissToast: (id: string) => void
  dismissAllToasts: () => void
  setMaxToasts: (max: number) => void
  setDefaultDuration: (duration: number) => void
}

/**
 * Generate unique toast ID
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useToastStore = create<ToastStore>((set, get) => ({
  // Initial state
  toasts: [],
  maxToasts: 5,
  defaultDuration: 5000,

  /**
   * Show a toast
   */
  showToast: (toast) => {
    const id = generateId()
    const state = get()

    // Add toast
    set((prev) => {
      const newToasts = [id, ...toast, { id }]

      // Remove oldest if exceeding max
      if (newToasts.length > state.maxToasts) {
        newToasts.pop()
      }

      return { toasts: newToasts }
    })

    // Auto-dismiss after duration
    const duration = toast.duration ?? state.defaultDuration
    if (duration && duration > 0) {
      setTimeout(() => {
        set((prev) => ({
          toasts: prev.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },

  /**
   * Show success toast
   */
  showSuccess: (title, description, options) => {
    get().showToast({
      type: 'success',
      title,
      description,
      ...options,
    })
  },

  /**
   * Show info toast
   */
  showInfo: (title, description, options) => {
    get().showToast({
      type: 'info',
      title,
      description,
      ...options,
    })
  },

  /**
   * Show warning toast
   */
  showWarning: (title, description, options) => {
    get().showToast({
      type: 'warning',
      title,
      description,
      ...options,
    })
  },

  /**
   * Show error toast
   */
  showError: (title, description, options) => {
    get().showToast({
      type: 'error',
      title,
      description,
      ...options,
    })
  },

  /**
   * Dismiss a toast
   */
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  /**
   * Dismiss all toasts
   */
  dismissAllToasts: () => {
    set({ toasts: [] })
  },

  /**
   * Set maximum number of toasts
   */
  setMaxToasts: (max) => {
    set({ maxToasts: max })
  },

  /**
   * Set default duration
   */
  setDefaultDuration: (duration) => {
    set({ defaultDuration: duration })
  },
}))

/**
 * Toast Context
 */
import React, { createContext, useContext, ReactNode } from 'react'

interface ToastContextValue {
  showToast: typeof useToastStore.getState().showToast
  showSuccess: typeof useToastStore.getState().showSuccess
  showInfo: typeof useToastStore.getState().showInfo
  showWarning: typeof useToastStore.getState().showWarning
  showError: typeof useToastStore.getState().showError
  dismissToast: typeof useToastStore.getState().dismissToast
  dismissAllToasts: typeof useToastStore.getState().dismissAllToasts
}

const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const store = useToastStore()

  const value: ToastContextValue = {
    showToast: store.showToast,
    showSuccess: store.showSuccess,
    showInfo: store.showInfo,
    showWarning: store.showWarning,
    showError: store.showError,
    dismissToast: store.dismissToast,
    dismissAllToasts: store.dismissAllToasts,
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

/**
 * Use Toast Hook
 *
 * Hook to access toast functions
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
