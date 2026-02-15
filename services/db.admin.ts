
import { db } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, getDocs, increment } from 'firebase/firestore';
import { Supplier, SearchLog, Expense, Ciudadela } from '../types';
import { cleanData } from './db.utils';

const SUPPLIERS_COLLECTION = 'suppliers';
const SEARCH_LOGS_COLLECTION = 'search_logs';
const EXPENSES_COLLECTION = 'expenses';
const CIUDADELAS_COLLECTION = 'ciudadelas';

export const streamSuppliers = (callback: (suppliers: Supplier[]) => void) => {
    return onSnapshot(query(collection(db, SUPPLIERS_COLLECTION), orderBy('name')), (snapshot) => {
        const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
        callback(suppliers);
    });
};
export const addSupplierDB = async (supplier: Supplier) => { const { id, ...data } = supplier; await addDoc(collection(db, SUPPLIERS_COLLECTION), cleanData(data)); };
export const deleteSupplierDB = async (id: string) => { await deleteDoc(doc(db, SUPPLIERS_COLLECTION, id)); };

export const streamCiudadelas = (callback: (data: Ciudadela[]) => void) => {
    return onSnapshot(query(collection(db, CIUDADELAS_COLLECTION), orderBy('name')), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ciudadela[];
        callback(data);
    });
};
export const addCiudadelaDB = async (data: Ciudadela) => { const { id, ...clean } = data; await addDoc(collection(db, CIUDADELAS_COLLECTION), cleanData(clean)); };
export const updateCiudadelaDB = async (data: Ciudadela) => { await updateDoc(doc(db, CIUDADELAS_COLLECTION, data.id), cleanData(data)); };
export const deleteCiudadelaDB = async (id: string) => { await deleteDoc(doc(db, CIUDADELAS_COLLECTION, id)); };

export const streamSearchLogs = (callback: (logs: SearchLog[]) => void) => {
    return onSnapshot(query(collection(db, SEARCH_LOGS_COLLECTION), orderBy('count', 'desc')), (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SearchLog[];
        callback(logs);
    });
};

export const logSearchDB = async (term: string) => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) return;

    const q = query(collection(db, SEARCH_LOGS_COLLECTION), where('term', '==', normalizedTerm));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        const docRef = doc(db, SEARCH_LOGS_COLLECTION, snapshot.docs[0].id);
        await updateDoc(docRef, {
            count: increment(1),
            date: new Date().toISOString()
        });
    } else {
        await addDoc(collection(db, SEARCH_LOGS_COLLECTION), cleanData({
            term: normalizedTerm,
            count: 1,
            date: new Date().toISOString()
        }));
    }
};

export const deleteSearchLogDB = async (id: string) => { await deleteDoc(doc(db, SEARCH_LOGS_COLLECTION, id)); };

export const addExpenseDB = async (expense: Expense) => {
    const { id, ...data } = expense;
    await addDoc(collection(db, EXPENSES_COLLECTION), cleanData(data));
};
export const streamExpenses = (callback: (expenses: Expense[]) => void) => {
    return onSnapshot(query(collection(db, EXPENSES_COLLECTION), orderBy('date', 'desc')), (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        callback(expenses);
    });
};
export const deleteExpenseDB = async (id: string) => { await deleteDoc(doc(db, EXPENSES_COLLECTION, id)); };
