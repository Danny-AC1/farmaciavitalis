import { useState, useEffect, useRef } from 'react';
import { ViewState, User, Product } from '../../types';
import { getProductIdFromUrl } from '../../utils/productUrl';

export const useAppNavigation = () => {
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      view: (params.get('view') as ViewState) || 'HOME',
      tab: (params.get('tab') as any) || 'home',
      category: params.get('category') || null
    };
  };

  const initialState = getInitialState();
  const [view, setView] = useState<ViewState>(initialState.view);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'assistant' | 'health' | 'services' | 'wellness'>(initialState.tab);
  const [tempStaffRole, setTempStaffRole] = useState<User['role'] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialState.category);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para saber si ya hemos intentado inicializar el producto desde la URL en la carga inicial
  const [hasInitializedProductFromUrl, setHasInitializedProductFromUrl] = useState(false);
  
  const [lastBackPress, setLastBackPress] = useState(0);
  const isInternalChange = useRef(false);

  // Sincronizar estado con la URL y el historial
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (view !== 'HOME') params.set('view', view);
    if (activeTab !== 'home') params.set('tab', activeTab);
    if (activeCategory) params.set('category', activeCategory);
    
    // Si hay un producto seleccionado, lo agregamos a la URL
    const urlPid = getProductIdFromUrl();
    if (selectedProduct) {
      params.set('product', selectedProduct.id);
    } else if (urlPid && !hasInitializedProductFromUrl) {
      // Si aún no se ha resuelto el producto inicial de la URL, preservamos el parámetro para no borrarlo
      params.set('product', urlPid);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    
    const currentProductId = selectedProduct ? selectedProduct.id : (!hasInitializedProductFromUrl ? urlPid : undefined);

    const state = { 
      view, 
      activeTab, 
      activeCategory, 
      selectedProductId: currentProductId,
      searchTerm 
    };

    // Si estamos en el inicio y no hay nada seleccionado, usamos replaceState para no llenar el historial
    if (view === 'HOME' && activeTab === 'home' && !activeCategory && !currentProductId) {
      window.history.replaceState(state, '', newUrl);
    } else {
      window.history.pushState(state, '', newUrl);
    }
  }, [view, activeTab, activeCategory, selectedProduct, hasInitializedProductFromUrl]);

  // Sincronizar searchTerm por separado con replaceState para que persista en el estado actual
  useEffect(() => {
    if (isInternalChange.current) return;
    const currentState = window.history.state;
    if (currentState) {
      window.history.replaceState({ ...currentState, searchTerm }, '', window.location.href);
    }
  }, [searchTerm]);

  // Manejar el evento popstate (botón atrás del navegador/móvil)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      if (state) {
        isInternalChange.current = true;
        setView(state.view || 'HOME');
        setActiveTab(state.activeTab || 'home');
        setActiveCategory(state.activeCategory || null);
        if (!state.selectedProductId) setSelectedProduct(null);
        setSearchTerm(state.searchTerm || '');
      } else {
        // Si no hay estado y estamos en el inicio, implementar lógica de doble clic para salir
        if (view === 'HOME' && activeTab === 'home' && !activeCategory && !selectedProduct && searchTerm === '') {
          const now = Date.now();
          if (now - lastBackPress < 2000) {
            // Permitir la salida
          } else {
            setLastBackPress(now);
            window.history.pushState({ view: 'HOME', activeTab: 'home' }, '', window.location.pathname);
            window.dispatchEvent(new CustomEvent('show-exit-toast'));
          }
        } else {
          // Si estábamos en una sub-vista o modal, volver al inicio
          isInternalChange.current = true;
          setView('HOME');
          setActiveTab('home');
          setActiveCategory(null);
          setSelectedProduct(null);
          setSearchTerm('');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Estado inicial: NUNCA sobreescribir con pathname vacío si hay parámetros en la URL actual
    if (!window.history.state) {
      window.history.replaceState({ view: initialState.view, activeTab: initialState.tab }, '', window.location.href);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, activeTab, activeCategory, selectedProduct, searchTerm, lastBackPress]);

  return { 
    view, setView, activeTab, setActiveTab, tempStaffRole, setTempStaffRole,
    selectedProduct, setSelectedProduct, activeCategory, setActiveCategory,
    searchTerm, setSearchTerm,
    hasInitializedProductFromUrl, setHasInitializedProductFromUrl
  };
};

