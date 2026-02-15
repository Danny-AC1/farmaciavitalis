
import { db } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Product, Category } from '../types';
import { cleanData } from './db.utils';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

export const streamProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        callback(products);
  }, () => callback([]));
};

export const addProductDB = async (product: Product) => {
  const { id, ...data } = product;
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), cleanData(data));
  return { id: docRef.id, ...data };
};

export const updateProductDB = async (product: Product) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
  const { id, ...data } = product;
  await updateDoc(productRef, cleanData(data));
};

export const deleteProductDB = async (id: string) => {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
};

export const updateStockDB = async (id: string, newStock: number) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(productRef, { stock: newStock });
};

export const streamCategories = (callback: (categories: Category[]) => void) => {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        callback(categories);
  });
};

export const addCategoryDB = async (category: Category) => {
  const { id, ...data } = category;
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), cleanData(data));
  return { id: docRef.id, ...data };
};

export const deleteCategoryDB = async (id: string) => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
};
