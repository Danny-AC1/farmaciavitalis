import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, updateDoc } from 'firebase/firestore';
import { CreditTicket } from '../types';
import { cleanData } from './db.utils';

const CREDITS_COLLECTION = 'credits';

export const streamCredits = (callback: (credits: CreditTicket[]) => void) => {
  const q = query(collection(firestore, CREDITS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const credits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CreditTicket[];
    callback(credits);
  }, (err) => {
    console.warn("Error streaming credits from Firestore, using localStorage fallback:", err);
    // Fallback to local storage if firestore listener fails
    try {
      const local = localStorage.getItem('vitalis_credits');
      if (local) {
        callback(JSON.parse(local));
      } else {
        callback([]);
      }
    } catch (e) {
      callback([]);
    }
  });
};

export const addCreditDB = async (credit: CreditTicket) => {
  try {
    const docRef = doc(firestore, CREDITS_COLLECTION, credit.id);
    const cleaned = cleanData(credit);
    await setDoc(docRef, cleaned);
  } catch (err) {
    console.error("Firestore addCreditDB failed, saving locally:", err);
  }
  
  // Always update localStorage too for instant load/fallback
  try {
    const local = localStorage.getItem('vitalis_credits');
    const list: CreditTicket[] = local ? JSON.parse(local) : [];
    const filtered = list.filter(c => c.id !== credit.id);
    filtered.unshift(credit);
    localStorage.setItem('vitalis_credits', JSON.stringify(filtered));
  } catch (e) {
    console.error(e);
  }
};

export const updateCreditStatusDB = async (id: string, status: 'PENDIENTE' | 'PAGADO') => {
  try {
    const docRef = doc(firestore, CREDITS_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.error("Firestore updateCreditStatusDB failed, updating locally:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_credits');
    if (local) {
      const list: CreditTicket[] = JSON.parse(local);
      const updated = list.map(c => c.id === id ? { ...c, status } : c);
      localStorage.setItem('vitalis_credits', JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }
};

export const updateCreditDB = async (credit: CreditTicket) => {
  try {
    const docRef = doc(firestore, CREDITS_COLLECTION, credit.id);
    const cleaned = cleanData(credit);
    await setDoc(docRef, cleaned);
  } catch (err) {
    console.error("Firestore updateCreditDB failed, updating locally:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_credits');
    if (local) {
      const list: CreditTicket[] = JSON.parse(local);
      const updated = list.map(c => c.id === credit.id ? credit : c);
      localStorage.setItem('vitalis_credits', JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }
};

export const deleteCreditDB = async (id: string) => {
  try {
    const docRef = doc(firestore, CREDITS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Firestore deleteCreditDB failed, deleting locally:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_credits');
    if (local) {
      const list: CreditTicket[] = JSON.parse(local);
      const updated = list.filter(c => c.id !== id);
      localStorage.setItem('vitalis_credits', JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }
};
