import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, setDoc, updateDoc } from 'firebase/firestore';
import { TreasurySession, TreasuryTransaction, TreasuryDeposit } from '../types';
import { cleanData } from './db.utils';

const SESSIONS_COLLECTION = 'treasury_sessions';
const TRANSACTIONS_COLLECTION = 'treasury_transactions';
const DEPOSITS_COLLECTION = 'treasury_deposits';

// --- SESSIONS ---
export const streamTreasurySessions = (callback: (sessions: TreasurySession[]) => void) => {
  const q = query(collection(firestore, SESSIONS_COLLECTION), orderBy('openedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TreasurySession[];
    callback(sessions);
  }, (err) => {
    console.warn("Error streaming sessions, using localStorage fallback:", err);
    try {
      const local = localStorage.getItem('vitalis_treasury_sessions');
      callback(local ? JSON.parse(local) : []);
    } catch (e) {
      callback([]);
    }
  });
};

export const saveTreasurySessionDB = async (session: TreasurySession) => {
  try {
    const docRef = doc(firestore, SESSIONS_COLLECTION, session.id);
    await setDoc(docRef, cleanData(session));
  } catch (err) {
    console.error("Firestore saveTreasurySessionDB failed, saving locally:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_treasury_sessions');
    const list: TreasurySession[] = local ? JSON.parse(local) : [];
    const filtered = list.filter(s => s.id !== session.id);
    filtered.unshift(session);
    localStorage.setItem('vitalis_treasury_sessions', JSON.stringify(filtered));
  } catch (e) {
    console.error(e);
  }
};

export const updateTreasurySessionDB = async (id: string, updates: Partial<TreasurySession>) => {
  try {
    const docRef = doc(firestore, SESSIONS_COLLECTION, id);
    await updateDoc(docRef, cleanData(updates));
  } catch (err) {
    console.error("Firestore updateTreasurySessionDB failed, updating locally:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_treasury_sessions');
    if (local) {
      const list: TreasurySession[] = JSON.parse(local);
      const updated = list.map(s => s.id === id ? { ...s, ...updates } : s);
      localStorage.setItem('vitalis_treasury_sessions', JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }
};

export const deleteTreasurySessionDB = async (id: string) => {
  try {
    await deleteDoc(doc(firestore, SESSIONS_COLLECTION, id));
  } catch (err) {
    console.error("Firestore deleteTreasurySessionDB failed:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_treasury_sessions');
    if (local) {
      const list: TreasurySession[] = JSON.parse(local);
      localStorage.setItem('vitalis_treasury_sessions', JSON.stringify(list.filter(s => s.id !== id)));
    }
  } catch (e) {
    console.error(e);
  }
};

// --- TRANSACTIONS ---
export const streamTreasuryTransactions = (callback: (txs: TreasuryTransaction[]) => void) => {
  const q = query(collection(firestore, TRANSACTIONS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TreasuryTransaction[];
    callback(txs);
  }, (err) => {
    console.warn("Error streaming transactions, using localStorage fallback:", err);
    try {
      const local = localStorage.getItem('vitalis_treasury_transactions');
      callback(local ? JSON.parse(local) : []);
    } catch (e) {
      callback([]);
    }
  });
};

export const saveTreasuryTransactionDB = async (tx: TreasuryTransaction) => {
  try {
    const docRef = doc(firestore, TRANSACTIONS_COLLECTION, tx.id);
    await setDoc(docRef, cleanData(tx));
  } catch (err) {
    console.error("Firestore saveTreasuryTransactionDB failed, saving locally:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_treasury_transactions');
    const list: TreasuryTransaction[] = local ? JSON.parse(local) : [];
    const filtered = list.filter(t => t.id !== tx.id);
    filtered.unshift(tx);
    localStorage.setItem('vitalis_treasury_transactions', JSON.stringify(filtered));
  } catch (e) {
    console.error(e);
  }
};

export const deleteTreasuryTransactionDB = async (id: string) => {
  try {
    await deleteDoc(doc(firestore, TRANSACTIONS_COLLECTION, id));
  } catch (err) {
    console.error(err);
  }

  try {
    const local = localStorage.getItem('vitalis_treasury_transactions');
    if (local) {
      const list: TreasuryTransaction[] = JSON.parse(local);
      localStorage.setItem('vitalis_treasury_transactions', JSON.stringify(list.filter(t => t.id !== id)));
    }
  } catch (e) {
    console.error(e);
  }
};

// --- DEPOSITS ---
export const streamTreasuryDeposits = (callback: (deposits: TreasuryDeposit[]) => void) => {
  const q = query(collection(firestore, DEPOSITS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const deposits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TreasuryDeposit[];
    callback(deposits);
  }, (err) => {
    console.warn("Error streaming deposits, using localStorage fallback:", err);
    try {
      const local = localStorage.getItem('vitalis_treasury_deposits');
      callback(local ? JSON.parse(local) : []);
    } catch (e) {
      callback([]);
    }
  });
};

export const saveTreasuryDepositDB = async (deposit: TreasuryDeposit) => {
  try {
    const docRef = doc(firestore, DEPOSITS_COLLECTION, deposit.id);
    await setDoc(docRef, cleanData(deposit));
  } catch (err) {
    console.error("Firestore saveTreasuryDepositDB failed, saving locally:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_vitalis_treasury_deposits');
    const list: TreasuryDeposit[] = local ? JSON.parse(local) : [];
    const filtered = list.filter(d => d.id !== deposit.id);
    filtered.unshift(deposit);
    localStorage.setItem('vitalis_treasury_deposits', JSON.stringify(filtered));
  } catch (e) {
    console.error(e);
  }
};

export const updateTreasuryDepositStatusDB = async (id: string, status: 'CONCILIADO' | 'PENDIENTE') => {
  try {
    await updateDoc(doc(firestore, DEPOSITS_COLLECTION, id), { status });
  } catch (err) {
    console.error(err);
  }

  try {
    const local = localStorage.getItem('vitalis_treasury_deposits');
    if (local) {
      const list: TreasuryDeposit[] = JSON.parse(local);
      const updated = list.map(d => d.id === id ? { ...d, status } : d);
      localStorage.setItem('vitalis_treasury_deposits', JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }
};

export const deleteTreasuryDepositDB = async (id: string) => {
  try {
    await deleteDoc(doc(firestore, DEPOSITS_COLLECTION, id));
  } catch (err) {
    console.error(err);
  }

  try {
    const local = localStorage.getItem('vitalis_treasury_deposits');
    if (local) {
      const list: TreasuryDeposit[] = JSON.parse(local);
      localStorage.setItem('vitalis_treasury_deposits', JSON.stringify(list.filter(d => d.id !== id)));
    }
  } catch (e) {
    console.error(e);
  }
};
