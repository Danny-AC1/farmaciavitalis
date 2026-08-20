import { useEffect, useState, useCallback } from 'react';
import { getPendingSyncQueue, syncOfflineQueue } from '../services/offline/syncQueue';

export interface OfflineStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncNow: () => Promise<void>;
}

export const useOfflineSync = (): OfflineStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getPendingSyncQueue();
      setPendingSyncCount(items.length);
    } catch (e) {
      setPendingSyncCount(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueue();
      setPendingSyncCount(res.totalPending);
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Error durante sincronización manual:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = async () => {
      setIsOnline(true);
      await syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check and auto-sync attempt every 30 seconds if online
    const interval = setInterval(() => {
      refreshPendingCount();
      if (navigator.onLine && !isSyncing) {
        getPendingSyncQueue().then(queue => {
          if (queue.length > 0) {
            syncNow();
          }
        });
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshPendingCount, syncNow, isSyncing]);

  return {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncTime,
    syncNow
  };
};
