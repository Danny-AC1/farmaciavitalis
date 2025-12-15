import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { Product, Order, Category } from '../types';

// Nombres de las colecciones en Firebase
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const ORDERS_COLLECTION = 'orders';

// --- PRODUCTS ---

export const streamProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  
  // onSnapshot escucha cambios en tiempo real
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  });
};

export const addProductDB = async (product: Product) => {
  // Eliminamos el ID si viene vacío para que Firebase genere uno
  const { id, ...data } = product;
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), data);
  return { id: docRef.id, ...data };
};

export const updateProductDB = async (product: Product) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
  const { id, ...data } = product;
  await updateDoc(productRef, data);
};

export const deleteProductDB = async (id: string) => {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
};

export const updateStockDB = async (id: string, newStock: number) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(productRef, { stock: newStock });
};

// --- CATEGORIES ---

export const streamCategories = (callback: (categories: Category[]) => void) => {
  const q = query(collection(db, CATEGORIES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
    callback(categories);
  });
};

export const addCategoryDB = async (category: Category) => {
  const { id, ...data } = category;
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), data);
  return { id: docRef.id, ...data };
};

export const deleteCategoryDB = async (id: string) => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
};

// --- ORDERS ---

export const streamOrders = (callback: (orders: Order[]) => void) => {
  // USAMOS orderBy AQUÍ: Ordenamos por fecha descendente directamente en la consulta a Firebase
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      // Si el documento tiene un campo 'id' interno (ej. ORD-XXX), lo usamos.
      // Si no, usamos el ID del documento de Firebase.
      return {
        id: doc.id, 
        ...data
      };
    }) as Order[];
    
    callback(orders);
  });
};

export const addOrderDB = async (order: Order) => {
  const { ...data } = order; 
  await addDoc(collection(db, ORDERS_COLLECTION), data);
};

export const updateOrderStatusDB = async (id: string, status: 'DELIVERED') => {
  try {
      // 1. Intentar asumiendo que id es el DocID
      const orderRef = doc(db, ORDERS_COLLECTION, id);
      await updateDoc(orderRef, { status });
  } catch (e) {
      // 2. Si falla (o no existe), buscar por el campo 'id' dentro de la data
      const q = query(collection(db, ORDERS_COLLECTION));
      const snapshot = await getDocs(q);
      const docFound = snapshot.docs.find(d => d.data().id === id);
      if (docFound) {
          await updateDoc(doc(db, ORDERS_COLLECTION, docFound.id), { status });
      } else {
          console.error("No se encontró el pedido para actualizar:", id);
      }
  }
};

// --- SEEDING (Datos Iniciales) ---

export const seedInitialData = async () => {
  // Función vacía: Ya no generamos datos de prueba automáticamente.
  // El usuario debe crear sus propios productos desde el Panel Admin.
  console.log("Sistema inicializado. Sin datos de prueba.");
};