
import { db, storage } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, setDoc, getDoc, where, increment, limit } from 'firebase/firestore';
// @ts-ignore
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product, Order, Category, User, Coupon, Banner, Supplier, SearchLog, BlogPost, Subscription, Expense, FamilyMember, MedicationSchedule, ServiceBooking, StockAlert } from '../types';

// Nombres de las colecciones
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const ORDERS_COLLECTION = 'orders';
const USERS_COLLECTION = 'users';
const COUPONS_COLLECTION = 'coupons';
const BANNERS_COLLECTION = 'banners';
const SUPPLIERS_COLLECTION = 'suppliers';
const SEARCH_LOGS_COLLECTION = 'search_logs';
const BLOG_COLLECTION = 'blog_posts';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const STOCK_ALERTS_COLLECTION = 'stock_alerts';
const EXPENSES_COLLECTION = 'expenses';
const FAMILY_COLLECTION = 'family_members';
const MEDICATIONS_COLLECTION = 'medications';
const BOOKINGS_COLLECTION = 'bookings';

// --- HELPERS ---
export const uploadImageToStorage = async (file: File, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        // Fix: Use storageRef instead of snapshot.ref which is not yet declared
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        throw error;
    }
};

// --- PRODUCTS ---
export const streamProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  return onSnapshot(q, 
    (snapshot) => {
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Product[];
        callback(products);
    },
    (error) => {
        console.error("Error en streamProducts:", error);
        callback([]);
    }
  );
};

export const addProductDB = async (product: Product) => {
  const { id, ...data } = product;
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), data);
  return { id: docRef.id, ...data };
};

export const updateProductDB = async (product: Product) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
  const { id, ...data } = product;
  await updateDoc(productRef, data);
};

export const deleteProductDB = async (id: string) => {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
};

export const updateStockDB = async (id: string, newStock: number) => {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(productRef, { stock: newStock });
};

// --- CATEGORIES ---
export const streamCategories = (callback: (categories: Category[]) => void) => {
  const q = query(collection(db, CATEGORIES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        callback(categories);
    });
};

export const addCategoryDB = async (category: Category) => {
  const { id, ...data } = category;
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), data);
  return { id: docRef.id, ...data };
};

export const deleteCategoryDB = async (id: string) => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
};

// --- ORDERS ---
export const streamOrders = (callback: (orders: Order[]) => void) => {
  const q = query(collection(db, ORDERS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
    orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(orders);
  });
};

export const getOrdersByUserDB = (userId: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(orders);
    });
};

export const addOrderDB = async (order: Order) => {
  const { ...data } = order; 
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  await setDoc(orderRef, data);
  
  if (order.userId && order.pointsRedeemed && order.pointsRedeemed > 0) {
      const userRef = doc(db, USERS_COLLECTION, order.userId);
      await updateDoc(userRef, { points: increment(-order.pointsRedeemed) });
  }

  if (order.userId && order.status === 'DELIVERED') {
      const pointsEarned = Math.floor(order.total);
      if (pointsEarned > 0) {
          const userRef = doc(db, USERS_COLLECTION, order.userId);
          await updateDoc(userRef, { points: increment(pointsEarned) });
      }
  }
};

export const deleteOrderDB = async (id: string) => {
  await deleteDoc(doc(db, ORDERS_COLLECTION, id));
};

export const updateOrderStatusDB = async (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order?: Order) => {
  const orderRef = doc(db, ORDERS_COLLECTION, id);
  await updateDoc(orderRef, { status });

  if (status === 'DELIVERED' && order && order.userId) {
      const pointsEarned = Math.floor(order.total);
      if (pointsEarned > 0) {
        const userRef = doc(db, USERS_COLLECTION, order.userId);
        await updateDoc(userRef, { points: increment(pointsEarned) });
      }
  }
};

export const updateOrderLocationDB = async (id: string, lat: number, lng: number) => {
    const orderRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(orderRef, { driverLocation: { lat, lng, lastUpdate: new Date().toISOString() } });
};

// --- USERS ---
export const saveUserDB = async (user: User) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const dataToSave = { ...user, points: user.points || 0 };
    await setDoc(userRef, dataToSave, { merge: true }); 
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

export const streamUsers = (callback: (users: User[]) => void) => {
    const q = query(collection(db, USERS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ ...doc.data(), points: doc.data().points || 0 } as User));
        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(users);
    });
};

// --- SUBSCRIPTIONS ---
export const addSubscriptionDB = async (email: string, productId: string, productName: string, freq: number) => {
    await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), { 
        userId: email, 
        productId, 
        productName, 
        frequencyDays: freq, 
        nextDelivery: new Date(Date.now() + freq * 86400000).toISOString(),
        active: true 
    });
};

export const streamSubscriptions = (callback: (subs: Subscription[]) => void) => {
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION));
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
    await updateDoc(subRef, data);
};

// --- FAMILY & HEALTH ---
export const streamFamilyMembers = (userId: string, callback: (members: FamilyMember[]) => void) => {
    const q = query(collection(db, FAMILY_COLLECTION), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FamilyMember[];
        callback(members);
    });
};

export const addFamilyMemberDB = async (member: FamilyMember) => {
    const { id, ...data } = member;
    await addDoc(collection(db, FAMILY_COLLECTION), data);
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
    await addDoc(collection(db, MEDICATIONS_COLLECTION), data);
};

export const takeDoseDB = async (medId: string, newStock: number) => {
    const medRef = doc(db, MEDICATIONS_COLLECTION, medId);
    await updateDoc(medRef, { currentStock: newStock, lastTaken: new Date().toISOString() });
};

export const deleteMedicationDB = async (medId: string) => {
    await deleteDoc(doc(db, MEDICATIONS_COLLECTION, medId));
};

// --- OTHERS ---
export const addBookingDB = async (booking: ServiceBooking) => {
    const { id, ...data } = booking;
    await addDoc(collection(db, BOOKINGS_COLLECTION), data);
};

export const streamBookings = (callback: (bookings: ServiceBooking[]) => void) => {
    const q = query(collection(db, BOOKINGS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceBooking[];
        bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(bookings);
    });
};

export const updateBookingStatusDB = async (id: string, status: ServiceBooking['status']) => {
    await updateDoc(doc(db, BOOKINGS_COLLECTION, id), { status });
};

export const streamCoupons = (callback: (coupons: Coupon[]) => void) => {
    return onSnapshot(query(collection(db, COUPONS_COLLECTION)), (snapshot) => {
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Coupon[];
        callback(coupons);
    });
};
export const addCouponDB = async (coupon: Coupon) => { const { id, ...data } = coupon; await addDoc(collection(db, COUPONS_COLLECTION), data); };
export const deleteCouponDB = async (id: string) => { await deleteDoc(doc(db, COUPONS_COLLECTION, id)); };

export const streamBanners = (callback: (banners: Banner[]) => void) => {
  return onSnapshot(query(collection(db, BANNERS_COLLECTION)), (snapshot) => {
        const banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
        callback(banners);
    });
};
export const addBannerDB = async (banner: Banner) => { const { id, ...data } = banner; await addDoc(collection(db, BANNERS_COLLECTION), data); };
export const deleteBannerDB = async (id: string) => { await deleteDoc(doc(db, BANNERS_COLLECTION, id)); };

export const streamSuppliers = (callback: (suppliers: Supplier[]) => void) => {
    return onSnapshot(query(collection(db, SUPPLIERS_COLLECTION)), (snapshot) => {
        const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
        callback(suppliers);
    });
};
export const addSupplierDB = async (supplier: Supplier) => { const { id, ...data } = supplier; await addDoc(collection(db, SUPPLIERS_COLLECTION), data); };
export const deleteSupplierDB = async (id: string) => { await deleteDoc(doc(db, SUPPLIERS_COLLECTION, id)); };

export const logSearch = async (term: string) => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, SEARCH_LOGS_COLLECTION), where('term', '==', term), where('date', '==', today));
    const snapshot = await getDocs(q);
    if (snapshot.empty) await addDoc(collection(db, SEARCH_LOGS_COLLECTION), { term, date: today, count: 1 });
    else await updateDoc(snapshot.docs[0].ref, { count: increment(1) });
};

export const streamSearchLogs = (callback: (logs: SearchLog[]) => void) => {
    return onSnapshot(query(collection(db, SEARCH_LOGS_COLLECTION)), (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SearchLog[];
        logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(logs);
    });
};

export const deleteSearchLogDB = async (id: string) => {
    await deleteDoc(doc(db, SEARCH_LOGS_COLLECTION, id));
};

export const streamBlogPosts = (callback: (posts: BlogPost[]) => void) => {
  return onSnapshot(query(collection(db, BLOG_COLLECTION)), (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[];
        posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(posts);
    });
};
export const addBlogPostDB = async (post: BlogPost) => { const { id, ...data } = post; await addDoc(collection(db, BLOG_COLLECTION), data); };
export const deleteBlogPostDB = async (id: string) => { await deleteDoc(doc(db, BLOG_COLLECTION, id)); };

export const addStockAlertDB = async (email: string, productId: string) => {
    await addDoc(collection(db, STOCK_ALERTS_COLLECTION), { email, productId, createdAt: new Date().toISOString() });
};

export const streamStockAlerts = (callback: (alerts: StockAlert[]) => void) => {
    return onSnapshot(query(collection(db, STOCK_ALERTS_COLLECTION)), (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockAlert[];
        alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(alerts);
    });
};

export const deleteStockAlertDB = async (id: string) => {
    await deleteDoc(doc(db, STOCK_ALERTS_COLLECTION, id));
};

export const addExpenseDB = async (expense: Expense) => {
    const { id, ...data } = expense;
    await addDoc(collection(db, EXPENSES_COLLECTION), data);
};

export const streamExpenses = (callback: (expenses: Expense[]) => void) => {
    return onSnapshot(query(collection(db, EXPENSES_COLLECTION)), (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(expenses);
    });
};
export const deleteExpenseDB = async (id: string) => { await deleteDoc(doc(db, EXPENSES_COLLECTION, id)); };

export const seedInitialData = async () => {
    try {
        const categoriesSnap = await getDocs(query(collection(db, CATEGORIES_COLLECTION), limit(1)));
        if (categoriesSnap.empty) {
            const defaultCats = [{ name: 'Medicamentos', image: '' }, { name: 'Vitaminas', image: '' }, { name: 'Primeros Auxilios', image: '' }, { name: 'Cuidado Personal', image: '' }];
            for (const cat of defaultCats) await addDoc(collection(db, CATEGORIES_COLLECTION), cat);
        }
        const productsSnap = await getDocs(query(collection(db, PRODUCTS_COLLECTION), limit(1)));
        if (productsSnap.empty) {
            const defaultProds = [
                { name: 'Paracetamol 500mg', description: 'Alivio para dolor y fiebre.', price: 2.50, category: 'Medicamentos', stock: 100, image: 'https://via.placeholder.com/300' },
                { name: 'Vitamina C', description: 'Refuerza defensas.', price: 5.00, category: 'Vitaminas', stock: 50, image: 'https://via.placeholder.com/300' }
            ];
            for (const prod of defaultProds) await addDoc(collection(db, PRODUCTS_COLLECTION), prod);
        }
    } catch (e) {
        console.error("Error en seeding:", e);
    }
};
