
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';
import { Product, Category } from '../types';
import { cleanData } from './db.utils';
import { sendNotificationToAll } from './db.notifications';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

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
  
  // Notificar a todos los usuarios sobre el nuevo producto
  await sendNotificationToAll({
    title: '¡Nuevo Producto!',
    message: `Hemos añadido "${product.name}" a nuestro catálogo. ¡Ven a descubrirlo!`,
    type: 'SYSTEM',
    link: `/product/${docRef.id}`
  });

  return { id: docRef.id, ...data };
};

export const updateProductDB = async (product: Product) => {
  const productRef = doc(firestore, PRODUCTS_COLLECTION, product.id);
  
  // Opcional: Podríamos verificar si el stock pasó de 0 a >0 aquí también
  
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
    
    // Notificar si volvió a tener stock
    if (newStock > 0 && oldData.stock === 0) {
      await sendNotificationToAll({
        title: '¡Producto de nuevo en Stock!',
        message: `"${oldData.name}" ya está disponible nuevamente en Farmacia Vitalis.`,
        type: 'STOCK_ALERT',
        link: `/product/${id}`
      });
    }

    // Notificar si el stock cayó a un nivel bajo (alerta de stock para la gestión)
    const minStock = oldData.minStock || 5;
    if (newStock <= minStock && newStock > 0 && oldData.stock > minStock) {
      await sendNotificationToAll({
        title: '⚠️ Alerta de Stock Bajo',
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
