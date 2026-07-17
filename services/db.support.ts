import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { firestore } from './firebase';
import { User } from '../types';

export interface SupportChat {
  id: string; // userId
  userId: string;
  userDisplayName: string;
  userEmail: string;
  lastMessageText: string;
  lastMessageTime: any; // Timestamp o Date string
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  updatedAt: any;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderRole: 'USER' | 'ADMIN';
  senderName: string;
  text: string;
  timestamp: any;
  read: boolean;
}

const SUPPORT_CHATS_COLLECTION = 'support_chats';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path
  };
  console.error('Firestore Support Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Escucha en tiempo real todos los chats activos para los administradores y cajeros
 */
export const streamAdminChats = (callback: (chats: SupportChat[]) => void) => {
  const q = query(
    collection(firestore, SUPPORT_CHATS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as SupportChat[];
    callback(chats);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, SUPPORT_CHATS_COLLECTION);
  });
};

/**
 * Escucha en tiempo real los mensajes de un chat específico
 */
export const streamChatMessages = (userId: string, callback: (messages: SupportMessage[]) => void) => {
  const messagesPath = `${SUPPORT_CHATS_COLLECTION}/${userId}/messages`;
  const q = query(
    collection(firestore, messagesPath),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as SupportMessage[];
    callback(messages);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, messagesPath);
  });
};

/**
 * Envía un mensaje en calidad de Cliente
 */
export const sendMessageAsUser = async (userId: string, user: User, text: string) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  const messagesCollectionRef = collection(firestore, SUPPORT_CHATS_COLLECTION, userId, 'messages');
  const now = Timestamp.now();

  try {
    await setDoc(chatRef, {
      id: userId,
      userId,
      userDisplayName: user.displayName || user.email || 'Cliente',
      userEmail: user.email || '',
      lastMessageText: text,
      lastMessageTime: now,
      unreadByAdmin: true,
      unreadByUser: false,
      updatedAt: now,
    }, { merge: true });

    await addDoc(messagesCollectionRef, {
      senderId: userId,
      senderRole: 'USER',
      senderName: user.displayName || 'Cliente',
      text,
      timestamp: now,
      read: false,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SUPPORT_CHATS_COLLECTION}/${userId}`);
  }
};

/**
 * Envía un mensaje en calidad de Administrador / Farmacéutico
 */
export const sendMessageAsAdmin = async (userId: string, admin: User, text: string) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  const messagesCollectionRef = collection(firestore, SUPPORT_CHATS_COLLECTION, userId, 'messages');
  const now = Timestamp.now();

  try {
    await setDoc(chatRef, {
      lastMessageText: text,
      lastMessageTime: now,
      unreadByAdmin: false,
      unreadByUser: true,
      updatedAt: now,
    }, { merge: true });

    await addDoc(messagesCollectionRef, {
      senderId: admin.uid,
      senderRole: 'ADMIN',
      senderName: admin.displayName || 'Administrador',
      text,
      timestamp: now,
      read: false,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SUPPORT_CHATS_COLLECTION}/${userId}`);
  }
};

/**
 * Marca el chat como leído por el administrador
 */
export const markChatAsReadByAdmin = async (userId: string) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  try {
    await updateDoc(chatRef, {
      unreadByAdmin: false,
    });
  } catch (error) {
    console.warn("Could not mark chat as read by admin:", error);
  }
};

/**
 * Marca el chat como leído por el usuario/cliente
 */
export const markChatAsReadByUser = async (userId: string) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  try {
    await updateDoc(chatRef, {
      unreadByUser: false,
    });
  } catch (error) {
    console.warn("Could not mark chat as read by user:", error);
  }
};