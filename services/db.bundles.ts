
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from './firebase';
import { Bundle } from '../types';

const BUNDLES_COL = 'bundles';

export const addBundleDB = async (bundle: Omit<Bundle, 'id'>) => {
    return addDoc(collection(firestore, BUNDLES_COL), bundle);
};

export const updateBundleDB = async (id: string, bundle: Partial<Bundle>) => {
    return updateDoc(doc(firestore, BUNDLES_COL, id), bundle);
};

export const deleteBundleDB = async (id: string) => {
    return deleteDoc(doc(firestore, BUNDLES_COL, id));
};

export const streamBundles = (callback: (bundles: Bundle[]) => void) => {
    return onSnapshot(collection(firestore, BUNDLES_COL), (snapshot) => {
        const bundles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));
        callback(bundles);
    });
};

export const streamActiveBundles = (callback: (bundles: Bundle[]) => void) => {
    const q = query(collection(firestore, BUNDLES_COL), where('active', '==', true));
    return onSnapshot(q, (snapshot) => {
        const bundles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle));
        callback(bundles);
    });
};
