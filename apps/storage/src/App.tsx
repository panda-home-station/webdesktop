/**
 * Storage App
 * Main storage management application
 */

import { useEffect } from 'react';
import StorageDashboard from './components/dashboard/StorageDashboard';
import { truenasApi } from '@truenas/api';

export default function Storage() {
  useEffect(() => {
    // Initialize TrueNAS API
    truenasApi.init();
  }, []);

  return <StorageDashboard />;
}
