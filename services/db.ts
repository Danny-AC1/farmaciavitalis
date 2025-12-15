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
import { Product, Order, Category, User, Coupon, Banner, Supplier, SearchLog, BlogPost, Subscription } from '../types';

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
      // Find doc ref first (since we might have ID mismatch issues in some setups, but here we try direct)
      // For simplicity in this structure:
      let orderRef = doc(db, ORDERS_COLLECTION, id);
      
      // Safety check if ID is not direct Firestore ID
      if(id.startsWith('ORD-') || id.startsWith('POS-')) {
          const q = query(collection(db, ORDERS_COLLECTION), where('id', '==', id));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
              orderRef = snapshot.docs[0].ref;
          }
      }

      await updateDoc(orderRef, { status });

      // LOYALTY LOGIC: Add points on DELIVERY
      if (status === 'DELIVERED' && order && order.userId) {
          const pointsEarned = Math.floor(order.total); // 1 punto por dólar
          if (pointsEarned > 0) {
            const userRef = doc(db, USERS_COLLECTION, order.userId);
            await updateDoc(userRef, { points: increment(pointsEarned) });
          }
      }

  } catch (e) {
      console.error("Error updating order status", e);
  }
};

// --- USERS ---
export const saveUserDB = async (user: User) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    // Ensure points exist
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
    // Simple implementation: Add new doc every time. Aggregation happens on read or via cloud function in real app.
    // For this demo, we check if one exists for today
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

export const addSubscriptionDB = async (sub: Subscription) => {
    const { id, ...data } = sub;
    await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), data);
};


// --- SEEDING ---
export const seedInitialData = async () => {
  console.log("Sistema inicializado.");
};