import { useState, useMemo, useCallback } from 'react'
import useAlertStore from '@truenas/stores/alert'
import { truenasApi } from '@truenas/api'
import type { SeverityFilter } from './types'
import { isCritical, isWarning, isInfo } from './types'
import NotificationsHeader from './components/NotificationsHeader'
import AlertItem from './components/AlertItem'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'
import EmptyState from './components/EmptyState'
import BatchActions from './components/BatchActions'

export default function NotificationsApp() {
  const {
    alerts,
    isLoading,
    error,
    dismissAlert,
    reopenAlert,
    dismissAllAlerts,
    reopenAllAlerts,
    fetchAlerts,
  } = useAlertStore()

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [showDismissed, setShowDismissed] = useState(false)

  const filteredAlerts = useMemo(() => {
    let filtered = alerts

    if (showDismissed) {
      filtered = filtered.filter(a => a.dismissed)
    } else {
      filtered = filtered.filter(a => !a.dismissed)

      switch (severityFilter) {
        case 'critical':
          filtered = filtered.filter(a => isCritical(a.level))
          break
        case 'warning':
          filtered = filtered.filter(a => isWarning(a.level))
          break
        case 'info':
          filtered = filtered.filter(a => isInfo(a.level))
          break
      }
    }

    return filtered
  }, [alerts, severityFilter, showDismissed])

  const alertCounts = useMemo(() => {
    const unreadAlerts = alerts.filter(a => !a.dismissed)
    const dismissedAlerts = alerts.filter(a => a.dismissed)
    return {
      all: unreadAlerts.length,
      critical: unreadAlerts.filter(a => isCritical(a.level)).length,
      warning: unreadAlerts.filter(a => isWarning(a.level)).length,
      info: unreadAlerts.filter(a => isInfo(a.level)).length,
      dismissed: dismissedAlerts.length,
    }
  }, [alerts])

  const handleDismiss = useCallback(async (id: string) => {
    try {
      await truenasApi.call('alert.dismiss', [id])
      dismissAlert(id)
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }
  }, [dismissAlert])

  const handleRestore = useCallback(async (id: string) => {
    try {
      await truenasApi.call('alert.restore', [id])
      reopenAlert(id)
    } catch (err) {
      console.error('Failed to restore alert:', err)
    }
  }, [reopenAlert])

  const handleDismissAll = useCallback(async () => {
    const alertIds = showDismissed ? [] : filteredAlerts.map(a => a.id)
    if (alertIds.length === 0) return
    try {
      await Promise.all(alertIds.map(id => truenasApi.call('alert.dismiss', [id])))
      dismissAllAlerts(alertIds)
    } catch (err) {
      console.error('Failed to dismiss alerts:', err)
    }
  }, [showDismissed, filteredAlerts, dismissAllAlerts])

  const handleRestoreAll = useCallback(async () => {
    const alertIds = showDismissed ? filteredAlerts.map(a => a.id) : []
    if (alertIds.length === 0) return
    try {
      await Promise.all(alertIds.map(id => truenasApi.call('alert.restore', [id])))
      reopenAllAlerts(alertIds)
    } catch (err) {
      console.error('Failed to restore alerts:', err)
    }
  }, [showDismissed, filteredAlerts, reopenAllAlerts])

  const handleFilterChange = useCallback((filter: SeverityFilter) => {
    setSeverityFilter(filter)
  }, [])

  const handleShowDismissedChange = useCallback((show: boolean) => {
    setShowDismissed(show)
  }, [])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
      }}
    >
      <NotificationsHeader
        alertCounts={alertCounts}
        severityFilter={severityFilter}
        showDismissed={showDismissed}
        onRefresh={fetchAlerts}
        onFilterChange={handleFilterChange}
        onShowDismissedChange={handleShowDismissedChange}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {isLoading && filteredAlerts.length === 0 ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={fetchAlerts} />
        ) : filteredAlerts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filteredAlerts.map(alert => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onRestore={handleRestore}
              />
            ))}
            {filteredAlerts.length > 0 && (
              <BatchActions
                showDismissed={showDismissed}
                onDismissAll={handleDismissAll}
                onRestoreAll={handleRestoreAll}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
