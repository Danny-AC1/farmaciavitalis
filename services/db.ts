import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { Product, Order, Category } from '../types';

// Collections
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const ORDERS_COLLECTION = 'orders';

// --- Products ---

export const streamProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    callback(products);
  });
};

export const addProductDB = async (product: Product) => {
  // We use setDoc with product.id to keep control, or addDoc for auto-id
  // If the product has a temporary ID (like Date.now()), we might want to let Firestore generate one
  // But for simplicity with existing code, let's use the provided ID or generate a new one if it looks temp
  const docRef = doc(collection(db, PRODUCTS_COLLECTION));
  const newId = docRef.id;
  const productToSave = { ...product, id: newId };
  await setDoc(docRef, productToSave);
  return productToSave;
};

export const updateProductDB = async (product: Product) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
  await setDoc(productRef, product, { merge: true });
};

export const deleteProductDB = async (id: string) => {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
};

export const updateStockDB = async (id: string, newStock: number) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(productRef, { stock: newStock });
};

// --- Categories ---

export const streamCategories = (callback: (categories: Category[]) => void) => {
  const q = query(collection(db, CATEGORIES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    callback(categories);
  });
};

export const addCategoryDB = async (category: Category) => {
  const docRef = doc(collection(db, CATEGORIES_COLLECTION));
  const newCat = { ...category, id: docRef.id };
  await setDoc(docRef, newCat);
  return newCat;
};

export const deleteCategoryDB = async (id: string) => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
};

// --- Orders ---

export const streamOrders = (callback: (orders: Order[]) => void) => {
  // Order by date desc
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    callback(orders);
  });
};

export const addOrderDB = async (order: Order) => {
  // Ensure we use the order ID if provided, or generate one
  const docRef = doc(collection(db, ORDERS_COLLECTION), order.id);
  await setDoc(docRef, order);
};

export const updateOrderStatusDB = async (id: string, status: 'DELIVERED') => {
  const orderRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(orderRef, { status });
};

// --- Seeding (Run once if empty) ---
// Note: This logic moves from storage.ts to here, but only triggers if needed.
export const seedInitialData = async () => {
  const pSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
  if (!pSnap.empty) return;

  const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='%23f1f5f9'%3E%3Crect width='300' height='300' /%3E%3Cpath d='M150 100v100M100 150h100' stroke='%23cbd5e1' stroke-width='20' stroke-linecap='round'/%3E%3Ctext x='50%25' y='85%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ESin Imagen%3C/text%3E%3C/svg%3E";

  const initialCats = [
    { name: 'Medicamentos', image: PLACEHOLDER_IMG },
    { name: 'Vitaminas', image: PLACEHOLDER_IMG },
    { name: 'Primeros Auxilios', image: PLACEHOLDER_IMG },
    { name: 'Cuidado Personal', image: PLACEHOLDER_IMG }
  ];

  for (const cat of initialCats) {
    await addCategoryDB({ id: '', ...cat });
  }

  const initialProds = [
    { name: 'Paracetamol 500mg', description: 'Alivio efectivo para el dolor y la fiebre.', price: 0.10, category: 'Medicamentos', stock: 200, image: PLACEHOLDER_IMG, unitsPerBox: 20, boxPrice: 1.80 },
    { name: 'Vitamina C + Zinc', description: 'Refuerza tu sistema inmunológico.', price: 0.50, category: 'Vitaminas', stock: 50, image: PLACEHOLDER_IMG, unitsPerBox: 10, boxPrice: 4.50 },
    { name: 'Alcohol Antiséptico', description: 'Alcohol al 70% para desinfección.', price: 1.50, category: 'Primeros Auxilios', stock: 200, image: PLACEHOLDER_IMG }
  ];

  for (const prod of initialProds) {
    await addProductDB({ id: '', ...prod });
  }
};