
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, where, getDocs } from 'firebase/firestore';
import { Product, Category } from '../types';
import { cleanData } from './db.utils';
import { sendNotification, sendNotificationToAdmins, sendNotificationToAll } from './db.notifications';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const STOCK_ALERTS_COLLECTION = 'stock_alerts';
const USERS_COLLECTION = 'users';

export const streamProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(firestore, PRODUCTS_COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      // Si Firestore está vacío, intentar recuperar desde caché local o guardar semillas
      const cached = localStorage.getItem('vitalis_cache_products') || localStorage.getItem('vitales_products_v2');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            callback(parsed);
            return;
          }
        } catch (e) {}
      }
    }
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    if (products.length > 0) {
      try {
        localStorage.setItem('vitalis_cache_products', JSON.stringify(products));
        localStorage.setItem('vitales_products_v2', JSON.stringify(products));
      } catch (e) {}
    }
    callback(products);
  }, (err) => {
    console.warn("Error en streamProducts de Firestore, usando respaldo local:", err);
    const cached = localStorage.getItem('vitalis_cache_products') || localStorage.getItem('vitales_products_v2');
    if (cached) {
      try {
        callback(JSON.parse(cached));
        return;
      } catch (e) {}
    }
    callback([]);
  });
};

export const addProductDB = async (product: Product) => {
  const { id, ...data } = product;
  let finalId = id || `prod_${Date.now()}`;
  try {
    const docRef = await addDoc(collection(firestore, PRODUCTS_COLLECTION), cleanData(data));
    finalId = docRef.id;
  } catch (err) {
    console.warn("Error guardando producto en Firestore, resguardando en local:", err);
  }

  const savedProduct = { id: finalId, ...data };

  // Respaldo inmediato e incondicional en localStorage
  try {
    const cached = localStorage.getItem('vitalis_cache_products') || localStorage.getItem('vitales_products_v2');
    const list: Product[] = cached ? JSON.parse(cached) : [];
    const updated = [savedProduct, ...list.filter(p => p.id !== finalId)];
    localStorage.setItem('vitalis_cache_products', JSON.stringify(updated));
    localStorage.setItem('vitales_products_v2', JSON.stringify(updated));
  } catch (e) {
    console.error("Error guardando en localStorage:", e);
  }
  
  // Notificación masiva de producto nuevo
  try {
    await sendNotificationToAll({
      title: '✨ ¡Nuevo producto registrado!',
      message: `Se ha añadido "${data.name}" a nuestro catálogo de Farmacia Vitalis. ¡Echa un vistazo!`,
      type: 'NEW_PRODUCT',
      link: `/product/${finalId}`
    });
  } catch (err) {
    console.error("Error al notificar nuevo producto:", err);
  }

  return savedProduct;
};

export const updateProductDB = async (product: Product) => {
  const { id, ...data } = product;
  try {
    const productRef = doc(firestore, PRODUCTS_COLLECTION, product.id);
    await updateDoc(productRef, cleanData(data));
  } catch (err) {
    console.warn("Error actualizando producto en Firestore, resguardando en local:", err);
  }

  // Respaldo inmediato en localStorage
  try {
    const cached = localStorage.getItem('vitalis_cache_products') || localStorage.getItem('vitales_products_v2');
    if (cached) {
      const list: Product[] = JSON.parse(cached);
      const updated = list.map(p => p.id === product.id ? product : p);
      localStorage.setItem('vitalis_cache_products', JSON.stringify(updated));
      localStorage.setItem('vitales_products_v2', JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Error actualizando localStorage:", e);
  }
};

export const deleteProductDB = async (id: string) => {
  try {
    await deleteDoc(doc(firestore, PRODUCTS_COLLECTION, id));
  } catch (err) {
    console.warn("Error eliminando producto en Firestore, resguardando en local:", err);
  }

  // Respaldo inmediato en localStorage
  try {
    const cached = localStorage.getItem('vitalis_cache_products') || localStorage.getItem('vitales_products_v2');
    if (cached) {
      const list: Product[] = JSON.parse(cached);
      const updated = list.filter(p => p.id !== id);
      localStorage.setItem('vitalis_cache_products', JSON.stringify(updated));
      localStorage.setItem('vitales_products_v2', JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Error al eliminar de localStorage:", e);
  }
};

export const updateStockDB = async (id: string, newStock: number) => {
  try {
    const productRef = doc(firestore, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(productRef);
    if (snap.exists()) {
      const oldData = snap.data();
      
      // Notificar ÚNICAMENTE a las personas que se suscribieron con su correo ("Avísame cuando hay stock")
      if (newStock > 0 && oldData.stock === 0) {
        try {
          const qAlerts = query(
            collection(firestore, STOCK_ALERTS_COLLECTION),
            where('productId', '==', id)
          );
          const alertsSnap = await getDocs(qAlerts);
          
          if (!alertsSnap.empty) {
            const notifiedUserIds = new Set<string>();

            for (const alertDoc of alertsSnap.docs) {
              const alertData = alertDoc.data();
              const email = alertData.email;

              if (email) {
                const qUsers = query(
                  collection(firestore, USERS_COLLECTION),
                  where('email', '==', email.toLowerCase().trim())
                );
                const usersSnap = await getDocs(qUsers);

                for (const uDoc of usersSnap.docs) {
                  if (!notifiedUserIds.has(uDoc.id)) {
                    notifiedUserIds.add(uDoc.id);
                    await sendNotification({
                      userId: uDoc.id,
                      title: '¡Producto de nuevo en Stock! 💊',
                      message: `El producto "${oldData.name}" que solicitaste ya está disponible en Farmacia Vitalis.`,
                      type: 'STOCK_ALERT',
                      link: `/product/${id}`
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Error al enviar notificaciones de alerta de stock:", err);
        }
      }

      // Notificar ÚNICAMENTE a los ADMINISTRADORES si el stock cayó a un nivel bajo
      const minStock = oldData.minStock || 5;
      if (newStock <= minStock && newStock > 0 && oldData.stock > minStock) {
        await sendNotificationToAdmins({
          title: '⚠️ Alerta de Stock Bajo (Inventario)',
          message: `El producto "${oldData.name}" tiene solo ${newStock} unidades disponibles. Por favor reabastecer.`,
          type: 'STOCK_ALERT'
        });
      }
    }

    await updateDoc(productRef, { stock: newStock });
  } catch (err) {
    console.warn("Error actualizando stock en Firestore, respaldando en local:", err);
  }

  // Actualizar copia local
  try {
    const cached = localStorage.getItem('vitalis_cache_products') || localStorage.getItem('vitales_products_v2');
    if (cached) {
      const list: Product[] = JSON.parse(cached);
      const updated = list.map(p => p.id === id ? { ...p, stock: newStock } : p);
      localStorage.setItem('vitalis_cache_products', JSON.stringify(updated));
      localStorage.setItem('vitales_products_v2', JSON.stringify(updated));
    }
  } catch (e) {}
};

export const streamCategories = (callback: (categories: Category[]) => void) => {
  const q = query(collection(firestore, CATEGORIES_COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        callback(categories);
  });
};

export const addCategoryDB = async (category: Category) => {
  const { id, ...data } = category;
  const docRef = await addDoc(collection(firestore, CATEGORIES_COLLECTION), cleanData(data));
  return { id: docRef.id, ...data };
};

export const deleteCategoryDB = async (id: string) => {
  await deleteDoc(doc(firestore, CATEGORIES_COLLECTION, id));
};
