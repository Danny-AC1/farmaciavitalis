import { useState, useEffect } from 'react';
import { Product, Category, Order, User, Bundle, BlogPost } from '../../types';
import { 
  streamProducts, streamCategories, streamOrders, streamUser, streamActiveBundles, streamBlogPosts 
} from '../../services/db';
import { auth } from '../../services/firebase';

export const useAppData = (activeTab: string, setShowAuthModal: (v: boolean) => void) => {
  // Cargar estado inicial desde localStorage (Backup/Caché instantáneo)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('vitalis_cache_products');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem('vitalis_cache_categories');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('vitalis_cache_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [bundles, setBundles] = useState<Bundle[]>(() => {
    try {
      const cached = localStorage.getItem('vitalis_cache_bundles');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    try {
      const cached = localStorage.getItem('vitalis_cache_blogPosts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('vitalis_cache_currentUser');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Guardar en localStorage cuando el estado se actualiza en tiempo real
  useEffect(() => {
    try {
      if (products && products.length > 0) {
        localStorage.setItem('vitalis_cache_products', JSON.stringify(products));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      if (categories && categories.length > 0) {
        localStorage.setItem('vitalis_cache_categories', JSON.stringify(categories));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      if (orders && orders.length > 0) {
        localStorage.setItem('vitalis_cache_orders', JSON.stringify(orders));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      if (bundles && bundles.length > 0) {
        localStorage.setItem('vitalis_cache_bundles', JSON.stringify(bundles));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [bundles]);

  useEffect(() => {
    try {
      if (blogPosts && blogPosts.length > 0) {
        localStorage.setItem('vitalis_cache_blogPosts', JSON.stringify(blogPosts));
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [blogPosts]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('vitalis_cache_currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('vitalis_cache_currentUser');
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [currentUser]);

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
