import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { Prescription } from '../types';
import { cleanData } from './db.utils';

const PRESCRIPTIONS_COLLECTION = 'prescriptions';

export const addPrescriptionDB = async (prescription: Prescription) => {
    const { id, ...data } = prescription;
    const docRef = await addDoc(collection(firestore, PRESCRIPTIONS_COLLECTION), cleanData(data));
    return docRef.id;
};

export const streamPrescriptions = (callback: (prescriptions: Prescription[]) => void) => {
    const q = query(collection(firestore, PRESCRIPTIONS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const prescriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Prescription[];
        callback(prescriptions);
    });
};

export const streamUserPrescriptions = (userId: string, callback: (prescriptions: Prescription[]) => void) => {
    const q = query(
        collection(firestore, PRESCRIPTIONS_COLLECTION), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const prescriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Prescription[];
        callback(prescriptions);
    });
};

export const updatePrescriptionStatusDB = async (id: string, status: Prescription['status']) => {
    await updateDoc(doc(firestore, PRESCRIPTIONS_COLLECTION, id), { status });
};

export const deletePrescriptionDB = async (id: string) => {
    await deleteDoc(doc(firestore, PRESCRIPTIONS_COLLECTION, id));
};
