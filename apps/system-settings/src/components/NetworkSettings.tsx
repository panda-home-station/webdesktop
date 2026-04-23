/**
 * Network Settings Component
 * Main container for network settings page
 */

import { useState, useCallback } from 'react'
import { PendingChangesBanner } from './network/PendingChangesBanner'
import { InterfacesCard } from './network/InterfacesCard'
import { NetworkConfigurationCard } from './network/NetworkConfigurationCard'
import { StaticRoutesCard } from './network/StaticRoutesCard'
import { IpmiCard } from './network/IpmiCard'

interface NetworkSettingsProps {
  // Props for future extension if needed
  [key: string]: unknown
}

export function NetworkSettings(_props: NetworkSettingsProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div>
      <PendingChangesBanner onRefresh={handleRefresh} key={`pending-${refreshKey}`} />
      <InterfacesCard onRefresh={handleRefresh} key={`interfaces-${refreshKey}`} />
      <NetworkConfigurationCard onRefresh={handleRefresh} key={`config-${refreshKey}`} />
      <StaticRoutesCard onRefresh={handleRefresh} key={`routes-${refreshKey}`} />
      <IpmiCard onRefresh={handleRefresh} key={`ipmi-${refreshKey}`} />
    </div>
  )
}