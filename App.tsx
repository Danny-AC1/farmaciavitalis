
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AdminPanel from './components/AdminPanel';
import DriverDashboard from './components/DriverDashboard';
import BlogSection from './components/BlogSection';
import Checkout from './components/Checkout';
import Assistant from './components/Assistant';
import ProductDetail from './components/ProductDetail';
import PrescriptionModal from './components/PrescriptionModal';
import AuthModal from './components/AuthModal';
import UserOrdersModal from './components/UserOrdersModal';
import FamilyHealthModal from './components/FamilyHealthModal';
import ServicesModal from './components/ServicesModal';

import { Product, CartItem, ViewState, Order, Category, ADMIN_PASSWORD, CASHIER_PASSWORD, DRIVER_PASSWORD, DELIVERY_FEE, DELIVERY_CITY, CheckoutFormData, User, Banner } from './types';
import { 
  streamProducts, 
  streamCategories, 
  streamOrders, 
  seedInitialData, 
  addProductDB, 
  updateProductDB, 
  deleteProductDB, 
  updateStockDB, 
  addCategoryDB, 
  deleteCategoryDB, 
  addOrderDB, 
  updateOrderStatusDB, 
  getUserDB, 
  streamBanners, 
  logSearch,
  deleteBannerDB
} from './services/db';
import { checkInteractions, searchProductsBySymptoms } from './services/gemini';
import { auth } from './services/firebase';
// @ts-ignore
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Minus, Search, ShoppingBag, X, ArrowLeft, Loader2, MessageCircle, Camera, Mic, AlertTriangle, ShieldCheck, CheckCircle, Stethoscope, Sparkles, Pill, Activity, Sun, HeartPulse, Baby, BriefcaseMedical, Edit, Trash2 } from 'lucide-react';

const AUTHORIZED_ADMIN_EMAILS = ['danny.asc25@gmail.com', 'd.e.a.c@outlook.com'];

const getReservedStock = (productId: string, currentCart: CartItem[]) => {
  return currentCart.reduce((acc, item) => {
    if (item.id !== productId) return acc;
    const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
    return acc + (item.quantity * unitsPerItem);
  }, 0);
};

const getCategoryStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('medicamento') || n.includes('farmacia')) return { 
    icon: Pill, 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-100',
    accent: 'bg-blue-200'
  };
  if (n.includes('vitamina') || n.includes('suplemento')) return { 
    icon: Sun, 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    border: 'border-orange-100',
    accent: 'bg-orange-200'
  };
  if (n.includes('auxilio') || n.includes('herida')) return { 
    icon: BriefcaseMedical, 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-100',
    accent: 'bg-red-200'
  };
  if (n.includes('cuidado') || n.includes('personal') || n.includes('piel')) return { 
    icon: Sparkles, 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    border: 'border-purple-100',
    accent: 'bg-purple-200'
  };
  if (n.includes('bebé') || n.includes('materno')) return { 
    icon: Baby, 
    bg: 'bg-pink-50', 
    text: 'text-pink-700', 
    border: 'border-pink-100',
    accent: 'bg-pink-200'
  };
  if (n.includes('sexual') || n.includes('intimo')) return { 
    icon: HeartPulse, 
    bg: 'bg-rose-50', 
    text: 'text-rose-700', 
    border: 'border-rose-100',
    accent: 'bg-rose-200'
  };
  
  return { 
    icon: Activity, 
    bg: 'bg-teal-50', 
    text: 'text-teal-700', 
    border: 'border-teal-100',
    accent: 'bg-teal-200'
  };
};

interface ProductCardProps {
  product: Product;
  cart: CartItem[];
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  onSelect: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, cart, onAddToCart, onSelect }) => {
  const reserved = getReservedStock(product.id, cart);
  const available = Math.max(0, product.stock - reserved);
  
  return (
      <div 
          onClick={() => onSelect(product)}
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer group transform hover:-translate-y-1"
      >
          <div className="h-48 bg-gray-50 overflow-hidden relative">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 mix-blend-multiply" />
              {available <= 0 && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-red-500 text-white px-3 py-1 font-bold rounded shadow-lg transform -rotate-6">AGOTADO</span>
              </div>
              )}
          </div>
          <div className="p-5 flex flex-col flex-grow relative">
              <div className="flex-grow">
                  <h4 className="font-bold text-lg text-gray-900 mb-1 leading-tight group-hover:text-teal-600 transition-colors">{product.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-teal-700">${product.price.toFixed(2)}</span>
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product, 'UNIT');
                          }}
                          disabled={available <= 0}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-1 ${available > 0 ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                          <Plus className="h-4 w-4" />
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [currentRole, setCurrentRole] = useState<'ADMIN'|'CASHIER'|'DRIVER'|'USER'>('USER');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserOrdersModal, setShowUserOrdersModal] = useState(false);
  const [showFamilyHealthModal, setShowFamilyHealthModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSymptomMode, setIsSymptomMode] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<string[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [lastOrderLink, setLastOrderLink] = useState('');

  const isSuperAdmin = currentUser && AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email);

  useEffect(() => {
    const unsubProducts = streamProducts((data) => {
        setProducts(data);
        if (data.length >= 0) setIsLoadingData(false); 
    });
    
    const unsubCategories = streamCategories((data) => {
        setCategories(data);
    });

    const unsubOrders = streamOrders((data) => setOrders(data));
    const unsubBanners = streamBanners((data) => setBanners(data));
    
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile = await getUserDB(firebaseUser.uid);
            if (userProfile) setCurrentUser(userProfile);
        } else {
            setCurrentUser(null);
        }
    });

    seedInitialData().catch(console.error);

    const timer = setTimeout(() => setIsLoadingData(false), 3000);

    return () => { 
        unsubProducts(); 
        unsubCategories(); 
        unsubOrders(); 
        unsubBanners(); 
        unsubAuth(); 
        clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const productId = params.get('product');
      if (productId && (!selectedProduct || selectedProduct.id !== productId)) {
        const product = products.find(p => p.id === productId);
        if (product) setSelectedProduct(product);
      }
    }
  }, [products]);

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    const url = new URL(window.location.href);
    if (product) {
      url.searchParams.set('product', product.id);
    } else {
      url.searchParams.delete('product');
    }
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
      if (!searchTerm) { setAiSearchResults([]); return; }
      const delayDebounceFn = setTimeout(async () => {
          if (isSymptomMode && searchTerm.length > 3) {
              setIsSearchingAI(true);
              const ids = await searchProductsBySymptoms(searchTerm, products);
              setAiSearchResults(ids);
              setIsSearchingAI(false);
          } else if (!isSymptomMode) {
              const categoryName = activeCategory ? categories.find(c => c.id === activeCategory)?.name : null;
              let found = [];
              if (categoryName) {
                  found = products.filter(p => p.category === categoryName && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
              } else {
                  found = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
              }
              if (found.length === 0) logSearch(searchTerm);
          }
      }, 1000);
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isSymptomMode, products, activeCategory, categories]);

  useEffect(() => {
      if (isCartOpen && cart.length >= 2) {
          const runCheck = async () => {
              setCheckingInteractions(true);
              setInteractionWarning(null);
              const names = cart.map(i => i.name);
              const result = await checkInteractions(names);
              if (!result.safe) setInteractionWarning(result.message);
              setCheckingInteractions(false);
          };
          runCheck();
      } else { setInteractionWarning(null); }
  }, [cart, isCartOpen]);

  const addToCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    const quantityToAdd = unitType === 'BOX' ? (product.unitsPerBox || 1) : 1;
    const currentReserved = getReservedStock(product.id, cart);
    if (currentReserved + quantityToAdd > product.stock) return alert(`Stock insuficiente.`);
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id && item.selectedUnit === unitType);
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 };
        return newCart;
      }
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
    if (selectedProduct) handleSelectProduct(null);
  };
  
  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));
  
  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
        const item = prev[index];
        const product = products.find(p => p.id === item.id);
        if (!product) return prev;
        const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
        const otherItemsReserved = getReservedStock(item.id, prev) - (item.quantity * unitsPerItem);
        const newQty = item.quantity + delta;
        const newTotalReserved = otherItemsReserved + (newQty * unitsPerItem);
        if (newTotalReserved > product.stock) { alert("Stock máximo alcanzado."); return prev; }
        if (newQty < 1) return prev;
        const newCart = [...prev];
        newCart[index] = { ...item, quantity: newQty };
        return newCart;
    });
  };
  
  const handleReorder = (order: Order) => {
      let itemsAdded = 0;
      order.items.forEach(item => {
          const product = products.find(p => p.id === item.id);
          if (product && product.stock > 0) { addToCart(product, item.selectedUnit); itemsAdded++; }
      });
      if (itemsAdded > 0) { setShowUserOrdersModal(false); setIsCartOpen(true); } else { alert("Productos no disponibles."); }
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.start();
      recognition.onresult = (event: any) => { setSearchTerm(event.results[0][0].transcript); };
    } else { alert("Tu navegador no soporta búsqueda por voz."); }
  };

  // Cálculo corregido para usar publicBoxPrice
  const cartSubtotal = cart.reduce((sum, item) => {
      const isBox = item.selectedUnit === 'BOX';
      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
  }, 0);
  const cartTotal = cartSubtotal + DELIVERY_FEE;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setCurrentRole('ADMIN'); setView('ADMIN_DASHBOARD');
    } else if (passwordInput === CASHIER_PASSWORD) {
      setCurrentRole('CASHIER'); setView('ADMIN_DASHBOARD');
    } else if (passwordInput === DRIVER_PASSWORD) {
      setCurrentRole('DRIVER'); setView('DRIVER_DASHBOARD');
    } else {
      setLoginError(true); return;
    }
    setPasswordInput(''); setLoginError(false);
  };

  const handleAddProduct = async (product: Product) => { await addProductDB(product); };
  const handleEditProduct = async (updatedProduct: Product) => { await updateProductDB(updatedProduct); };
  const handleDeleteProduct = async (id: string) => { await deleteProductDB(id); };
  const handleUpdateStock = async (id: string, newStock: number) => { await updateStockDB(id, newStock); };
  const handleAddCategory = async (category: Category) => { await addCategoryDB(category); };
  const handleDeleteCategory = async (id: string) => { await deleteCategoryDB(id); };

  const handleAddOrder = async (newOrder: Order) => {
    await addOrderDB(newOrder);
    if (newOrder.source === 'ONLINE') {
        newOrder.items.forEach(item => {
            const current = products.find(p => p.id === item.id);
            if (current) {
                const deduction = item.quantity * (item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1);
                updateStockDB(item.id, Math.max(0, current.stock - deduction));
            }
        });
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: 'DELIVERED', order: Order) => {
    await updateOrderStatusDB(id, status, order);
  };

  const handleConfirmOrder = (details: CheckoutFormData, discount: number, pointsRedeemed: number) => {
    const cashGivenValue = details.cashGiven ? parseFloat(details.cashGiven) : undefined;
    const finalTotal = cartTotal - discount;
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      customerName: details.name,
      customerPhone: details.phone,
      customerAddress: `${details.address}, ${DELIVERY_CITY}`,
      items: cart,
      subtotal: cartSubtotal,
      deliveryFee: DELIVERY_FEE,
      discount: discount,
      pointsRedeemed: pointsRedeemed,
      total: finalTotal,
      paymentMethod: details.paymentMethod,
      cashGiven: cashGivenValue, 
      status: 'PENDING',
      source: 'ONLINE',
      date: new Date().toISOString(),
      userId: currentUser?.uid
    };
    const phoneNumber = "593998506160"; 
    const itemsList = cart.map(item => {
        const isBox = item.selectedUnit === 'BOX';
        const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
        const unitLabel = isBox ? `Caja x${item.unitsPerBox}` : 'Unid';
        return `- ${item.quantity} x ${item.name} (${unitLabel}): $${(price * item.quantity).toFixed(2)}`;
    }).join('\n');
    
    let paymentInfo = details.paymentMethod === 'CASH' ? '*EFECTIVO* 💵' : '*TRANSFERENCIA BANCARIA* 🏦';
    if (details.paymentMethod === 'CASH' && cashGivenValue) {
        const change = cashGivenValue - finalTotal;
        paymentInfo += `\n*Paga con:* $${cashGivenValue.toFixed(2)}\n*Cambio sugerido:* $${change.toFixed(2)}`;
    }
    
    const message = `*NUEVO PEDIDO WEB - VITALIS* 💊\n\n` +
                    `*Cliente:* ${details.name}\n` +
                    `*Tel:* ${details.phone}\n` +
                    `*Dir:* ${details.address}, ${DELIVERY_CITY}\n\n` +
                    `*MÉTODO DE PAGO:* ${paymentInfo}\n\n` +
                    `*DETALLE DEL PEDIDO:*\n${itemsList}\n\n` +
                    `*Subtotal:* $${cartSubtotal.toFixed(2)}\n` +
                    `*Envío Machalilla:* $${DELIVERY_FEE.toFixed(2)}\n` +
                    `${discount > 0 ? `*Descuento:* -$${discount.toFixed(2)}\n` : ''}` +
                    `*TOTAL A PAGAR:* $${finalTotal.toFixed(2)}\n\n` +
                    `${details.paymentMethod === 'TRANSFER' ? '⚠️ *IMPORTANTE:* Por favor, adjunte el comprobante de transferencia a este chat para procesar su pedido.' : '🛵 El repartidor llevará cambio para el monto indicado.'}\n\n` +
                    `_¡Gracias por confiar en Vitalis! Tu salud al día._`;

    const link = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    setLastOrderLink(link);
    window.open(link, '_blank');
    handleAddOrder(newOrder);
    setCart([]);
    setView('SUCCESS');
  };

  const handleBottomNavChange = (tab: 'home' | 'orders' | 'assistant' | 'health' | 'services') => {
    if (tab === 'home') { setView('HOME'); setActiveCategory(null); setIsAssistantOpen(false); } 
    else if (tab === 'orders') { if (!currentUser) setShowAuthModal(true); else setShowUserOrdersModal(true); setIsAssistantOpen(false); } 
    else if (tab === 'assistant') setIsAssistantOpen(!isAssistantOpen); 
    else if (tab === 'health') { if (!currentUser) setShowAuthModal(true); else setShowFamilyHealthModal(true); setIsAssistantOpen(false); } 
    else if (tab === 'services') { setShowServicesModal(true); setIsAssistantOpen(false); }
  };

  const handleUserClick = () => {
      if (!currentUser) setShowAuthModal(true); else {
          const action = window.prompt(`Hola ${currentUser.displayName}. \n\nEscribe '1' para ver tus pedidos.\nEscribe '2' para cerrar sesión.`);
          if (action === '1') setShowUserOrdersModal(true); else if (action === '2') { auth.signOut(); window.location.reload(); }
      }
  };

  if (isLoadingData) return (<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-12 w-12 text-teal-600 animate-spin" /></div>);

  const categoryName = activeCategory ? categories.find(c => c.id === activeCategory)?.name || activeCategory : '';
  let displayedProducts: Product[] = [];
  if (isSymptomMode && searchTerm) {
      if (aiSearchResults.length > 0) displayedProducts = products.filter(p => aiSearchResults.includes(p.id));
      else displayedProducts = []; 
  } else if (searchTerm) {
      displayedProducts = products.filter(p => (activeCategory ? p.category === categoryName : true) && (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())));
  } else if (activeCategory) displayedProducts = products.filter(p => p.category === categoryName);

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDeleteBanner = async (id: string) => {
      if(window.confirm('¿Eliminar este banner de la pantalla de inicio?')) {
          await deleteBannerDB(id);
      }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {view !== 'ADMIN_DASHBOARD' && view !== 'DRIVER_DASHBOARD' && (
        <Navbar cartCount={cart.length} onCartClick={() => setIsCartOpen(true)} onAdminClick={() => setView('ADMIN_LOGIN')} onLogoClick={() => { setView('HOME'); setActiveCategory(null); }} onUserClick={handleUserClick} currentUser={currentUser} onTabChange={handleBottomNavChange} />
      )}

      <main className="flex-grow">
        {view === 'HOME' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
                <div className="relative w-full mb-8 z-30 sticky top-16 bg-gray-50 pt-2 pb-2 transition-all">
                    <div className="relative flex gap-2">
                        <button onClick={() => { setIsSymptomMode(!isSymptomMode); setSearchTerm(''); setAiSearchResults([]); }} className={`p-3 rounded-xl shadow-md transition-all flex items-center justify-center ${isSymptomMode ? 'bg-purple-600 text-white' : 'bg-white text-gray-400 hover:text-purple-600'}`} title={isSymptomMode ? "Volver a búsqueda normal" : "Activar búsqueda por síntomas"}><Stethoscope className="h-6 w-6" /></button>
                        <div className="relative flex-grow">
                            <input type="text" placeholder={isSymptomMode ? "¿Qué malestar sientes? (Ej: tengo fiebre)" : (activeCategory ? `Buscar en ${categoryName}...` : "Buscar productos...")} className={`w-full pl-12 pr-14 py-4 rounded-xl border transition-all text-lg shadow-md focus:outline-none focus:ring-2 ${isSymptomMode ? 'border-purple-200 focus:ring-purple-500 bg-purple-50 text-purple-900 placeholder-purple-300' : 'border-gray-200 focus:ring-teal-500 bg-white text-gray-900'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none ${isSymptomMode ? 'text-purple-500' : 'text-gray-400'}`}>{isSearchingAI ? <Loader2 className="h-6 w-6 animate-spin"/> : (isSymptomMode ? <Sparkles className="h-6 w-6"/> : <Search className="h-6 w-6" />)}</div>
                            <button onClick={startVoiceSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full transition-colors" title="Buscar por voz"><Mic className={`h-5 w-5 ${isSymptomMode ? 'text-purple-600' : 'text-gray-600'}`} /></button>
                        </div>
                    </div>
                    {isSymptomMode && <p className="text-xs text-purple-600 font-bold mt-1 ml-14 flex items-center gap-1 animate-in fade-in"><Sparkles className="h-3 w-3"/> IA Triage Activo: Describe tus síntomas.</p>}
                </div>

                {activeCategory ? (
                    <div className="animate-in fade-in">
                        <button onClick={() => setActiveCategory(null)} className="flex items-center text-teal-600 font-bold mb-6 hover:text-teal-800 transition-colors"><ArrowLeft className="h-5 w-5 mr-1" /> Volver a Categorías</button>
                        <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center"><span className="bg-teal-100 text-teal-800 px-3 py-1 rounded text-lg mr-3">{categoryName}</span> Productos</h3>
                        {displayedProducts.length === 0 ? (<div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100"><ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" /><p className="text-gray-500 text-lg">No hay productos aquí.</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{displayedProducts.map(product => (<ProductCard key={product.id} product={product} cart={cart} onAddToCart={addToCart} onSelect={handleSelectProduct} />))}</div>)}
                    </div>
                ) : (
                    <div className="animate-in fade-in">
                        {!searchTerm && (
                            <div className="mb-8 relative">
                                {banners.length > 0 ? (
                                    <div className="w-full overflow-x-auto snap-x snap-mandatory flex rounded-2xl shadow-xl no-scrollbar h-48 md:h-64 bg-teal-800">
                                        {banners.map(b => (
                                            <div key={b.id} className="snap-center min-w-full relative shrink-0 group">
                                                <img src={b.image} className="w-full h-full object-cover" />
                                                {b.title && <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4"><h3 className="text-white font-bold text-xl md:text-3xl">{b.title}</h3></div>}
                                                {isSuperAdmin && (
                                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleDeleteBanner(b.id)} className="bg-white/90 p-2 rounded-full text-red-500 hover:bg-white shadow-lg"><Trash2 size={18}/></button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-teal-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                        <div className="relative z-10"><h2 className="text-4xl font-extrabold mb-4">Bienvenido {currentUser ? `, ${currentUser.displayName.split(' ')[0]}` : 'a Vitalis'}</h2><p className="text-teal-100 text-lg max-w-xl">Encuentra todo lo que necesitas para tu salud en Machalilla.</p></div>
                                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4"><ShoppingBag size={300} /></div>
                                    </div>
                                )}
                                {isSuperAdmin && (
                                    <div className="mt-2 flex justify-end">
                                        <button onClick={() => {setCurrentRole('ADMIN'); setView('ADMIN_DASHBOARD'); }} className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-teal-200"><Edit size={12}/> Administrar Banners</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!searchTerm && (
                            <div className="mb-12 flex flex-col sm:flex-row justify-center gap-4">
                                <button onClick={() => setShowPrescriptionModal(true)} className="flex-1 bg-white border-2 border-teal-500 text-teal-700 hover:bg-teal-50 px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105 active:scale-95"><Camera className="h-6 w-6" /> Subir Receta Médica</button>
                                <button onClick={() => setShowServicesModal(true)} className="flex-1 bg-white border-2 border-blue-500 text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105 active:scale-95"><Stethoscope className="h-6 w-6" /> Consultorio / Servicios</button>
                            </div>
                        )}

                        {filteredCategories.length > 0 && !searchTerm && (
                            <>
                                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-teal-500 pl-4">Nuestras Categorías</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">{filteredCategories.map(category => { const style = getCategoryStyle(category.name); return (<div key={category.id} onClick={() => { setActiveCategory(category.id); setSearchTerm(''); }} className={`cursor-pointer ${style.bg} border ${style.border} rounded-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-32 md:h-40 relative overflow-hidden group`}><div className="relative z-10"><div className={`p-2 rounded-xl w-fit mb-3 ${style.accent} bg-opacity-50`}><style.icon className={`h-6 w-6 md:h-8 md:w-8 ${style.text}`} /></div><h4 className={`font-bold text-sm md:text-lg ${style.text}`}>{category.name}</h4></div><style.icon className={`absolute -right-4 -bottom-4 h-24 w-24 ${style.text} opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500`} /></div>);})}</div>
                            </>
                        )}

                        {searchTerm && (
                            <div className="animate-in slide-in-from-bottom-5 duration-500">
                                <h3 className={`text-2xl font-bold mb-6 border-l-4 pl-4 ${isSymptomMode ? 'text-purple-800 border-purple-500' : 'text-gray-800 border-teal-500'}`}>{isSymptomMode ? 'Sugerencias Médicas (IA)' : 'Resultados de Búsqueda'}</h3>
                                {isSearchingAI ? (<div className="text-center py-20"><Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" /><p className="text-purple-600 font-bold">Analizando síntomas con IA...</p></div>) : displayedProducts.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">{displayedProducts.map(product => (<ProductCard key={product.id} product={product} cart={cart} onAddToCart={addToCart} onSelect={handleSelectProduct} />))}</div>) : (<div className="text-center py-20 animate-in fade-in"><p className="text-gray-400 text-lg">{isSymptomMode ? "No encontramos tratamientos exactos para eso." : `No encontramos productos con "${searchTerm}"`}</p><button onClick={() => { setSearchTerm(''); setIsSymptomMode(false); }} className="mt-4 text-teal-600 font-bold hover:underline">Ver todo el catálogo</button></div>)}
                            </div>
                        )}

                        {!searchTerm && !activeCategory && (
                            <BlogSection 
                                isAuthorized={isSuperAdmin || false} 
                                onOpenAdminPanel={() => { setCurrentRole('ADMIN'); setView('ADMIN_DASHBOARD'); }}
                            />
                        )}
                    </div>
                )}
            </div>
        )}
        
        {view === 'ADMIN_LOGIN' && (
           <div className="min-h-[80vh] flex items-center justify-center px-4"><div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-teal-600"><h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Acceso Personal</h2><form onSubmit={handleAdminLogin}><div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label><input type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••" /></div>{loginError && <p className="text-red-500 text-sm mb-4">Contraseña incorrecta.</p>}<button className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition">Ingresar</button><button type="button" onClick={() => setView('HOME')} className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700">Volver al Catálogo</button></form></div></div>
        )}

        {view === 'ADMIN_DASHBOARD' && (
          <AdminPanel products={products} categories={categories} orders={orders} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} onUpdateStock={handleUpdateStock} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} onAddOrder={handleAddOrder} onUpdateOrderStatus={handleUpdateOrderStatus} onLogout={() => { setView('HOME'); setActiveCategory(null); setCurrentRole('USER'); }} currentUserRole={currentRole} />
        )}

        {view === 'DRIVER_DASHBOARD' && (<DriverDashboard orders={orders} onLogout={() => { setView('HOME'); setCurrentRole('USER'); }} />)}
        {view === 'CHECKOUT' && (<Checkout cart={cart} subtotal={cartSubtotal} total={cartTotal} onConfirmOrder={handleConfirmOrder} onCancel={() => setView('HOME')} currentUser={currentUser} />)}
        {view === 'SUCCESS' && (<div className="min-h-[80vh] flex items-center justify-center px-4"><div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-lg"><div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6"><ShoppingBag className="h-10 w-10 text-green-600" /></div><h2 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Recibido!</h2><p className="text-gray-600 mb-6">Gracias por comprar en Vitalis. <br/>Recuerda enviar el detalle por WhatsApp.</p>{lastOrderLink && (<a href={lastOrderLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition mb-4 flex items-center justify-center gap-2"><MessageCircle className="h-5 w-5" /> Enviar detalles por WhatsApp</a>)}<button onClick={() => { setView('HOME'); setActiveCategory(null); }} className="block w-full bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 transition">Volver a la Tienda</button></div></div>)}
      </main>

      {selectedProduct && <ProductDetail product={selectedProduct} products={products} cart={cart} onClose={() => handleSelectProduct(null)} onAddToCart={addToCart} currentUserEmail={currentUser?.email} />}
      {showAuthModal && (<AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); alert("¡Bienvenido!"); }} />)}
      {showPrescriptionModal && <PrescriptionModal onClose={() => setShowPrescriptionModal(false)} />}
      {showServicesModal && (<ServicesModal user={currentUser} onClose={() => setShowServicesModal(false)} onLoginRequest={() => { setShowServicesModal(false); setShowAuthModal(true); }} />)}
      {showUserOrdersModal && currentUser && (<UserOrdersModal user={currentUser} products={products} onClose={() => setShowUserOrdersModal(false)} onReorder={handleReorder} />)}
      {showFamilyHealthModal && currentUser && (<FamilyHealthModal user={currentUser} products={products} onClose={() => setShowFamilyHealthModal(false)} onAddToCart={addToCart} />)}

      {view === 'HOME' && (
         <>
            <button onClick={() => setIsAssistantOpen(!isAssistantOpen)} className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 items-center justify-center hidden md:flex ${isAssistantOpen ? 'bg-red-500 rotate-90' : 'bg-teal-600 hover:bg-teal-700'}`}>{isAssistantOpen ? <X className="text-white h-8 w-8" /> : <MessageCircle className="text-white h-8 w-8" />}</button>
            <Assistant products={products} isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
         </>
      )}

      {view === 'HOME' && <BottomNav activeTab={isAssistantOpen ? 'assistant' : showFamilyHealthModal ? 'health' : 'home'} cartCount={cart.length} onTabChange={handleBottomNavChange} onCartClick={() => { setIsCartOpen(true); setIsAssistantOpen(false); }} />}

      {isCartOpen && view === 'HOME' && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300">
                <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                  <div className="flex items-start justify-between"><h2 className="text-lg font-medium text-gray-900">Carrito</h2><button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button></div>
                  {cart.length >= 2 && (<div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200"><div className="flex items-center gap-2 mb-1"><ShieldCheck className="h-4 w-4 text-teal-600"/><span className="text-xs font-bold text-gray-600 uppercase">Seguridad Farmacéutica</span></div>{checkingInteractions ? (<div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-3 w-3 animate-spin"/> Analizando interacciones...</div>) : interactionWarning ? (<div className="bg-red-50 p-2 rounded text-xs text-red-700 border border-red-200 flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0"/><span>{interactionWarning}</span></div>) : (<p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Combinación segura detectada.</p>)}</div>)}
                  <div className="mt-8">{cart.length === 0 ? <p className="text-gray-500 text-center">Vacío.</p> : (<ul className="divide-y divide-gray-200">{cart.map((item, idx) => { const isBox = item.selectedUnit === 'BOX'; const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price; return (<li key={`${item.id}-${idx}`} className="py-6 flex"><img src={item.image} className="h-20 w-20 rounded border object-contain mix-blend-multiply" /><div className="ml-4 flex-1 flex flex-col"><div><div className="flex justify-between text-base font-medium text-gray-900"><h3>{item.name}</h3><p className="ml-4">${(price * item.quantity).toFixed(2)}</p></div>{isBox && <span className="bg-blue-100 text-blue-800 text-[10px] px-1 rounded">Caja x${item.unitsPerBox}</span>}</div><div className="flex-1 flex items-end justify-between text-sm"><div className="flex items-center border rounded-md"><button onClick={() => updateQuantity(idx, -1)} className="p-1"><Minus className="h-4 w-4" /></button><span className="px-2">{item.quantity}</span><button onClick={() => updateQuantity(idx, 1)} className="p-1"><Plus className="h-4 w-4" /></button></div><button onClick={() => removeFromCart(idx)} className="text-red-600">Eliminar</button></div></div></li>); })}</ul>)}</div>
                </div>
                {cart.length > 0 && (<div className="border-t border-gray-200 py-6 px-4 sm:px-6 bg-gray-50"><div className="flex justify-between text-base font-medium text-gray-900 mb-2"><p>Subtotal</p><p>${cartSubtotal.toFixed(2)}</p></div><div className="flex justify-between text-sm text-gray-500 mb-4"><p>Envío</p><p>${DELIVERY_FEE.toFixed(2)}</p></div><div className="flex justify-between text-xl font-bold text-teal-700 mb-6 border-t pt-2"><p>Total</p><p>${cartTotal.toFixed(2)}</p></div><button onClick={() => { setIsCartOpen(false); setView('CHECKOUT'); }} className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-teal-600 hover:bg-teal-700">Pagar Ahora</button></div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
