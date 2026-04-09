/**
 * Storage App
 * Main storage management application
 */

import { useEffect, useState } from 'react';
import StorageDashboard from './components/dashboard/StorageDashboard';
import PoolManagerWizard from './components/pool-manager/PoolManagerWizard';
import { truenasApi } from '@truenas/api';
import { subscribeOpenApp } from '@shared/sdk/desktop';

export default function Storage() {
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Initialize TrueNAS API
    truenasApi.init();

    // Subscribe to app open events
    const unsubscribe = subscribeOpenApp((appId, args) => {
      if (appId === 'storage' && args === 'create-pool') {
        setShowWizard(true);
      }
    });

    return unsubscribe;
  }, []);

  if (showWizard) {
    return <PoolManagerWizard />;
  }

  return <StorageDashboard />;
}
