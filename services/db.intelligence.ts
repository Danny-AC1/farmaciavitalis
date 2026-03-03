
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc, getDocs, where, setDoc } from 'firebase/firestore';
import { MissedSale } from '../types';
import { cleanData } from './db.utils';

const MISSED_SALES_COLLECTION = 'missed_sales';

export const streamMissedSales = (callback: (sales: MissedSale[]) => void) => {
    return onSnapshot(query(collection(firestore, MISSED_SALES_COLLECTION), orderBy('count', 'desc')), (snapshot) => {
        const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MissedSale[];
        callback(sales);
    });
};

export const logMissedSale = async (term: string) => {
    if (!term || term.trim().length < 3) return;
    
    const q = query(collection(firestore, MISSED_SALES_COLLECTION), where('term', '==', term.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        const data = snapshot.docs[0].data();
        await updateDoc(docRef, {
            count: (data.count || 0) + 1,
            lastAttemptedAt: new Date().toISOString()
        });
    } else {
        await addDoc(collection(firestore, MISSED_SALES_COLLECTION), cleanData({
            term: term.toUpperCase(),
            count: 1,
            date: new Date().toISOString(),
            lastAttemptedAt: new Date().toISOString()
        }));
    }
};

export const deleteMissedSaleDB = async (id: string) => { 
    await deleteDoc(doc(firestore, MISSED_SALES_COLLECTION, id)); 
};
