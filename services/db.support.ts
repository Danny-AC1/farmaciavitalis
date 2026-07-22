import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { firestore } from './firebase';
import { User } from '../types';

export interface SupportChat {
  id: string; // userId
  userId: string;
  userDisplayName: string;
  userEmail: string;
  lastMessageText: string;
  lastMessageTime: any; // Timestamp or Date string
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  updatedAt: any;
  userTyping?: boolean;
  adminTyping?: boolean;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderRole: 'USER' | 'ADMIN';
  senderName: string;
  text: string;
  timestamp: any;
  read: boolean;
  mediaUrl?: string;
  mediaType?: string;
  replyToId?: string;
  replyToText?: string;
  replyToSenderName?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> list of senderNames or senderIds
}

export interface ReplyToPayload {
  id: string;
  text: string;
  senderName: string;
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
      userId: null, // Filled when auth available
      email: null,
    },
    operationType,
    path
  };
  console.error('Firestore Support Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Streams all active support chats for administrators/cashiers
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
 * Streams the message history for a specific chat (by userId)
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

import { triggerNativeNotification } from './nativeNotificationService';
import { sendNotification } from './db.notifications';

/**
 * Sends a message from the customer/user
 */
export const sendMessageAsUser = async (
  userId: string, 
  user: User, 
  text: string, 
  mediaUrl?: string, 
  mediaType?: string,
  replyTo?: ReplyToPayload
) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  const messagesCollectionRef = collection(firestore, SUPPORT_CHATS_COLLECTION, userId, 'messages');
  const now = Timestamp.now();

  try {
    const lastText = mediaUrl ? (text || `[${mediaType === 'image' ? 'Imagen' : mediaType === 'audio' ? 'Mensaje de voz' : 'Archivo'}]`) : text;

    // 1. Create or update the support chat session metadata
    await setDoc(chatRef, {
      id: userId,
      userId,
      userDisplayName: user.displayName || user.email || 'Cliente',
      userEmail: user.email || '',
      lastMessageText: lastText,
      lastMessageTime: now,
      unreadByAdmin: true,
      unreadByUser: false,
      updatedAt: now,
    }, { merge: true });

    // 2. Add the actual message
    const msgData: any = {
      senderId: userId,
      senderRole: 'USER',
      senderName: user.displayName || 'Cliente',
      text: lastText,
      timestamp: now,
      read: false,
    };

    if (mediaUrl) {
      msgData.mediaUrl = mediaUrl;
      msgData.mediaType = mediaType || 'image';
    }

    if (replyTo) {
      msgData.replyToId = replyTo.id;
      msgData.replyToText = replyTo.text;
      msgData.replyToSenderName = replyTo.senderName;
    }

    await addDoc(messagesCollectionRef, msgData);

    // Trigger device native push notification for admin
    triggerNativeNotification(`💬 Mensaje de ${user.displayName || 'Cliente'}`, {
      body: lastText,
      tag: `chat-${userId}`
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SUPPORT_CHATS_COLLECTION}/${userId}`);
  }
};

/**
 * Sends a message from the administrator
 */
export const sendMessageAsAdmin = async (
  userId: string, 
  admin: User, 
  text: string, 
  mediaUrl?: string, 
  mediaType?: string,
  replyTo?: ReplyToPayload
) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  const messagesCollectionRef = collection(firestore, SUPPORT_CHATS_COLLECTION, userId, 'messages');
  const now = Timestamp.now();

  try {
    const lastText = mediaUrl ? (text || `[${mediaType === 'image' ? 'Imagen' : mediaType === 'audio' ? 'Mensaje de voz' : 'Archivo'}]`) : text;

    // 1. Update support chat session metadata
    await setDoc(chatRef, {
      lastMessageText: lastText,
      lastMessageTime: now,
      unreadByAdmin: false,
      unreadByUser: true,
      updatedAt: now,
    }, { merge: true });

    // 2. Add the actual message
    const msgData: any = {
      senderId: admin.uid,
      senderRole: 'ADMIN',
      senderName: admin.displayName || 'Administrador',
      text: lastText,
      timestamp: now,
      read: false,
    };

    if (mediaUrl) {
      msgData.mediaUrl = mediaUrl;
      msgData.mediaType = mediaType || 'image';
    }

    if (replyTo) {
      msgData.replyToId = replyTo.id;
      msgData.replyToText = replyTo.text;
      msgData.replyToSenderName = replyTo.senderName;
    }

    await addDoc(messagesCollectionRef, msgData);

    // Also send in-app notification & device native notification
    await sendNotification({
      userId,
      title: '💊 Respuesta de Farmacia Vitalis',
      message: lastText,
      type: 'SYSTEM'
    });

    triggerNativeNotification(`💊 Respuesta de Soporte Vitalis`, {
      body: lastText,
      tag: `chat-reply-${userId}`
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SUPPORT_CHATS_COLLECTION}/${userId}`);
  }
};

/**
 * Marks a chat as read by admin
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
 * Marks a chat as read by user
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

/**
 * Streams the chat session metadata (including typing statuses and unread flags) for a specific user.
 */
export const streamChatSession = (userId: string, callback: (chat: SupportChat | null) => void) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  return onSnapshot(chatRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as SupportChat);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error streaming chat session metadata:", error);
  });
};

/**
 * Updates the user's typing status.
 */
export const setUserTypingStatus = async (userId: string, isTyping: boolean) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  try {
    await updateDoc(chatRef, {
      userTyping: isTyping
    });
  } catch (error) {
    console.warn("Could not set user typing status:", error);
  }
};

/**
 * Updates the admin's typing status.
 */
export const setAdminTypingStatus = async (userId: string, isTyping: boolean) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  try {
    await updateDoc(chatRef, {
      adminTyping: isTyping
    });
  } catch (error) {
    console.warn("Could not set admin typing status:", error);
  }
};

/**
 * Physically deletes a message from Firestore
 */
export const deleteSupportMessage = async (userId: string, messageId: string) => {
  const messageRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId, 'messages', messageId);
  try {
    await deleteDoc(messageRef);
  } catch (error) {
    console.error("Could not delete support message:", error);
    throw error;
  }
};

/**
 * Deletes a support chat session (including metadata and clean slate)
 */
export const deleteSupportChat = async (userId: string) => {
  const chatRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId);
  try {
    await deleteDoc(chatRef);
  } catch (error) {
    console.error("Could not delete support chat:", error);
    throw error;
  }
};

/**
 * Toggles an emoji reaction on a specific message
 */
export const reactToMessage = async (userId: string, messageId: string, emoji: string, senderName: string) => {
  const messageRef = doc(firestore, SUPPORT_CHATS_COLLECTION, userId, 'messages', messageId);
  try {
    const snap = await getDoc(messageRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const currentReactions = data.reactions || {};
    const usersWithReaction = currentReactions[emoji] || [];

    let newUsers: string[];
    if (usersWithReaction.includes(senderName)) {
      // Remove reaction if already reacted
      newUsers = usersWithReaction.filter((name: string) => name !== senderName);
    } else {
      // Add reaction
      newUsers = [...usersWithReaction, senderName];
    }

    const updatedReactions = { ...currentReactions };
    if (newUsers.length === 0) {
      delete updatedReactions[emoji];
    } else {
      updatedReactions[emoji] = newUsers;
    }

    await updateDoc(messageRef, {
      reactions: updatedReactions
    });
  } catch (error) {
    console.error("Could not react to message:", error);
    throw error;
  }
};
