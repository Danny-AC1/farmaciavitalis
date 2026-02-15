
import { db } from './firebase';
// @ts-ignore
import { onSnapshot, deleteDoc, doc, query, orderBy, setDoc, getDoc, collection } from 'firebase/firestore';
import { User } from '../types';
import { cleanData } from './db.utils';

const USERS_COLLECTION = 'users';

export const saveUserDB = async (user: User) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(userRef, cleanData(user), { merge: true }); 
};

export const deleteUserDB = async (uid: string) => {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
};

export const getUserDB = async (uid: string): Promise<User | null> => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
        const data = snap.data();
        return { ...data, points: data.points || 0 } as User;
    }
    return null;
};

export const streamUser = (uid: string, callback: (user: User | null) => void) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    return onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            callback({ ...data, uid: snap.id, points: data.points || 0 } as User);
        } else { callback(null); }
    });
};

export const streamUsers = (callback: (users: User[]) => void) => {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id, points: doc.data().points || 0 } as User));
        callback(users);
    });
};
