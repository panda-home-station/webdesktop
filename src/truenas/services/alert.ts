/**
 * Alert Service
 *
 * Service for fetching and managing alerts through TrueNAS WebSocket API
 * Ported from webui's' alert service
 */

import { truenasApi } from '../api'
import { Alert } from '../../shared/types/alert.interface'
import useAlertStore from '../../shared/stores/alert'

export class AlertService {
  private initialized = false

  /**
   * Initialize alert service
   * Fetches initial alerts and subscribes to alert events
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Fetch initial alerts
      await this.fetchAlerts()

      // Subscribe to alert events
      this.subscribeToAlertAlerts()

      this.initialized = true
      // eslint-disable-next-line no-console
      console.debug('Alert service initialized')
    } catch (error) {
      console.error('Failed to initialize alert service:', error)
      useAlertStore.getState().setError(
        error instanceof Error ? error.message : 'Failed to initialize alerts'
      )
    }
  }

  /**
   * Fetch all alerts from server
   */
  async fetchAlerts(): Promise<void> {
    const store = useAlertStore.getState()
    store.setIsLoading(true)

    try {
      const result = await truenasApi.call('alert.list')
      const alerts = result as Alert[]
      store.setAlerts(alerts)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      store.setError(error instanceof Error ? error.message : 'Failed to fetch alerts')
    } finally {
      store.setIsLoading(false)
    }
  }

  /**
   * Refresh alerts (called from WebSocket events when panel is open)
   */
  refreshAlerts(): void {
    this.fetchAlerts()
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(id: string): Promise<void> {
    const store = useAlertStore.getState()

    try {
      await truenasApi.call('alert.dismiss', [id])
      store.dismissAlert(id)
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
      throw error
    }
  }

  /**
   * Dismiss multiple alerts
   */
  async dismissAllAlerts(alertIds: string[]): Promise<void> {
    const store = useAlertStore.getState()

    try {
      // Dismiss each alert individually
      await Promise.all(alertIds.map(id =>
        truenasApi.call('alert.dismiss', [id])
      ))
      store.dismissAllAlerts(alertIds)
    } catch (error) {
      console.error('Failed to dismiss alerts:', error)
      throw error
    }
  }

  /**
   * Reopen an alert
   */
  async reopenAlert(id: string): Promise<void> {
    const store = useAlertStore.getState()

    try {
      await truenasApi.call('alert.restore', [id])
      store.reopenAlert(id)
    } catch (error) {
      console.error('Failed to reopen alert:', error)
      throw error
    }
  }

  /**
   * Reopen multiple alerts
   */
  async reopenAllAlerts(alertIds: string[]): Promise<void> {
    const store = useAlertStore.getState()

    try {
      // Restore each alert individually
      await Promise.all(alertIds.map(id =>
        truenasApi.call('alert.restore', [id])
      ))
      store.reopenAllAlerts(alertIds)
    } catch (error) {
      console.error('Failed to reopen alerts:', error)
      throw error
    }
  }

  /**
   * Subscribe to alert events
   */
  private subscribeToAlertAlerts(): void {
    // Subscribe to alert.list events (like webui does)
    // Event format: { id: number, msg: 'added' | 'changed' | 'removed', fields?: Alert }
    truenasApi.subscribe('alert.list', (data) => {
      // eslint-disable-next-line no-console
      console.debug('Alert event:', data)

      const event = data as {
        id: number
        msg: 'added' | 'changed' | 'removed'
        fields?: Alert
      }

      const store = useAlertStore.getState()
      const isPanelOpen = store.isPanelOpen

      switch (event.msg) {
        case 'added':
          if (event.fields) {
            if (isPanelOpen) {
              // If panel is open, refresh all alerts
              this.refreshAlerts()
            } else {
              // Otherwise just add the new alert
              store.addAlert(event.fields)
            }
          }
          break
        case 'changed':
          if (event.fields) {
            if (isPanelOpen) {
              // If panel is open, refresh all alerts
              this.refreshAlerts()
            } else {
              // Otherwise update the alert
              store.updateAlert(event.fields.id, event.fields)
            }
          }
          break
        case 'removed':
          // Remove the alert from local state
          // Note: event.id is the internal event ID, not the alert UUID
          // We need to refresh or handle differently
          this.refreshAlerts()
          break
      }
    })
  }
}

// Singleton instance
let alertServiceInstance: AlertService | null = null

export function getAlertService(): AlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new AlertService()
  }
  return alertServiceInstance
}

export default getAlertService
