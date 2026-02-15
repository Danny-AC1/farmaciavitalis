
import { db } from './firebase';
// @ts-ignore
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, where, updateDoc, increment } from 'firebase/firestore';
import { Order } from '../types';
import { cleanData } from './db.utils';

const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';

export const streamOrders = (callback: (orders: Order[]) => void) => {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(orders);
  });
};

export const getOrdersByUserDB = (userId: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(orders);
    }, () => callback([]));
};

export const addOrderDB = async (order: Order) => {
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  const cleanedOrder = cleanData(order);
  await setDoc(orderRef, cleanedOrder);
  if (order.userId && order.pointsRedeemed && order.pointsRedeemed > 0) {
      const userRef = doc(db, USERS_COLLECTION, order.userId);
      await updateDoc(userRef, { points: increment(-order.pointsRedeemed) });
  }
  if (order.userId && order.status === 'DELIVERED') {
      const pointsEarned = Math.floor(order.subtotal);
      if (pointsEarned > 0) {
          const userRef = doc(db, USERS_COLLECTION, order.userId);
          await updateDoc(userRef, { points: increment(pointsEarned) });
      }
  }
};

export const deleteOrderDB = async (id: string) => {
  await deleteDoc(doc(db, ORDERS_COLLECTION, id));
};

export const updateOrderStatusDB = async (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order?: Order) => {
  const orderRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(orderRef, { status });
  if (status === 'DELIVERED' && order && order.userId) {
      const pointsEarned = Math.floor(order.subtotal);
      if (pointsEarned > 0) {
        const userRef = doc(db, USERS_COLLECTION, order.userId);
        await updateDoc(userRef, { points: increment(pointsEarned) });
      }
  }
};

export const updateOrderLocationDB = async (orderId: string, lat: number, lng: number) => {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
        driverLocation: { lat, lng }
    });
};
