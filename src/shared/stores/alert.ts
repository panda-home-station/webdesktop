/**
 * Alert Store
 *
 * Zustand store for managing alert state
 * Ported from webui's NgRx alert store
 */

import { create } from 'zustand'
import { Alert } from '../types/alert.interface'
import { AlertLevel } from '../types/alert.enum'
import { getAlertService } from '../../truenas/services/alert'

export interface AlertsState {
  alerts: Alert[]
  isLoading: boolean
  isPanelOpen: boolean
  error: string | null

  // Actions
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  updateAlert: (id: string, updates: Partial<Alert>) => void
  dismissAlert: (id: string) => void
  reopenAlert: (id: string) => void
  dismissAllAlerts: (alertIds?: string[]) => void
  reopenAllAlerts: (alertIds?: string[]) => void
  setIsPanelOpen: (isOpen: boolean) => void
  togglePanel: () => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchAlerts: () => Promise<void>

  // Computed
  getUnreadAlerts: () => Alert[]
  getDismissedAlerts: () => Alert[]
  getImportantUnreadAlertsCount: () => number
  getAlertsByLevel: (level: AlertLevel) => Alert[]
}

// Helper function to sort alerts by priority and datetime
const sortAlerts = (a: Alert, b: Alert): number => {
  const priorityOrder = Object.values(AlertLevel)
  const aPriority = priorityOrder.indexOf(a.level)
  const bPriority = priorityOrder.indexOf(b.level)

  // Higher priority first (lower index = higher priority)
  if (aPriority !== bPriority) {
    return aPriority - bPriority
  }

  // More recent first
  const aTime = a.datetime.$date || 0
  const bTime = b.datetime.$date || 0
  if (aTime !== bTime) {
    return bTime - aTime
  }

  // By class name
  return (a.klass || '').localeCompare(b.klass || '')
}

const useAlertStore = create<AlertsState>((set, get) => ({
  alerts: [],
  isLoading: false,
  isPanelOpen: false,
  error: null,

  setAlerts: (alerts: Alert[]) => {
    // Preserve dismissed state for alerts that were dismissed locally
    const state = get()
    const locallyDismissedIds = new Set(
      state.alerts
        .filter(a => a.dismissed)
        .map(a => a.id),
    )

    const mergedAlerts = alerts.map(alert => {
      if (locallyDismissedIds.has(alert.id)) {
        return { ...alert, dismissed: true }
      }
      return alert
    }).sort(sortAlerts)

    set({
      alerts: mergedAlerts,
      isLoading: false,
      error: null,
    })
  },

  addAlert: (alert: Alert) => {
    set(state => {
      const alerts = [...state.alerts, alert].sort(sortAlerts)
      return { alerts }
    })
  },

  updateAlert: (id: string, updates: Partial<Alert>) => {
    set(state => {
      const alerts = state.alerts.map(alert =>
        alert.id === id ? { ...alert, ...updates } : alert
      )
      return { alerts }
    })
  },

  dismissAlert: (id: string) => {
    set(state => {
      // Find alert being dismissed
      const alert = state.alerts.find(a => a.id === id)
      if (!alert) return state

      // Dismiss all alerts with same key
      const alerts = state.alerts.map(a =>
        a.key === alert.key ? { ...a, dismissed: true } : a
      )
      return { alerts }
    })
  },

  reopenAlert: (id: string) => {
    set(state => {
      // Find alert being reopened
      const alert = state.alerts.find(a => a.id === id)
      if (!alert) return state

      // Reopen all alerts with same key
      const alerts = state.alerts.map(a =>
        a.key === alert.key ? { ...a, dismissed: false } : a
      )
      return { alerts }
    })
  },

  dismissAllAlerts: (alertIds?: string[]) => {
    set(state => {
      let alerts = state.alerts

      if (alertIds === undefined) {
        // Dismiss all
        alerts = alerts.map(a => ({ ...a, dismissed: true }))
      } else if (alertIds.length > 0) {
        // Dismiss specific alerts
        alerts = alerts.map(a =>
          alertIds.includes(a.id) ? { ...a, dismissed: true } : a
        )
      }

      return { alerts }
    })
  },

  reopenAllAlerts: (alertIds?: string[]) => {
    set(state => {
      let alerts = state.alerts

      if (alertIds === undefined) {
        // Reopen all
        alerts = alerts.map(a => ({ ...a, dismissed: false }))
      } else if (alertIds.length > 0) {
        // Reopen specific alerts
        alerts = alerts.map(a =>
          alertIds.includes(a.id) ? { ...a, dismissed: false } : a
        )
      }

      return { alerts }
    })
  },

  setIsPanelOpen: (isOpen: boolean) => set({ isPanelOpen: isOpen }),
  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  getUnreadAlerts: () => {
    return get().alerts.filter(a => !a.dismissed)
  },

  getDismissedAlerts: () => {
    return get().alerts.filter(a => a.dismissed)
  },

  getImportantUnreadAlertsCount: () => {
    const importantLevels = [
      AlertLevel.Critical,
      AlertLevel.Alert,
      AlertLevel.Emergency,
      AlertLevel.Error,
    ]
    return get().alerts.filter(
      a => !a.dismissed && importantLevels.includes(a.level)
    ).length
  },

  getAlertsByLevel: (level: AlertLevel) => {
    return get().alerts.filter(a => a.level === level)
  },

  fetchAlerts: async () => {
    try {
      await getAlertService().fetchAlerts()
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      get().setError(error instanceof Error ? error.message : 'Failed to fetch alerts')
    }
  },
}))

export default useAlertStore
