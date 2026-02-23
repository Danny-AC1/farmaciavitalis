
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, where, updateDoc, increment } from 'firebase/firestore';
import { Order } from '../types';
import { cleanData } from './db.utils';

const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';

export const streamOrders = (callback: (orders: Order[]) => void) => {
  const q = query(collection(firestore, ORDERS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(orders);
  });
};

export const getOrdersByUserDB = (userId: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(firestore, ORDERS_COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        callback(orders);
    }, () => callback([]));
};

export const addOrderDB = async (order: Order) => {
  const orderRef = doc(firestore, ORDERS_COLLECTION, order.id);
  const cleanedOrder = cleanData(order);
  await setDoc(orderRef, cleanedOrder);

  // ACTUALIZACIÓN INMEDIATA DE PUNTOS AL CREAR LA ORDEN
  if (order.userId) {
      const pointsEarned = Math.floor(order.subtotal);
      const pointsRedeemed = order.pointsRedeemed || 0;
      const netChange = pointsEarned - pointsRedeemed;
      
      if (netChange !== 0) {
          const userRef = doc(firestore, USERS_COLLECTION, order.userId);
          await updateDoc(userRef, { points: increment(netChange) });
      }
  }
};

export const deleteOrderDB = async (id: string) => {
  await deleteDoc(doc(firestore, ORDERS_COLLECTION, id));
};

export const updateOrderStatusDB = async (id: string, status: 'IN_TRANSIT' | 'DELIVERED', _order?: Order) => {
  const orderRef = doc(firestore, ORDERS_COLLECTION, id);
  // Solo actualizamos el estado. Los puntos ya se gestionaron en addOrderDB para ser inmediatos.
  await updateDoc(orderRef, { status });
};

export const updateOrderLocationDB = async (orderId: string, lat: number, lng: number) => {
    const orderRef = doc(firestore, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
        driverLocation: { lat, lng }
    });
};
