import { useState, useEffect } from 'react';
import { Product, Category, Order, User, Bundle, BlogPost } from '../../types';
import { 
  streamProducts, streamCategories, streamOrders, streamUser, streamActiveBundles, streamBlogPosts 
} from '../../services/db';
import { auth } from '../../services/firebase';

export const useAppData = (activeTab: string, setShowAuthModal: (v: boolean) => void) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
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
    const unsubBundles = streamActiveBundles(setBundles);
    const unsubBlog = streamBlogPosts(setBlogPosts);

    return () => {
      unsubAuth(); unsubProducts(); unsubCategories(); unsubOrders(); unsubBundles(); unsubBlog();
      if (unsubUser) unsubUser();
    };
  }, [activeTab, setShowAuthModal]);

  return { products, categories, orders, bundles, blogPosts, currentUser };
};
