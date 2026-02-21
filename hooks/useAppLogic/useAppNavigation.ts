import { useState, useEffect } from 'react';
import { ViewState, User, Product } from '../../types';

export const useAppNavigation = () => {
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      view: (params.get('view') as ViewState) || 'HOME',
      tab: (params.get('tab') as any) || 'home'
    };
  };

  const initialState = getInitialState();
  const [view, setView] = useState<ViewState>(initialState.view);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'assistant' | 'health' | 'services'>(initialState.tab);
  const [tempStaffRole, setTempStaffRole] = useState<User['role'] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== 'HOME') params.set('view', view);
    if (activeTab !== 'home') params.set('tab', activeTab);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [view, activeTab]);

  return { 
    view, setView, activeTab, setActiveTab, tempStaffRole, setTempStaffRole,
    selectedProduct, setSelectedProduct 
  };
};
