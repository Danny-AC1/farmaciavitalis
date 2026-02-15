
import { db } from './firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Coupon, Banner, BlogPost } from '../types';
import { cleanData } from './db.utils';

const COUPONS_COLLECTION = 'coupons';
const BANNERS_COLLECTION = 'banners';
const BLOG_COLLECTION = 'blog_posts';

export const streamCoupons = (callback: (coupons: Coupon[]) => void) => {
    return onSnapshot(query(collection(db, COUPONS_COLLECTION), orderBy('code')), (snapshot) => {
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Coupon[];
        callback(coupons);
    });
};
export const addCouponDB = async (coupon: Coupon) => { const { id, ...data } = coupon; await addDoc(collection(db, COUPONS_COLLECTION), cleanData(data)); };
export const deleteCouponDB = async (id: string) => { await deleteDoc(doc(db, COUPONS_COLLECTION, id)); };

export const streamBanners = (callback: (banners: Banner[]) => void) => {
  return onSnapshot(query(collection(db, BANNERS_COLLECTION)), (snapshot) => {
        const banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[];
        callback(banners);
    });
};
export const addBannerDB = async (banner: Banner) => { const { id, ...data } = banner; await addDoc(collection(db, BANNERS_COLLECTION), cleanData(data)); };
export const deleteBannerDB = async (id: string) => { await deleteDoc(doc(db, BANNERS_COLLECTION, id)); };

export const streamBlogPosts = (callback: (posts: BlogPost[]) => void) => {
  return onSnapshot(query(collection(db, BLOG_COLLECTION), orderBy('date', 'desc')), (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[];
        callback(posts);
    });
};
export const addBlogPostDB = async (post: BlogPost) => { const { id, ...data } = post; await addDoc(collection(db, BLOG_COLLECTION), cleanData(data)); };
export const deleteBlogPostDB = async (id: string) => { await deleteDoc(doc(db, BLOG_COLLECTION, id)); };
