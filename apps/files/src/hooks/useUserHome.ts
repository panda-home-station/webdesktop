/**
 * useUserHome Hook
 * Hook for getting current user's home directory information
 */

import { useState, useEffect, useCallback } from 'react';
import { truenasApi } from '@truenas/api';
import { poolService } from '@truenas/services/pool';
import { filesystemService } from '@truenas/services/filesystem';
import { UserHomeInfo } from '../types/file-manager';

const DEFAULT_HOME_PATH = '/var/empty';
const ADMIN_UID = 950;

export function useUserHome() {
  const [userHome, setUserHome] = useState<UserHomeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if home directory exists and is accessible via filesystem API
   */
  const checkHomeAccessible = useCallback(async (homePath: string): Promise<boolean> => {
    // /var/empty is never accessible
    if (homePath === DEFAULT_HOME_PATH) {
      return false;
    }

    // /home/xxx paths are not accessible via filesystem API
    if (homePath.startsWith('/home/')) {
      return false;
    }

    // /mnt/ paths - check if exists
    try {
      await filesystemService.stat(homePath);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Create home directory for user on pool
   */
  const createHomeDirectory = useCallback(async (
    username: string,
    uid: number,
    gid: number
  ): Promise<string | null> => {
    try {
      const pools = await poolService.query([], { extra: { is_upgraded: true } });

      if (pools.length === 0) {
        console.error('[useUserHome] No pools available to create home directory');
        return null;
      }

      // Use the first pool (or a pool named 'data' if exists)
      const pool = pools.find(p => p.name === 'data') || pools[0];
      const homePath = `/mnt/${pool.name}/home/${username}`;

      // Create home directory
      await filesystemService.mkdir(homePath, '755');

      // Set ownership to user
      await filesystemService.chown(homePath, { uid, gid });

      return homePath;
    } catch (err) {
      console.error('[useUserHome] Failed to create home directory:', err);
      return null;
    }
  }, []);

  /**
   * Fetch user home information
   */
  const fetchUserHome = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await truenasApi.call('auth.me') as {
        uid: number;
        gid: number;
        username: string;
        home: string;
        shell: string;
      };

      // Check if user is administrator
      const isAdmin = user.uid === ADMIN_UID;

      // For admin users, home directory is not used via filesystem API
      // Return the pw_dir but mark as not accessible
      if (isAdmin) {
        setUserHome({
          uid: user.uid,
          gid: user.gid,
          username: user.username,
          home: user.home,
          homeAccessible: false, // Admin home is /home/xxx, not accessible via API
          isAdmin: true,
        });
        setIsLoading(false);
        return;
      }

      // For regular users, check if home is accessible
      let homePath = user.home;
      let homeAccessible = await checkHomeAccessible(homePath);

      // If home is not accessible, try to create it
      if (!homeAccessible && homePath !== DEFAULT_HOME_PATH) {
        // Home is /home/xxx but doesn't exist or not accessible
        // Try to create home on pool
        setIsCreating(true);
        const newHome = await createHomeDirectory(user.username, user.uid, user.gid);
        setIsCreating(false);

        if (newHome) {
          homePath = newHome;
          homeAccessible = true;
        }
      }

      setUserHome({
        uid: user.uid,
        gid: user.gid,
        username: user.username,
        home: homePath,
        homeAccessible,
        isAdmin: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取用户信息失败';
      setError(message);
      console.error('[useUserHome] Failed to fetch user home:', err);
    } finally {
      setIsLoading(false);
    }
  }, [checkHomeAccessible, createHomeDirectory]);

  useEffect(() => {
    fetchUserHome();
  }, [fetchUserHome]);

  return {
    userHome,
    isLoading,
    isCreating,
    error,
    refresh: fetchUserHome,
  };
}
