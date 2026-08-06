import { Order } from '../types';
import { addOrderDB } from './db.orders';

export interface OfflinePOSSale {
  id: string;
  order: Order;
  createdAt: number;
  synced: boolean;
  error?: string;
}

const STORAGE_KEY = 'vitalis_pos_offline_sales_v1';

// Get all offline sales from localStorage
export const getOfflineSales = (): OfflinePOSSale[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading offline POS sales from storage:', err);
    return [];
  }
};

// Get only unsynced sales
export const getPendingOfflineSales = (): OfflinePOSSale[] => {
  return getOfflineSales().filter(sale => !sale.synced);
};

// Save a sale to offline storage queue
export const saveOfflineSale = (order: Order): OfflinePOSSale => {
  const current = getOfflineSales();
  const newSale: OfflinePOSSale = {
    id: order.id || `POS-OFFLINE-${Date.now()}`,
    order: {
      ...order,
      isOfflineSale: true,
      notes: (order.notes || '') + ' [Venta registrada en Modo Offline POS]'
    },
    createdAt: Date.now(),
    synced: false
  };

  const updated = [newSale, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving sale to offline storage:', err);
  }
  return newSale;
};

// Mark a sale as synced
export const markOfflineSaleSynced = (saleId: string) => {
  const sales = getOfflineSales();
  const updated = sales.map(s => s.id === saleId ? { ...s, synced: true } : s);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error updating offline sale sync status:', err);
  }
};

// Remove a sale from offline queue
export const removeOfflineSale = (saleId: string) => {
  const sales = getOfflineSales();
  const updated = sales.filter(s => s.id !== saleId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error removing offline sale:', err);
  }
};

// Synchronize all pending offline sales to Cloud Firestore
export const syncPendingOfflineSales = async (): Promise<{ syncedCount: number; errors: number }> => {
  if (!navigator.onLine) {
    return { syncedCount: 0, errors: 0 };
  }

  const pending = getPendingOfflineSales();
  if (pending.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errors = 0;

  for (const item of pending) {
    try {
      await addOrderDB(item.order);
      markOfflineSaleSynced(item.id);
      syncedCount++;
    } catch (err) {
      console.error(`Error syncing offline POS order ${item.id}:`, err);
      errors++;
    }
  }

  // Clean up old synced records after 24h
  cleanOldSyncedSales();

  return { syncedCount, errors };
};

// Clean up synced sales
export const cleanOldSyncedSales = () => {
  const sales = getOfflineSales();
  const filtered = sales.filter(s => !s.synced);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error cleaning synced sales:', err);
  }
};

// Hook/Listener to auto-sync when connection comes back
export const subscribeOfflineSync = (
  onStatusChange: (isOnline: boolean, pendingCount: number) => void
) => {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = async () => {
    onStatusChange(true, getPendingOfflineSales().length);
    const result = await syncPendingOfflineSales();
    onStatusChange(true, getPendingOfflineSales().length);
    if (result.syncedCount > 0) {
      console.log(`✅ Sincronización POS offline exitosa: ${result.syncedCount} ventas procesadas en Firestore.`);
    }
  };

  const handleOffline = () => {
    onStatusChange(false, getPendingOfflineSales().length);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial call
  onStatusChange(navigator.onLine, getPendingOfflineSales().length);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
