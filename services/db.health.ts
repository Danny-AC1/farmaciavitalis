
import { db } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { Subscription, FamilyMember, MedicationSchedule, ServiceBooking, StockAlert } from '../types';
import { cleanData } from './db.utils';

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const STOCK_ALERTS_COLLECTION = 'stock_alerts';
const FAMILY_COLLECTION = 'family_members';
const MEDICATIONS_COLLECTION = 'medications';
const BOOKINGS_COLLECTION = 'bookings';

export const addSubscriptionDB = async (email: string, productId: string, productName: string, freq: number) => {
    await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), cleanData({ 
        userId: email, productId, productName, frequencyDays: freq, 
        nextDelivery: new Date(Date.now() + freq * 86400000).toISOString(), active: true 
    }));
};

export const streamSubscriptions = (callback: (subs: Subscription[]) => void) => {
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), orderBy('nextDelivery', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscription[];
        callback(subs);
    });
};

export const deleteSubscriptionDB = async (id: string) => {
    await deleteDoc(doc(db, SUBSCRIPTIONS_COLLECTION, id));
};

export const updateSubscriptionDB = async (id: string, data: Partial<Subscription>) => {
    const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, id);
    await updateDoc(subRef, cleanData(data));
};

export const streamFamilyMembers = (userId: string, callback: (members: FamilyMember[]) => void) => {
    const q = query(collection(db, FAMILY_COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FamilyMember[];
        callback(members);
    });
};

export const addFamilyMemberDB = async (member: FamilyMember) => {
    const { id, ...data } = member;
    await addDoc(collection(db, FAMILY_COLLECTION), cleanData(data));
};

export const streamMedications = (userId: string, callback: (meds: MedicationSchedule[]) => void) => {
    const q = query(collection(db, MEDICATIONS_COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MedicationSchedule[];
        callback(meds);
    });
};

export const addMedicationDB = async (med: MedicationSchedule) => {
    const { id, ...data } = med;
    await addDoc(collection(db, MEDICATIONS_COLLECTION), cleanData(data));
};

export const takeDoseDB = async (medId: string, newStock: number) => {
    const medRef = doc(db, MEDICATIONS_COLLECTION, medId);
    await updateDoc(medRef, { currentStock: newStock, lastTaken: new Date().toISOString() });
};

export const deleteMedicationDB = async (medId: string) => {
    await deleteDoc(doc(db, MEDICATIONS_COLLECTION, medId));
};

export const addBookingDB = async (booking: ServiceBooking) => {
    const { id, ...data } = booking;
    await addDoc(collection(db, BOOKINGS_COLLECTION), cleanData(data));
};

export const streamBookings = (callback: (bookings: ServiceBooking[]) => void) => {
    const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceBooking[];
        callback(bookings);
    });
};

export const updateBookingStatusDB = async (id: string, status: ServiceBooking['status']) => {
    await updateDoc(doc(db, BOOKINGS_COLLECTION, id), { status });
};

export const deleteBookingDB = async (id: string) => {
    await deleteDoc(doc(db, BOOKINGS_COLLECTION, id));
};

export const streamStockAlerts = (callback: (alerts: StockAlert[]) => void) => {
    return onSnapshot(query(collection(db, STOCK_ALERTS_COLLECTION), orderBy('createdAt', 'desc')), (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockAlert[];
        callback(alerts);
    });
};

export const addStockAlertDB = async (email: string, productId: string) => {
    await addDoc(collection(db, STOCK_ALERTS_COLLECTION), cleanData({
        email, productId, createdAt: new Date().toISOString()
    }));
};

export const deleteStockAlertDB = async (id: string) => {
    await deleteDoc(doc(db, STOCK_ALERTS_COLLECTION, id));
};
