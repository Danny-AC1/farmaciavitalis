
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, where, updateDoc, increment } from 'firebase/firestore';
import { Order } from '../types';
import { cleanData } from './db.utils';
import { sendNotification } from './db.notifications';

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

      // Enviar notificación de pedido recibido
      await sendNotification({
        userId: order.userId,
        title: '¡Pedido Recibido!',
        message: `Tu pedido #${order.id.slice(-6)} ha sido recibido con éxito.`,
        type: 'ORDER_UPDATE'
      });
  }
};

export const deleteOrderDB = async (id: string) => {
  await deleteDoc(doc(firestore, ORDERS_COLLECTION, id));
};

export const updateOrderStatusDB = async (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order?: Order) => {
  const orderRef = doc(firestore, ORDERS_COLLECTION, id);
  // Solo actualizamos el estado. Los puntos ya se gestionaron en addOrderDB para ser inmediatos.
  await updateDoc(orderRef, { status });

  if (order?.userId) {
    const statusText = status === 'IN_TRANSIT' ? 'está en camino' : 'ha sido entregado';
    await sendNotification({
      userId: order.userId,
      title: 'Actualización de Pedido',
      message: `Tu pedido #${id.slice(-6)} ${statusText}.`,
      type: 'ORDER_UPDATE'
    });
  }
};

export const updateOrderLocationDB = async (orderId: string, lat: number, lng: number) => {
    const orderRef = doc(firestore, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
        driverLocation: { lat, lng }
    });
};
