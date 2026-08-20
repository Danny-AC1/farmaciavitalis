/**
 * Universal Sync Queue Engine
 * Records local operations while offline (orders, stock decreases, products mutations)
 * and processes them automatically when connectivity resumes.
 */

import { OfflineSyncQueueItem, saveOfflineItem, getAllOfflineItems, deleteOfflineItem } from './offlineStorage';
import { addOrderDB } from '../db.orders';
import { updateStockDB, addProductDB, updateProductDB, deleteProductDB } from '../db.products';
import { addCreditDB, updateCreditDB, deleteCreditDB } from '../db.credits';

const SYNC_QUEUE_STORE = 'syncQueue';
const LOCALSTORAGE_QUEUE_KEY = 'vitalis_universal_offline_queue';

// Add action to the synchronization queue
export const enqueueOfflineAction = async (
  type: OfflineSyncQueueItem['type'],
  action: OfflineSyncQueueItem['action'],
  payload: any
): Promise<OfflineSyncQueueItem> => {
  const item: OfflineSyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type,
    action,
    payload,
    timestamp: Date.now(),
    retries: 0
  };

  try {
    await saveOfflineItem(SYNC_QUEUE_STORE, item);
  } catch (e) {
    // Fallback
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_QUEUE_KEY);
      const queue: OfflineSyncQueueItem[] = raw ? JSON.parse(raw) : [];
      queue.push(item);
      localStorage.setItem(LOCALSTORAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch (lsErr) {}
  }

  console.log(`📥 [Offline Sync Queue] Acción encolada: ${type} (${action})`, item);
  return item;
};

// Retrieve all pending sync actions
export const getPendingSyncQueue = async (): Promise<OfflineSyncQueueItem[]> => {
  let items: OfflineSyncQueueItem[] = [];
  try {
    items = await getAllOfflineItems<OfflineSyncQueueItem>(SYNC_QUEUE_STORE);
  } catch (err) {
    items = [];
  }

  // Also merge any from localStorage fallback
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_QUEUE_KEY);
    if (raw) {
      const lsItems: OfflineSyncQueueItem[] = JSON.parse(raw);
      const existingIds = new Set(items.map(i => i.id));
      lsItems.forEach(i => {
        if (!existingIds.has(i.id)) {
          items.push(i);
        }
      });
    }
  } catch (e) {}

  return items.sort((a, b) => a.timestamp - b.timestamp);
};

// Process single item with Firestore
const processQueueItem = async (item: OfflineSyncQueueItem): Promise<boolean> => {
  try {
    switch (item.type) {
      case 'ORDER':
        if (item.action === 'CREATE') {
          await addOrderDB(item.payload);
        }
        break;

      case 'PRODUCT_STOCK':
        if (item.payload && item.payload.productId) {
          await updateStockDB(item.payload.productId, item.payload.newStock);
        }
        break;

      case 'PRODUCT_MUTATION':
        if (item.action === 'CREATE') {
          await addProductDB(item.payload);
        } else if (item.action === 'UPDATE') {
          await updateProductDB(item.payload);
        } else if (item.action === 'DELETE') {
          await deleteProductDB(item.payload.id);
        }
        break;

      case 'CREDIT':
        if (item.action === 'CREATE') {
          await addCreditDB(item.payload);
        } else if (item.action === 'UPDATE') {
          await updateCreditDB(item.payload);
        } else if (item.action === 'DELETE') {
          await deleteCreditDB(item.payload.id);
        }
        break;

      default:
        console.warn(`[Sync Queue] Tipo de acción no manejado:`, item.type);
        break;
    }
    return true;
  } catch (error) {
    console.error(`❌ [Sync Queue] Error procesando item ${item.id}:`, error);
    return false;
  }
};

// Run synchronization of all pending items
export const syncOfflineQueue = async (): Promise<{
  successCount: number;
  failedCount: number;
  totalPending: number;
}> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { successCount: 0, failedCount: 0, totalPending: (await getPendingSyncQueue()).length };
  }

  const queue = await getPendingSyncQueue();
  if (queue.length === 0) {
    return { successCount: 0, failedCount: 0, totalPending: 0 };
  }

  console.log(`🔄 [Offline Sync] Iniciando sincronización de ${queue.length} acciones pendientes...`);

  let successCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    const success = await processQueueItem(item);
    if (success) {
      // Remove from IDB
      await deleteOfflineItem(SYNC_QUEUE_STORE, item.id);
      
      // Remove from LocalStorage
      try {
        const raw = localStorage.getItem(LOCALSTORAGE_QUEUE_KEY);
        if (raw) {
          const lsItems: OfflineSyncQueueItem[] = JSON.parse(raw);
          const filtered = lsItems.filter(i => i.id !== item.id);
          localStorage.setItem(LOCALSTORAGE_QUEUE_KEY, JSON.stringify(filtered));
        }
      } catch (e) {}

      successCount++;
    } else {
      failedCount++;
    }
  }

  console.log(`✅ [Offline Sync] Sincronización completada: ${successCount} exitosas, ${failedCount} con error.`);

  return {
    successCount,
    failedCount,
    totalPending: (await getPendingSyncQueue()).length
  };
};
