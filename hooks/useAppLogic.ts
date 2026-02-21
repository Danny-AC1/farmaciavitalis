import { useState } from 'react';
import { useAppNavigation } from './useAppLogic/useAppNavigation';
import { useAppData } from './useAppLogic/useAppData';
import { useAppCart } from './useAppLogic/useAppCart';
import { useAppAI } from './useAppLogic/useAppAI';
import { useAppSearch } from './useAppLogic/useAppSearch';
import { useAppOrders } from './useAppLogic/useAppOrders';

export const useAppLogic = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showStaffAccess, setShowStaffAccess] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const nav = useAppNavigation();
  const data = useAppData(nav.activeTab, setShowAuthModal);
  const cart = useAppCart();
  const ai = useAppAI(searchTerm, data.products, cart.cart);
  
  const search = useAppSearch(
    data.products, 
    data.categories, 
    searchTerm, 
    setSearchTerm, 
    activeCategory, 
    setActiveCategory, 
    ai.isSymptomMode, 
    ai.aiResults, 
    ai.isSearchingAI
  );

  const orders = useAppOrders(
    data.currentUser, 
    cart.cart, 
    cart.subtotal, 
    data.products, 
    cart.setCart, 
    nav.setView, 
    setShowAuthModal
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
    ...ai,
    ...search,
    ...orders,
    showAuthModal, setShowAuthModal,
    showProfileModal, setShowProfileModal,
    showPrescriptionModal, setShowPrescriptionModal,
    showStaffAccess, setShowStaffAccess,
    handleTabChange
  };
};
