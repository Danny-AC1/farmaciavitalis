
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, getDocs, increment, limit, setDoc } from 'firebase/firestore';
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
    try {
        const { id, ...data } = closure;
        const cleaned = cleanData(data);
        console.log("Saving cash closure data:", cleaned);
        
        const docRef = await addDoc(collection(firestore, CASH_CLOSURES_COLLECTION), cleaned);
        // Guardar el ID dentro del documento para consistencia
        await updateDoc(docRef, { id: docRef.id });
        
        console.log("Cash closure saved successfully with Firestore ID:", docRef.id);
    } catch (error) {
        console.error("Critical error in saveCashClosureDB:", error);
        throw error;
    }
};

export const updateCashClosureDB = async (closure: CashClosure) => {
    if (!closure.id) throw new Error("ID de cierre requerido para actualizar");
    const { id, ...data } = closure;
    await updateDoc(doc(firestore, CASH_CLOSURES_COLLECTION, id), cleanData(data));
};

export const deleteCashClosureDB = async (id: string) => {
    await deleteDoc(doc(firestore, CASH_CLOSURES_COLLECTION, id));
};

export const streamCashClosures = (callback: (data: CashClosure[]) => void) => {
    // Escuchar la colección completa. El ordenamiento se hace en el frontend para evitar 
    // problemas de índices en proyectos recién configurados.
    const q = collection(firestore, CASH_CLOSURES_COLLECTION);
    
    return onSnapshot(q, 
        (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CashClosure[];
            console.log(`Cash closures updated: ${data.length} records found in '${CASH_CLOSURES_COLLECTION}'.`);
            callback(data);
        },
        (error) => {
            console.error("Error streaming cash closures:", error);
            callback([]);
        }
    );
};

// Función de diagnóstico para diagnóstico manual
export const diagnosticFetchClosures = async () => {
    try {
        console.log("Iniciando diagnóstico de lectura directa para:", CASH_CLOSURES_COLLECTION);
        const q = collection(firestore, CASH_CLOSURES_COLLECTION);
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Respuesta de diagnóstico:", data.length, "documentos encontrados.");
        return { success: true, count: data.length, data };
    } catch (error: any) {
        console.error("Fallo de diagnóstico en Firestore:", error);
        return { success: false, error: error.message || "Error desconocido", code: error.code };
    }
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
