import { db, storage } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  setDoc,
  getDoc,
  where,
  increment
} from 'firebase/firestore';
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
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  });
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
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
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
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id, 
      ...doc.data()
    })) as Order[];
    callback(orders);
  });
};

export const getOrdersByUserDB = (userId: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, ORDERS_COLLECTION), where('userId', '==', userId), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
        callback(orders);
    });
};

export const addOrderDB = async (order: Order) => {
  const { ...data } = order; 
  await addDoc(collection(db, ORDERS_COLLECTION), data);
  
  // Si el usuario usó puntos, descontarlos
  if (order.userId && order.pointsRedeemed && order.pointsRedeemed > 0) {
      const userRef = doc(db, USERS_COLLECTION, order.userId);
      await updateDoc(userRef, { points: increment(-order.pointsRedeemed) });
  }
};

export const updateOrderStatusDB = async (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order?: Order) => {
  try {
      let orderRef = doc(db, ORDERS_COLLECTION, id);
      
      if(id.startsWith('ORD-') || id.startsWith('POS-')) {
          const q = query(collection(db, ORDERS_COLLECTION), where('id', '==', id));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
              orderRef = snapshot.docs[0].ref;
          }
      }

      await updateDoc(orderRef, { status });

      if (status === 'DELIVERED' && order && order.userId) {
          const pointsEarned = Math.floor(order.total);
          if (pointsEarned > 0) {
            const userRef = doc(db, USERS_COLLECTION, order.userId);
            await updateDoc(userRef, { points: increment(pointsEarned) });
          }
      }

  } catch (e) {
      console.error("Error updating order status", e);
  }
};

export const updateOrderLocationDB = async (id: string, lat: number, lng: number) => {
    try {
        let orderRef = doc(db, ORDERS_COLLECTION, id);
        // Handle custom ID query if needed (similar to status update logic)
        if(id.startsWith('ORD-')) {
            const q = query(collection(db, ORDERS_COLLECTION), where('id', '==', id));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) orderRef = snapshot.docs[0].ref;
        }

        await updateDoc(orderRef, {
            driverLocation: {
                lat,
                lng,
                lastUpdate: new Date().toISOString()
            }
        });
    } catch (e) {
        console.error("Error updating GPS", e);
    }
};

// --- USERS ---
export const saveUserDB = async (user: User) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const dataToSave = { ...user, points: user.points || 0 };
    await setDoc(userRef, dataToSave, { merge: true }); 
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
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ ...doc.data(), points: doc.data().points || 0 } as User));
        callback(users);
    });
};

// --- FAMILY CARE & MEDICATIONS ---
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
    await updateDoc(medRef, { 
        currentStock: newStock,
        lastTaken: new Date().toISOString()
    });
};

export const deleteMedicationDB = async (medId: string) => {
    await deleteDoc(doc(db, MEDICATIONS_COLLECTION, medId));
};

// --- BOOKINGS (SERVICES) ---
export const addBookingDB = async (booking: ServiceBooking) => {
    const { id, ...data } = booking;
    await addDoc(collection(db, BOOKINGS_COLLECTION), data);
};

export const streamBookings = (callback: (bookings: ServiceBooking[]) => void) => {
    // Default: mostrar todas. En prod filtrarías por fecha reciente.
    const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceBooking[];
        callback(bookings);
    });
};

export const updateBookingStatusDB = async (id: string, status: ServiceBooking['status']) => {
    // Busca por ID si es booking
    let ref = doc(db, BOOKINGS_COLLECTION, id);
    if(id.startsWith('bk_')) {
        const q = query(collection(db, BOOKINGS_COLLECTION), where('id', '==', id));
        const snap = await getDocs(q);
        if(!snap.empty) ref = snap.docs[0].ref;
    }
    await updateDoc(ref, { status });
};


// --- COUPONS & BANNERS ---
export const streamCoupons = (callback: (coupons: Coupon[]) => void) => {
    const q = query(collection(db, COUPONS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Coupon[];
        callback(coupons);
    });
};
export const addCouponDB = async (coupon: Coupon) => { const { id, ...data } = coupon; await addDoc(collection(db, COUPONS_COLLECTION), data); };
export const deleteCouponDB = async (id: string) => { await deleteDoc(doc(db, COUPONS_COLLECTION, id)); };

export const streamBanners = (callback: (banners: Banner[]) => void) => {
    const q = query(collection(db, BANNERS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
        callback(banners);
    });
};
export const addBannerDB = async (banner: Banner) => { const { id, ...data } = banner; await addDoc(collection(db, BANNERS_COLLECTION), data); };
export const deleteBannerDB = async (id: string) => { await deleteDoc(doc(db, BANNERS_COLLECTION, id)); };

// --- SUPPLIERS ---
export const streamSuppliers = (callback: (suppliers: Supplier[]) => void) => {
    const q = query(collection(db, SUPPLIERS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Supplier[];
        callback(suppliers);
    });
};
export const addSupplierDB = async (supplier: Supplier) => { const { id, ...data } = supplier; await addDoc(collection(db, SUPPLIERS_COLLECTION), data); };
export const deleteSupplierDB = async (id: string) => { await deleteDoc(doc(db, SUPPLIERS_COLLECTION, id)); };

// --- UNSATISFIED DEMAND ---
export const logSearch = async (term: string) => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, SEARCH_LOGS_COLLECTION), where('term', '==', term), where('date', '==', today));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await addDoc(collection(db, SEARCH_LOGS_COLLECTION), { term, date: today, count: 1 });
    } else {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, { count: increment(1) });
    }
};

export const streamSearchLogs = (callback: (logs: SearchLog[]) => void) => {
    const q = query(collection(db, SEARCH_LOGS_COLLECTION), orderBy('count', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SearchLog[];
        callback(logs);
    });
};

// --- BLOG ---
export const streamBlogPosts = (callback: (posts: BlogPost[]) => void) => {
    const q = query(collection(db, BLOG_COLLECTION), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[];
        callback(posts);
    });
};
export const addBlogPostDB = async (post: BlogPost) => { const { id, ...data } = post; await addDoc(collection(db, BLOG_COLLECTION), data); };

// --- ALERTS & SUBSCRIPTIONS ---
export const addStockAlertDB = async (email: string, productId: string) => {
    await addDoc(collection(db, STOCK_ALERTS_COLLECTION), { email, productId, createdAt: new Date().toISOString() });
};

export const streamStockAlerts = (callback: (alerts: StockAlert[]) => void) => {
    const q = query(collection(db, STOCK_ALERTS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockAlert[];
        callback(alerts);
    });
};

export const deleteStockAlertDB = async (id: string) => {
    await deleteDoc(doc(db, STOCK_ALERTS_COLLECTION, id));
};

export const addSubscriptionDB = async (sub: Subscription) => {
    const { id, ...data } = sub;
    await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), data);
};

export const streamSubscriptions = (callback: (subs: Subscription[]) => void) => {
    const q = query(collection(db, SUBSCRIPTIONS_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscription[];
        callback(subs);
    });
};

// --- EXPENSES ---
export const addExpenseDB = async (expense: Expense) => {
    const { id, ...data } = expense;
    await addDoc(collection(db, EXPENSES_COLLECTION), data);
};

export const streamExpenses = (callback: (expenses: Expense[]) => void) => {
    const q = query(collection(db, EXPENSES_COLLECTION), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        callback(expenses);
    });
};
export const deleteExpenseDB = async (id: string) => { await deleteDoc(doc(db, EXPENSES_COLLECTION, id)); };


// --- SEEDING ---
export const seedInitialData = async () => {
  console.log("Sistema inicializado.");
};
