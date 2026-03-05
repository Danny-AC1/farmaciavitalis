import { useState, useEffect, useRef } from 'react';
import { ViewState, User, Product } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'assistant' | 'health' | 'services'>(initialState.tab);
  const [tempStaffRole, setTempStaffRole] = useState<User['role'] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(initialState.category);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    
    const state = { 
      view, 
      activeTab, 
      activeCategory, 
      selectedProductId: selectedProduct?.id,
      searchTerm 
    };

    // Si estamos en el inicio y no hay nada seleccionado, usamos replaceState para no llenar el historial
    if (view === 'HOME' && activeTab === 'home' && !activeCategory && !selectedProduct) {
      window.history.replaceState(state, '', newUrl);
    } else {
      window.history.pushState(state, '', newUrl);
    }
  }, [view, activeTab, activeCategory, selectedProduct]); // Excluimos searchTerm para no llenar el historial con cada letra

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
            // Permitir la salida (en web esto suele significar ir a la página anterior fuera del sitio)
            // No podemos forzar el cierre de la pestaña, pero dejamos que el historial siga su curso
          } else {
            setLastBackPress(now);
            // Mostramos un aviso discreto (usando alert por ahora, se puede mejorar con un toast)
            // alert("Presione de nuevo para salir");
            
            // Volvemos a meter el estado para "atrapar" el siguiente botón atrás
            window.history.pushState({ view: 'HOME', activeTab: 'home' }, '', window.location.pathname);
            
            // Disparamos un evento personalizado para que App.tsx pueda mostrar un mensaje
            window.dispatchEvent(new CustomEvent('show-exit-toast'));
          }
        } else {
          // Si estábamos en una sub-vista, volver al inicio
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
    
    // Estado inicial
    if (!window.history.state) {
      window.history.replaceState({ view: 'HOME', activeTab: 'home' }, '', window.location.pathname);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, activeTab, activeCategory, selectedProduct, searchTerm, lastBackPress]);

  return { 
    view, setView, activeTab, setActiveTab, tempStaffRole, setTempStaffRole,
    selectedProduct, setSelectedProduct, activeCategory, setActiveCategory,
    searchTerm, setSearchTerm
  };
};
