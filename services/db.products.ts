
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc, where, getDocs } from 'firebase/firestore';
import { Product, Category } from '../types';
import { cleanData } from './db.utils';
import { sendNotification, sendNotificationToAdmins } from './db.notifications';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const STOCK_ALERTS_COLLECTION = 'stock_alerts';
const USERS_COLLECTION = 'users';

export const streamProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(firestore, PRODUCTS_COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        callback(products);
  }, () => callback([]));
};

export const addProductDB = async (product: Product) => {
  const { id, ...data } = product;
  const docRef = await addDoc(collection(firestore, PRODUCTS_COLLECTION), cleanData(data));
  // No enviamos notificación masiva por producto nuevo para no molestar a los usuarios
  return { id: docRef.id, ...data };
};

export const updateProductDB = async (product: Product) => {
  const productRef = doc(firestore, PRODUCTS_COLLECTION, product.id);
  
  const { id, ...data } = product;
  await updateDoc(productRef, cleanData(data));
};

export const deleteProductDB = async (id: string) => {
  await deleteDoc(doc(firestore, PRODUCTS_COLLECTION, id));
};

export const updateStockDB = async (id: string, newStock: number) => {
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
              // Buscar si existe un usuario registrado con este correo
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
