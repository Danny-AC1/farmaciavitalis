
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AdminPanel from './components/AdminPanel';
import DriverDashboard from './components/DriverDashboard';
import Checkout from './components/Checkout';
import Assistant from './components/Assistant';
import ProductDetail from './components/ProductDetail';
import PrescriptionModal from './components/PrescriptionModal';
import AuthModal from './components/AuthModal';
import UserOrdersModal from './components/UserOrdersModal';
import FamilyHealthModal from './components/FamilyHealthModal';
import ServicesModal from './components/ServicesModal';
import ProfileModal from './components/ProfileModal';
import HomeView from './components/HomeView';
import SearchBar from './components/SearchBar';
import CartDrawer from './components/CartDrawer';

import { Product, CartItem, ViewState, Order, Category, ADMIN_PASSWORD, CASHIER_PASSWORD, DRIVER_PASSWORD, DELIVERY_FEE, CheckoutFormData, User, Banner } from './types';
import { 
  streamProducts, streamCategories, streamOrders, seedInitialData, addProductDB, updateProductDB, deleteProductDB, 
  updateStockDB, addCategoryDB, deleteCategoryDB, addOrderDB, updateOrderStatusDB, getUserDB, streamBanners, logSearch, deleteBannerDB
} from './services/db';
import { getCart, saveCart } from './services/storage';
import { checkInteractions, searchProductsBySymptoms } from './services/gemini';
import { auth } from './services/firebase';
// @ts-ignore
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, CheckCircle2, MessageCircle, ArrowRight, Home } from 'lucide-react';

const AUTHORIZED_ADMIN_EMAILS = ['danny.asc25@gmail.com', 'd.e.a.c@outlook.com'];

const getReservedStock = (productId: string, currentCart: CartItem[]) => {
  return currentCart.reduce((acc, item) => {
    if (item.id !== productId) return acc;
    const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
    return acc + (item.quantity * unitsPerItem);
  }, 0);
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserOrdersModal, setShowUserOrdersModal] = useState(false);
  const [showFamilyHealthModal, setShowFamilyHealthModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => getCart());
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

  const isSuperAdmin = currentUser ? AUTHORIZED_ADMIN_EMAILS.includes(currentUser.email) : false;

  useEffect(() => { saveCart(cart); }, [cart]);

  useEffect(() => {
    const unsubProducts = streamProducts((data) => { setProducts(data); setIsLoadingData(false); });
    const unsubCategories = streamCategories(setCategories);
    const unsubOrders = streamOrders(setOrders);
    const unsubBanners = streamBanners(setBanners);
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile = await getUserDB(firebaseUser.uid);
            if (userProfile) setCurrentUser(userProfile);
        } else { 
            setCurrentUser(null);
            setShowProfileModal(false); 
        }
    });
    seedInitialData().catch(console.error);
    return () => { unsubProducts(); unsubCategories(); unsubOrders(); unsubBanners(); unsubAuth(); };
  }, []);

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    const url = new URL(window.location.href);
    if (product) url.searchParams.set('product', product.id);
    else url.searchParams.delete('product');
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
              const found = products.filter(p => (categoryName ? p.category === categoryName : true) && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
              if (found.length === 0) logSearch(searchTerm);
          }
      }, 1000);
      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isSymptomMode, products, activeCategory, categories]);

  useEffect(() => {
      if (isCartOpen && cart.length >= 2) {
          const runCheck = async () => {
              setCheckingInteractions(true); setInteractionWarning(null);
              const result = await checkInteractions(cart.map(i => i.name));
              if (!result.safe) setInteractionWarning(result.message);
              setCheckingInteractions(false);
          };
          runCheck();
      } else setInteractionWarning(null);
  }, [cart, isCartOpen]);

  const addToCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    const quantityToAdd = unitType === 'BOX' ? (product.unitsPerBox || 1) : 1;
    if (getReservedStock(product.id, cart) + quantityToAdd > product.stock) return alert(`Stock insuficiente.`);
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id && item.selectedUnit === unitType);
      if (existingIdx > -1) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += 1;
        return newCart;
      }
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
    if (selectedProduct) handleSelectProduct(null);
  };
  
  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
        const item = prev[index];
        const product = products.find(p => p.id === item.id);
        if (!product) return prev;
        const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
        const newTotalReserved = (getReservedStock(item.id, prev) - (item.quantity * unitsPerItem)) + ((item.quantity + delta) * unitsPerItem);
        if (newTotalReserved > product.stock) return prev;
        if (item.quantity + delta < 1) return prev;
        const newCart = [...prev];
        newCart[index].quantity += delta;
        return newCart;
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) { setCurrentRole('ADMIN'); setView('ADMIN_DASHBOARD'); }
    else if (passwordInput === CASHIER_PASSWORD) { setCurrentRole('CASHIER'); setView('ADMIN_DASHBOARD'); }
    else if (passwordInput === DRIVER_PASSWORD) { setCurrentRole('DRIVER'); setView('DRIVER_DASHBOARD'); }
    else { setLoginError(true); return; }
    setPasswordInput(''); setLoginError(false);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + ((item.selectedUnit === 'BOX' ? (item.publicBoxPrice || item.boxPrice || 0) : item.price) * item.quantity), 0);
  const cartTotal = cartSubtotal + DELIVERY_FEE;

  const handleConfirmOrder = async (details: CheckoutFormData, discount: number, pointsRedeemed: number) => {
    const finalTotal = cartTotal - discount;
    const orderId = `ORD-${Date.now()}`;
    
    // 1. CONSTRUCCIÓN DEL OBJETO DE ORDEN (SIN UNDEFINED)
    const newOrder: Order = {
      id: orderId, 
      customerName: details.name, 
      customerPhone: details.phone, 
      customerAddress: `${details.address}, Machalilla`, 
      items: cart, 
      subtotal: cartSubtotal, 
      deliveryFee: DELIVERY_FEE, 
      discount: discount || 0, 
      pointsRedeemed: pointsRedeemed || 0, 
      total: finalTotal, 
      paymentMethod: details.paymentMethod, 
      status: 'PENDING', 
      source: 'ONLINE', 
      date: new Date().toISOString()
    };

    // Agregar campos opcionales solo si existen para evitar errores en Firestore
    if (currentUser?.uid) newOrder.userId = currentUser.uid;
    if (details.paymentMethod === 'CASH' && details.cashGiven) {
        const val = parseFloat(details.cashGiven);
        if (!isNaN(val)) newOrder.cashGiven = val;
    }

    // 2. CONSTRUCCIÓN DEL MENSAJE DE WHATSAPP (SÚPER DETALLADO)
    const itemsList = cart.map(item => {
        const isBox = item.selectedUnit === 'BOX';
        const label = isBox ? `Caja x${item.unitsPerBox}` : 'Unidad';
        const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
        return `✅ *${item.quantity}x* ${item.name.toUpperCase()}\n    _(${label})_ → $${(price * item.quantity).toFixed(2)}`;
    }).join('\n\n');

    const paymentText = details.paymentMethod === 'CASH' 
        ? `💵 *PAGO:* EFECTIVO\n💰 *PAGA CON:* $${parseFloat(details.cashGiven || '0').toFixed(2)}\n🔄 *CAMBIO:* $${(parseFloat(details.cashGiven || '0') - finalTotal).toFixed(2)}`
        : `🏦 *PAGO:* TRANSFERENCIA BANCARIA\n⚠️ _(Adjuntaré el comprobante a continuación)_`;

    const waMessage = 
        `💊 *NUEVO PEDIDO VITALIS* 💊\n` +
        `------------------------------------\n` +
        `📝 *ORDEN:* #${orderId.slice(-6)}\n` +
        `👤 *CLIENTE:* ${details.name.toUpperCase()}\n` +
        `📞 *TELÉFONO:* ${details.phone}\n` +
        `📍 *DIRECCIÓN:* ${details.address}, Machalilla\n` +
        `------------------------------------\n` +
        `📦 *PRODUCTOS SOLICITADOS:*\n\n${itemsList}\n` +
        `------------------------------------\n` +
        `💰 *SUBTOTAL:* $${cartSubtotal.toFixed(2)}\n` +
        `🚚 *COSTO ENVÍO:* $${DELIVERY_FEE.toFixed(2)}\n` +
        (discount > 0 ? `🎁 *DESCUENTO:* -$${discount.toFixed(2)}\n` : '') +
        `✨ *TOTAL A PAGAR: $${finalTotal.toFixed(2)}*\n` +
        `------------------------------------\n` +
        `${paymentText}\n\n` +
        `🚀 _Por favor confirmar mi pedido para el envío._`;

    const waLink = `https://wa.me/593998506160?text=${encodeURIComponent(waMessage)}`;
    setLastOrderLink(waLink);

    // 3. REGISTRO EN BASE DE DATOS Y WHATSAPP
    try {
        await addOrderDB(newOrder); // Esta función ahora limpia undefineds internamente
        
        // Actualizar Stock
        for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            if (product) {
                const unitsToSubtract = item.selectedUnit === 'BOX' ? (product.unitsPerBox || 1) * item.quantity : item.quantity;
                await updateStockDB(item.id, Math.max(0, product.stock - unitsToSubtract));
            }
        }

        setCart([]);
        setView('SUCCESS');
        window.open(waLink, '_blank');
    } catch (err) {
        console.error("Falla crítica en pedido:", err);
        alert("Hubo un error al procesar tu pedido en la base de datos. Por favor, verifica tu conexión o intenta de nuevo.");
    }
  };

  const handleTabChange = (tab: any) => {
    if (tab === 'home') { setView('HOME'); setActiveCategory(null); setIsAssistantOpen(false); }
    else if (tab === 'orders') { if (!currentUser) setShowAuthModal(true); else setShowUserOrdersModal(true); }
    else if (tab === 'assistant') setIsAssistantOpen(!isAssistantOpen);
    else if (tab === 'health') { if (!currentUser) setShowAuthModal(true); else setShowFamilyHealthModal(true); }
    else if (tab === 'services') setShowServicesModal(true);
  };

  if (isLoadingData) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={48}/></div>;

  const displayedProducts = isSymptomMode && searchTerm 
    ? products.filter(p => aiSearchResults.includes(p.id)) 
    : products.filter(p => (!activeCategory || p.category === categories.find(c => c.id === activeCategory)?.name) && (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {view !== 'ADMIN_DASHBOARD' && view !== 'DRIVER_DASHBOARD' && view !== 'SUCCESS' && (
        <Navbar 
          cartCount={cart.length} 
          onCartClick={() => setIsCartOpen(true)} 
          onAdminClick={() => setView('ADMIN_LOGIN')} 
          onLogoClick={() => { setView('HOME'); setActiveCategory(null); }} 
          onUserClick={() => !currentUser ? setShowAuthModal(true) : setShowProfileModal(true)} 
          currentUser={currentUser} 
          onTabChange={handleTabChange} 
        />
      )}

      <main className="flex-grow">
        {view === 'HOME' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} isSymptomMode={isSymptomMode} setIsSymptomMode={setIsSymptomMode} isSearchingAI={isSearchingAI} startVoiceSearch={() => alert("Búsqueda por voz activada")} />
            <HomeView banners={banners} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} displayedProducts={displayedProducts} searchTerm={searchTerm} currentUser={currentUser} isSuperAdmin={isSuperAdmin} handleDeleteBanner={deleteBannerDB} onOpenAdminPanel={() => { setCurrentRole('ADMIN'); setView('ADMIN_DASHBOARD'); }} onOpenPrescription={() => setShowPrescriptionModal(true)} onOpenServices={() => setShowServicesModal(true)} onAddToCart={addToCart} onSelectProduct={handleSelectProduct} cart={cart} />
          </div>
        )}
        {view === 'ADMIN_LOGIN' && (
           <div className="min-h-[80vh] flex items-center justify-center px-4">
              <div className="bg-white p-8 rounded-xl shadow-lg w-full max-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Acceso Personal</h2>
                <form onSubmit={handleAdminLogin}>
                  <input type="password" className="w-full border rounded-lg px-3 py-2 mb-4" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="••••" />
                  {loginError && <p className="text-red-500 text-sm mb-4">Incorrecto.</p>}
                  <button className="w-full bg-teal-600 text-white font-bold py-2 rounded-lg">Ingresar</button>
                </form>
              </div>
           </div>
        )}
        {view === 'ADMIN_DASHBOARD' && <AdminPanel products={products} categories={categories} orders={orders} onAddProduct={addProductDB} onEditProduct={updateProductDB} onDeleteProduct={deleteProductDB} onUpdateStock={updateStockDB} onAddCategory={addCategoryDB} onDeleteCategory={deleteCategoryDB} onAddOrder={addOrderDB} onUpdateOrderStatus={updateOrderStatusDB} onLogout={() => setView('HOME')} currentUserRole={currentRole} />}
        {view === 'DRIVER_DASHBOARD' && <DriverDashboard orders={orders} onLogout={() => setView('HOME')} />}
        {view === 'CHECKOUT' && <Checkout cart={cart} subtotal={cartSubtotal} total={cartTotal} onConfirmOrder={handleConfirmOrder} onCancel={() => setView('HOME')} currentUser={currentUser} />}
        {view === 'SUCCESS' && (
            <div className="min-h-screen flex items-center justify-center bg-teal-50 p-4 animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl border border-teal-100">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce">
                        <CheckCircle2 size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 uppercase tracking-tighter">¡Pedido Recibido!</h2>
                    <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">Gracias por confiar en <strong>Farmacia Vitalis</strong>. Tu pedido ha sido registrado correctamente y lo estamos preparando.</p>
                    
                    <div className="space-y-4">
                        {lastOrderLink && (
                            <a 
                                href={lastOrderLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <MessageCircle size={20}/> Abrir WhatsApp de nuevo
                            </a>
                        )}
                        <button 
                            onClick={() => setView('HOME')} 
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                        >
                            <Home size={20}/> Volver al Inicio <ArrowRight size={18}/>
                        </button>
                    </div>
                    
                    <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Vitalis Machalilla - Tu Salud Al Día</p>
                </div>
            </div>
        )}
      </main>

      <Assistant products={products} isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      {view !== 'SUCCESS' && (
        <>
          <BottomNav activeTab={isAssistantOpen ? 'assistant' : 'home'} cartCount={cart.length} onTabChange={handleTabChange} onCartClick={() => setIsCartOpen(true)} />
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} updateQuantity={updateQuantity} removeFromCart={(idx) => setCart(prev => prev.filter((_, i) => i !== idx))} subtotal={cartSubtotal} total={cartTotal} onCheckout={() => { setIsCartOpen(false); setView('CHECKOUT'); }} checkingInteractions={checkingInteractions} interactionWarning={interactionWarning} />
        </>
      )}
      
      {selectedProduct && <ProductDetail product={selectedProduct} products={products} cart={cart} onClose={() => handleSelectProduct(null)} onAddToCart={addToCart} currentUserEmail={currentUser?.email} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      {showProfileModal && currentUser && <ProfileModal user={currentUser} onClose={() => setShowProfileModal(false)} />}
      {showPrescriptionModal && <PrescriptionModal onClose={() => setShowPrescriptionModal(false)} />}
      {showServicesModal && <ServicesModal user={currentUser} onClose={() => setShowServicesModal(false)} onLoginRequest={() => setShowAuthModal(true)} />}
      {showUserOrdersModal && currentUser && <UserOrdersModal user={currentUser} products={products} onClose={() => setShowUserOrdersModal(false)} onReorder={(o) => { o.items.forEach(i => addToCart(i)); setIsCartOpen(true); }} />}
      {showFamilyHealthModal && currentUser && <FamilyHealthModal user={currentUser} products={products} onClose={() => setShowFamilyHealthModal(false)} onAddToCart={addToCart} />}
    </div>
  );
};

export default App;
