/**
 * Offline Storage Engine using IndexedDB & LocalStorage
 * Stores full catalogs, orders, customers, transactions and changes locally
 * for instantaneous 100% offline availability.
 */

const DB_NAME = 'vitalis_offline_db';
const DB_VERSION = 2;

export interface OfflineSyncQueueItem {
  id: string;
  type: 'ORDER' | 'PRODUCT_STOCK' | 'PRODUCT_MUTATION' | 'CREDIT' | 'USER_UPDATE' | 'EXPENSE';
  payload: any;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: number;
  retries: number;
}

let dbInstance: IDBDatabase | null = null;

// Open or initialize IndexedDB
export const openOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store collections
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'uid' });
      }
      if (!db.objectStoreNames.contains('credits')) {
        db.createObjectStore('credits', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });
};

// Generic Put in Object Store with LocalStorage fallback
export const saveOfflineItem = async <T extends { id?: string; uid?: string }>(
  storeName: 'products' | 'orders' | 'syncQueue' | 'cache' | 'customers' | 'credits',
  item: T,
  keyOverride?: string
): Promise<void> => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = storeName === 'cache' && keyOverride 
        ? store.put({ key: keyOverride, value: item }) 
        : store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback to LocalStorage
    try {
      const storageKey = `vitalis_fallback_${storeName}`;
      const existingRaw = localStorage.getItem(storageKey);
      const list = existingRaw ? JSON.parse(existingRaw) : {};
      const key = keyOverride || item.id || item.uid || `item_${Date.now()}`;
      list[key] = item;
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (lsErr) {
      console.error(`Error saving ${storeName} in offline storage:`, lsErr);
    }
  }
};

// Bulk save items into store
export const saveOfflineBulk = async <T extends { id?: string; uid?: string }>(
  storeName: 'products' | 'orders' | 'customers' | 'credits',
  items: T[]
): Promise<void> => {
  if (!items || items.length === 0) return;
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      items.forEach(item => {
        store.put(item);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // Fallback
    try {
      localStorage.setItem(`vitalis_cache_${storeName}`, JSON.stringify(items));
    } catch (e) {}
  }
};

// Get All Items from Object Store
export const getAllOfflineItems = async <T>(
  storeName: 'products' | 'orders' | 'syncQueue' | 'customers' | 'credits'
): Promise<T[]> => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    try {
      const raw = localStorage.getItem(`vitalis_cache_${storeName}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
};

// Delete item from store
export const deleteOfflineItem = async (
  storeName: 'products' | 'orders' | 'syncQueue' | 'customers' | 'credits',
  key: string
): Promise<void> => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Error deleting from ${storeName}:`, err);
  }
};

/**
 * Precarga automática del catálogo completo en memoria local (IndexedDB + LocalStorage)
 */
export const precacheFullCatalog = async (products: any[]): Promise<void> => {
  if (!products || products.length === 0) return;
  try {
    await saveOfflineBulk('products', products);
    localStorage.setItem('vitalis_cache_products', JSON.stringify(products));
    localStorage.setItem('vitalis_catalog_cached_at', String(Date.now()));
    localStorage.setItem('vitalis_catalog_cached_count', String(products.length));
  } catch (e) {
    console.warn('[OfflineStorage] Error al precargar catálogo completo:', e);
  }
};

/**
 * Obtener catálogo completo desde caché local
 */
export const getOfflineCachedProducts = async (): Promise<any[]> => {
  try {
    const idbProducts = await getAllOfflineItems('products');
    if (idbProducts && idbProducts.length > 0) {
      return idbProducts;
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem('vitalis_cache_products') || localStorage.getItem('vitales_products_v2');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Actualizar stock localmente de inmediato en IndexedDB y memoria
 */
export const updateLocalProductStock = async (productId: string, unitsToSubtract: number): Promise<void> => {
  try {
    const products = await getOfflineCachedProducts();
    const updated = products.map(p => {
      if (p.id === productId) {
        return { ...p, stock: Math.max(0, (p.stock || 0) - unitsToSubtract) };
      }
      return p;
    });
    await precacheFullCatalog(updated);
  } catch (e) {
    console.warn('[OfflineStorage] Error al actualizar stock local:', e);
  }
};

/**
 * Generador de numeración secuencial de recibos offline
 * Genera números profesionales como: REC-OFF-0001, REC-OFF-0002...
 */
export const generateOfflineReceiptNumber = (): string => {
  try {
    const currentSeqRaw = localStorage.getItem('vitalis_offline_receipt_seq');
    let nextSeq = currentSeqRaw ? parseInt(currentSeqRaw, 10) + 1 : 1;
    if (isNaN(nextSeq) || nextSeq <= 0) nextSeq = 1;
    localStorage.setItem('vitalis_offline_receipt_seq', String(nextSeq));
    return `REC-OFF-${String(nextSeq).padStart(4, '0')}`;
  } catch {
    return `REC-OFF-${Date.now().toString().slice(-4)}`;
  }
};

