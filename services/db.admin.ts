
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, getDocs, increment, limit } from 'firebase/firestore';
import { Supplier, SearchLog, Expense, Ciudadela, CashClosure, MonthlyFinance } from '../types';
import { cleanData } from './db.utils';

const SUPPLIERS_COLLECTION = 'suppliers';
const SEARCH_LOGS_COLLECTION = 'search_logs';
const EXPENSES_COLLECTION = 'expenses';
const CIUDADELAS_COLLECTION = 'ciudadelas';
const CASH_CLOSURES_COLLECTION = 'cash_closures';
const MONTHLY_FINANCE_COLLECTION = 'monthly_finance';

export const streamSuppliers = (callback: (suppliers: Supplier[]) => void) => {
    return onSnapshot(query(collection(firestore, SUPPLIERS_COLLECTION), orderBy('name')), (snapshot) => {
        const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
        callback(suppliers);
    });
};
export const addSupplierDB = async (supplier: Supplier) => { const { id, ...data } = supplier; await addDoc(collection(firestore, SUPPLIERS_COLLECTION), cleanData(data)); };
export const deleteSupplierDB = async (id: string) => { await deleteDoc(doc(firestore, SUPPLIERS_COLLECTION, id)); };

export const streamCiudadelas = (callback: (data: Ciudadela[]) => void) => {
    return onSnapshot(query(collection(firestore, CIUDADELAS_COLLECTION), orderBy('name')), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ciudadela[];
        callback(data);
    });
};
export const addCiudadelaDB = async (data: Ciudadela) => { const { id, ...clean } = data; await addDoc(collection(firestore, CIUDADELAS_COLLECTION), cleanData(clean)); };
export const updateCiudadelaDB = async (data: Ciudadela) => { await updateDoc(doc(firestore, CIUDADELAS_COLLECTION, data.id), cleanData(data)); };
export const deleteCiudadelaDB = async (id: string) => { await deleteDoc(doc(firestore, CIUDADELAS_COLLECTION, id)); };

export const streamSearchLogs = (callback: (logs: SearchLog[]) => void) => {
    return onSnapshot(query(collection(firestore, SEARCH_LOGS_COLLECTION), orderBy('count', 'desc')), (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SearchLog[];
        callback(logs);
    });
};

export const logSearchDB = async (term: string) => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) return;

    const q = query(collection(firestore, SEARCH_LOGS_COLLECTION), where('term', '==', normalizedTerm));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        const docRef = doc(firestore, SEARCH_LOGS_COLLECTION, snapshot.docs[0].id);
        await updateDoc(docRef, {
            count: increment(1),
            date: new Date().toISOString()
        });
    } else {
        await addDoc(collection(firestore, SEARCH_LOGS_COLLECTION), cleanData({
            term: normalizedTerm,
            count: 1,
            date: new Date().toISOString()
        }));
    }
};

export const deleteSearchLogDB = async (id: string) => { await deleteDoc(doc(firestore, SEARCH_LOGS_COLLECTION, id)); };

export const addExpenseDB = async (expense: Expense) => {
    const { id, ...data } = expense;
    await addDoc(collection(firestore, EXPENSES_COLLECTION), cleanData(data));
};

export const updateExpenseDB = async (expense: Expense) => {
    const { id, ...data } = expense;
    const expenseRef = doc(firestore, EXPENSES_COLLECTION, id);
    await updateDoc(expenseRef, cleanData(data));
};

export const streamExpenses = (callback: (expenses: Expense[]) => void) => {
    return onSnapshot(collection(firestore, EXPENSES_COLLECTION), (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        callback(expenses);
    });
};
export const deleteExpenseDB = async (id: string) => { await deleteDoc(doc(firestore, EXPENSES_COLLECTION, id)); };

// --- CASH CLOSURES ---
export const saveCashClosureDB = async (closure: CashClosure) => {
    const { id, ...data } = closure;
    await addDoc(collection(firestore, CASH_CLOSURES_COLLECTION), cleanData(data));
};

export const streamCashClosures = (callback: (data: CashClosure[]) => void) => {
    return onSnapshot(collection(firestore, CASH_CLOSURES_COLLECTION), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CashClosure[];
        callback(data);
    });
};

// --- MONTHLY FINANCE ---
export const saveMonthlyFinanceDB = async (finance: MonthlyFinance) => {
    const { id, ...data } = finance;
    // Evitar duplicados para el mismo mes
    const q = query(collection(firestore, MONTHLY_FINANCE_COLLECTION), where('month', '==', data.month));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        await updateDoc(doc(firestore, MONTHLY_FINANCE_COLLECTION, snapshot.docs[0].id), cleanData(data));
    } else {
        await addDoc(collection(firestore, MONTHLY_FINANCE_COLLECTION), cleanData(data));
    }
};

export const streamMonthlyFinance = (callback: (data: MonthlyFinance[]) => void) => {
    return onSnapshot(collection(firestore, MONTHLY_FINANCE_COLLECTION), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MonthlyFinance[];
        callback(data);
    });
};
