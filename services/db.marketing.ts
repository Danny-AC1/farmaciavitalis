
import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Coupon, Banner, BlogPost } from '../types';
import { cleanData } from './db.utils';
import { sendNotificationToAll } from './db.notifications';

const COUPONS_COLLECTION = 'coupons';
const BANNERS_COLLECTION = 'banners';
const BLOG_COLLECTION = 'blog_posts';

export const streamCoupons = (callback: (coupons: Coupon[]) => void) => {
    return onSnapshot(query(collection(firestore, COUPONS_COLLECTION), orderBy('code')), (snapshot) => {
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Coupon[];
        callback(coupons);
    });
};
export const addCouponDB = async (coupon: Coupon) => { 
    const { id, ...data } = coupon; 
    await addDoc(collection(firestore, COUPONS_COLLECTION), cleanData(data)); 
    await sendNotificationToAll({
        title: '¡Nuevo Cupón Disponible!',
        message: `Usa el código ${coupon.code} para obtener un descuento en tu próxima compra.`,
        type: 'PROMOTION'
    });
};
export const deleteCouponDB = async (id: string) => { await deleteDoc(doc(firestore, COUPONS_COLLECTION, id)); };

export const streamBanners = (callback: (banners: Banner[]) => void) => {
  return onSnapshot(query(collection(firestore, BANNERS_COLLECTION)), (snapshot) => {
        const banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
        callback(banners);
    });
};
export const addBannerDB = async (banner: Banner) => { const { id, ...data } = banner; await addDoc(collection(firestore, BANNERS_COLLECTION), cleanData(data)); };
export const deleteBannerDB = async (id: string) => { await deleteDoc(doc(firestore, BANNERS_COLLECTION, id)); };

export const streamBlogPosts = (callback: (posts: BlogPost[]) => void) => {
  return onSnapshot(query(collection(firestore, BLOG_COLLECTION), orderBy('date', 'desc')), (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[];
        callback(posts);
    });
};
export const addBlogPostDB = async (post: BlogPost) => { 
    const { id, ...data } = post; 
    await addDoc(collection(firestore, BLOG_COLLECTION), cleanData(data)); 
    await sendNotificationToAll({
        title: 'Nueva entrada en el Blog',
        message: `Hemos publicado: "${post.title}". ¡No te lo pierdas!`,
        type: 'SYSTEM'
    });
};
export const deleteBlogPostDB = async (id: string) => { await deleteDoc(doc(firestore, BLOG_COLLECTION, id)); };
