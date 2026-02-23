import { 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    orderBy, 
    updateDoc, 
    doc, 
    deleteDoc,
    Timestamp,
    getDocs,
    limit
  } from 'firebase/firestore';
  import { firestore as db } from './firebase';
  import { Notification } from '../notificationTypes';
  
  const NOTIFICATIONS_COLLECTION = 'notifications';
  
  export const sendNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...notification,
        read: false,
        createdAt: Timestamp.now().toDate().toISOString()
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };
  
  export const streamNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    });
  };
  
  export const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  export const markAllAsRead = async (userId: string) => {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(d => updateDoc(doc(db, NOTIFICATIONS_COLLECTION, d.id), { read: true }));
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };
  
  export const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };
  
  export const sendNotificationToAll = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'>) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const promises = usersSnapshot.docs.map(userDoc => 
        addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
          ...notification,
          userId: userDoc.id,
          read: false,
          createdAt: Timestamp.now().toDate().toISOString()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error sending notification to all users:", error);
    }
  };
  