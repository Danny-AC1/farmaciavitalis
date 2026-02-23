import { useState, useEffect } from 'react';
import { Product, Category, Order, User, Banner, Bundle } from '../../types';
import { 
  streamProducts, streamCategories, streamOrders, streamBanners, streamUser, streamActiveBundles 
} from '../../services/db';
import { auth } from '../../services/firebase';

export const useAppData = (activeTab: string, setShowAuthModal: (v: boolean) => void) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (unsubUser) unsubUser();
        unsubUser = streamUser(user.uid, (userData) => {
          setCurrentUser(userData);
        });
      } else {
        if (unsubUser) unsubUser();
        unsubUser = null;
        setCurrentUser(null);
        if (['orders', 'health'].includes(activeTab)) {
          setShowAuthModal(true);
        }
      }
    });

    const unsubProducts = streamProducts(setProducts);
    const unsubCategories = streamCategories(setCategories);
    const unsubOrders = streamOrders(setOrders);
    const unsubBanners = streamBanners(setBanners);
    const unsubBundles = streamActiveBundles(setBundles);

    return () => {
      unsubAuth(); unsubProducts(); unsubCategories(); unsubOrders(); unsubBanners(); unsubBundles();
      if (unsubUser) unsubUser();
    };
  }, [activeTab, setShowAuthModal]);

  return { products, categories, orders, banners, bundles, currentUser };
};
