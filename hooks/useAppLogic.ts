import { useState, useEffect, useRef } from 'react';
import { useAppNavigation } from './useAppLogic/useAppNavigation';
import { useAppData } from './useAppLogic/useAppData';
import { useAppCart } from './useAppLogic/useAppCart';
import { useAppSearch } from './useAppLogic/useAppSearch';
import { useAppOrders } from './useAppLogic/useAppOrders';
import { useNotifications } from './useNotifications';
import { getProductIdFromUrl } from '../utils/productUrl';
import { fetchProductByIdDB } from '../services/db';

export const useAppLogic = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserSubscriptionsModal, setShowUserSubscriptionsModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showStaffAccess, setShowStaffAccess] = useState(false);
  const [isResolvingUrlProduct, setIsResolvingUrlProduct] = useState(false);
  const resolvingPidRef = useRef<string | null>(null);
  
  const nav = useAppNavigation();
  const { searchTerm, setSearchTerm, activeCategory, setActiveCategory } = nav;

  const data = useAppData(nav.activeTab, setShowAuthModal);
  const cart = useAppCart();
  const notifications = useNotifications(data.currentUser?.uid);

  // Sincronizar el producto de la URL con el estado de la aplicación de forma robusta e inmediata
  useEffect(() => {
    let isCancelled = false;

    const handleUrlProductSync = async () => {
      const targetPid = getProductIdFromUrl();
      if (!targetPid) {
        nav.setHasInitializedProductFromUrl(true);
        return;
      }

      const trimmedPid = targetPid.trim();

      // Si el producto actual ya corresponde al ID solicitado, no hacer re-render innecesario
      if (nav.selectedProduct && (
        nav.selectedProduct.id === trimmedPid || 
        nav.selectedProduct.id.toLowerCase() === trimmedPid.toLowerCase()
      )) {
        nav.setHasInitializedProductFromUrl(true);
        return;
      }

      // Evitar llamadas en paralelo duplicadas para el mismo ID
      if (resolvingPidRef.current === trimmedPid) return;
      resolvingPidRef.current = trimmedPid;
      setIsResolvingUrlProduct(true);

      try {
        // 1. Buscar en los productos cargados actualmente en memoria/caché
        let prod = data.products.find(p => 
          p.id === trimmedPid || 
          p.id.toLowerCase() === trimmedPid.toLowerCase() ||
          p.barcode === trimmedPid
        );

        // 2. Si aún no está en memoria (ej: carga inicial lenta de Firestore o cliente nuevo que abre enlace compartido),
        // consultar de inmediato el documento individual a Firestore
        if (!prod) {
          const fetched = await fetchProductByIdDB(trimmedPid);
          if (fetched && !isCancelled) {
            prod = fetched;
            // Lo añadimos al catálogo local para que esté disponible para todo el flujo de compra
            data.setProducts(prev => {
              const exists = prev.some(p => p.id === fetched.id);
              return exists ? prev : [fetched, ...prev];
            });
          }
        }

        if (prod && !isCancelled) {
          nav.setSelectedProduct(prod);
          nav.setView('HOME');
          nav.setActiveTab('home');
        }
      } catch (err) {
        console.error("Error al sincronizar producto desde la URL:", err);
      } finally {
        if (!isCancelled) {
          setIsResolvingUrlProduct(false);
          nav.setHasInitializedProductFromUrl(true);
          resolvingPidRef.current = null;
        }
      }
    };

    handleUrlProductSync();

    window.addEventListener('popstate', handleUrlProductSync);
    return () => {
      isCancelled = true;
      window.removeEventListener('popstate', handleUrlProductSync);
    };
  }, [data.products, nav.selectedProduct?.id]);

  
  const search = useAppSearch(
    data.products, 
    data.categories, 
    searchTerm, 
    setSearchTerm, 
    activeCategory, 
    setActiveCategory
  );

  const orders = useAppOrders(
    data.currentUser, 
    cart.cart, 
    cart.subtotal, 
    data.products, 
    cart.setCart, 
    nav.setView
  );

  const handleTabChange = (tab: any) => {
    if ((tab === 'orders' || tab === 'health' || tab === 'services') && !data.currentUser) {
      setShowAuthModal(true);
      return;
    }
    nav.setActiveTab(tab);
    nav.setView('HOME');
    
    if (tab === 'home') {
      setActiveCategory(null);
      setSearchTerm('');
    }
  };

  return {
    ...data,
    ...nav,
    ...cart,
    isSymptomMode: false,
    setIsSymptomMode: () => {},
    isSearchingAI: false,
    ...search,
    ...orders,
    notifications,
    showAuthModal, setShowAuthModal,
    showProfileModal, setShowProfileModal,
    showUserSubscriptionsModal, setShowUserSubscriptionsModal,
    showPrescriptionModal, setShowPrescriptionModal,
    showStaffAccess, setShowStaffAccess,
    isResolvingUrlProduct,
    handleTabChange
  };
};
