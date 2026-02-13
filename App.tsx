
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Product, Category, Order, User, CartItem, ViewState, 
  DELIVERY_FEE, CheckoutFormData,
} from './types';
import { 
  streamProducts, streamCategories, streamOrders, addOrderDB, 
  updateStockDB, getUserDB, addProductDB, updateProductDB, 
  deleteProductDB, addCategoryDB, deleteCategoryDB, updateOrderStatusDB,
  streamBanners, deleteBannerDB
} from './services/db';
import { auth } from './services/firebase';
import { searchProductsBySymptoms, checkInteractions } from './services/gemini';
import { CheckCircle } from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import CartDrawer from './components/CartDrawer';
import ProductDetail from './components/ProductDetail';
import Checkout from './components/Checkout';
import AdminPanel from './components/AdminPanel';
import DriverDashboard from './components/DriverDashboard';
import BottomNav from './components/BottomNav';
import SearchBar from './components/SearchBar';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import UserOrdersModal from './components/UserOrdersModal';
import PrescriptionModal from './components/PrescriptionModal';
import ServicesModal from './components/ServicesModal';
import Assistant from './components/Assistant';
import FamilyHealthModal from './components/FamilyHealthModal';
import StaffAccessModal from './components/StaffAccessModal';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tempStaffRole, setTempStaffRole] = useState<User['role'] | null>(null);

  const [view, setView] = useState<ViewState>('HOME');
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'assistant' | 'health' | 'services'>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showStaffAccess, setShowStaffAccess] = useState(false);

  const [isSymptomMode, setIsSymptomMode] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = await getUserDB(user.uid);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
    });

    const unsubProducts = streamProducts(setProducts);
    const unsubCategories = streamCategories(setCategories);
    const unsubOrders = streamOrders(setOrders);
    const unsubBanners = streamBanners(setBanners);

    return () => {
      unsubAuth(); unsubProducts(); unsubCategories(); unsubOrders(); unsubBanners();
    };
  }, []);

  useEffect(() => {
    if (isSymptomMode && searchTerm.length > 3) {
      const timer = setTimeout(async () => {
        setIsSearchingAI(true);
        const ids = await searchProductsBySymptoms(searchTerm, products);
        setAiResults(ids);
        setIsSearchingAI(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setAiResults([]);
    }
  }, [searchTerm, isSymptomMode, products]);

  useEffect(() => {
    if (cart.length >= 2) {
      const check = async () => {
        setCheckingInteractions(true);
        const names = cart.map(i => i.name);
        const result = await checkInteractions(names);
        setInteractionWarning(result.safe ? null : result.message);
        setCheckingInteractions(false);
      };
      check();
    } else {
      setInteractionWarning(null);
    }
  }, [cart]);

  const subtotal = useMemo(() => cart.reduce((acc, item) => {
    const price = item.selectedUnit === 'BOX' ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    return acc + (price * item.quantity);
  }, 0), [cart]);

  const total = subtotal + (cart.length > 0 ? DELIVERY_FEE : 0);

  const displayedProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory) {
      const catName = categories.find(c => c.id === activeCategory)?.name;
      filtered = products.filter(p => p.category === catName);
    }
    if (searchTerm) {
      if (isSymptomMode) {
        filtered = filtered.filter(p => aiResults.includes(p.id));
      } else {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }
    return filtered;
  }, [products, searchTerm, activeCategory, categories, isSymptomMode, aiResults]);

  const addToCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedUnit === unitType);
      if (existing) {
        return prev.map(item => item.id === product.id && item.selectedUnit === unitType 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleConfirmOrder = async (details: CheckoutFormData, discount: number, pointsRedeemed: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const orderId = `WEB-${Date.now()}`;
    const finalTotal = total - discount;
    const order: Order = {
      id: orderId,
      customerName: details.name,
      customerPhone: details.phone,
      customerAddress: details.address,
      items: cart,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      discount,
      pointsRedeemed,
      total: finalTotal,
      paymentMethod: details.paymentMethod,
      cashGiven: details.cashGiven ? parseFloat(details.cashGiven) : undefined,
      status: 'PENDING',
      source: 'ONLINE',
      date: new Date().toISOString(),
      userId: currentUser.uid
    };

    try {
      await addOrderDB(order);
      // Actualizar Stock
      for (const item of cart) {
        const orig = products.find(p => p.id === item.id);
        if (orig) {
          const unitsToSubtract = item.selectedUnit === 'BOX' ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
          await updateStockDB(item.id, Math.max(0, orig.stock - unitsToSubtract));
        }
      }

      // CONSTRUCCIÓN DEL MENSAJE DE WHATSAPP
      const itemsText = cart.map(i => `- ${i.quantity}x ${i.name} (${i.selectedUnit === 'BOX' ? 'Caja' : 'Unid'})`).join('\n');
      const waMessage = `*NUEVO PEDIDO VITALIS* 💊\n\n` +
        `*Orden:* #${orderId.slice(-8)}\n` +
        `*Cliente:* ${order.customerName}\n` +
        `*Dirección:* ${order.customerAddress}\n\n` +
        `*PRODUCTOS:*\n${itemsText}\n\n` +
        `*Subtotal:* $${order.subtotal.toFixed(2)}\n` +
        `*Envío:* $${order.deliveryFee.toFixed(2)}\n` +
        (order.discount ? `*Descuento:* -$${order.discount.toFixed(2)}\n` : '') +
        `*TOTAL A PAGAR: $${order.total.toFixed(2)}*\n\n` +
        `*Método de Pago:* ${order.paymentMethod === 'CASH' ? 'Efectivo 💵' : 'Transferencia 🏦'}\n` +
        (order.paymentMethod === 'CASH' && order.cashGiven ? `*Paga con:* $${order.cashGiven.toFixed(2)}\n*Cambio:* $${(order.cashGiven - order.total).toFixed(2)}` : '');

      const waNumber = "593998506160";
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

      setCart([]);
      setView('SUCCESS');
      
      // Redirigir a WhatsApp
      window.open(waUrl, '_blank');
      
    } catch (e) {
      alert("Error al procesar el pedido");
    }
  };

  const handleTabChange = (tab: any) => {
    if ((tab === 'orders' || tab === 'health' || tab === 'services') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
  };

  if (view === 'DRIVER_DASHBOARD') return <DriverDashboard orders={orders} onLogout={() => { setView('HOME'); setTempStaffRole(null); }} />;
  if (view === 'ADMIN_DASHBOARD') return (
    <AdminPanel 
      products={products} categories={categories} orders={orders}
      onAddProduct={addProductDB} onEditProduct={updateProductDB} onDeleteProduct={deleteProductDB} onUpdateStock={updateStockDB}
      onAddCategory={addCategoryDB} onDeleteCategory={deleteCategoryDB} onAddOrder={addOrderDB} onUpdateOrderStatus={updateOrderStatusDB}
      onLogout={() => { setView('HOME'); setTempStaffRole(null); }} 
      currentUserRole={tempStaffRole || currentUser?.role}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">
      <Navbar 
        cartCount={cart.length} 
        onCartClick={() => setIsCartOpen(true)}
        onAdminClick={() => setShowStaffAccess(true)}
        onLogoClick={() => { setActiveTab('home'); setView('HOME'); }}
        onUserClick={() => currentUser ? setShowProfileModal(true) : setShowAuthModal(true)}
        currentUser={currentUser}
        onTabChange={handleTabChange}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <SearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          isSymptomMode={isSymptomMode} 
          setIsSymptomMode={setIsSymptomMode}
          isSearchingAI={isSearchingAI}
          startVoiceSearch={() => alert("Próximamente...")}
        />
        <HomeView 
          banners={banners} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory}
          displayedProducts={displayedProducts} searchTerm={searchTerm} currentUser={currentUser} isSuperAdmin={currentUser?.role === 'ADMIN'}
          handleDeleteBanner={deleteBannerDB} onOpenAdminPanel={() => setView('ADMIN_DASHBOARD')} onOpenPrescription={() => setShowPrescriptionModal(true)}
          onOpenServices={() => setActiveTab('services')} onAddToCart={addToCart} onSelectProduct={setSelectedProduct} cart={cart}
        />
      </main>

      <BottomNav activeTab={activeTab as any} cartCount={cart.length} onTabChange={handleTabChange} onCartClick={() => setIsCartOpen(true)} />

      <CartDrawer 
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} updateQuantity={updateQuantity} 
        removeFromCart={removeFromCart} subtotal={subtotal} total={total} onCheckout={() => setView('CHECKOUT')}
        checkingInteractions={checkingInteractions} interactionWarning={interactionWarning}
      />

      {selectedProduct && <ProductDetail product={selectedProduct} cart={cart} products={products} currentUserEmail={currentUser?.email} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}

      {view === 'CHECKOUT' && <Checkout cart={cart} subtotal={subtotal} total={total} onConfirmOrder={handleConfirmOrder} onCancel={() => setView('HOME')} currentUser={currentUser} />}

      {view === 'SUCCESS' && (
        <div className="fixed inset-0 z-[100] bg-teal-600 flex items-center justify-center p-6 text-white text-center">
          <div className="max-w-sm animate-in zoom-in duration-300">
            <CheckCircle className="h-24 w-24 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">¡Pedido Recibido!</h2>
            <p className="mb-8 opacity-90">Tu pedido ha sido registrado con éxito. Te avisaremos cuando esté en camino.</p>
            <button onClick={() => { setView('HOME'); setActiveTab('home'); }} className="w-full bg-white text-teal-600 py-4 rounded-xl font-bold">Volver al Inicio</button>
          </div>
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => {}} />}
      {showProfileModal && currentUser && <ProfileModal user={currentUser} onClose={() => setShowProfileModal(false)} />}
      
      {activeTab === 'orders' && currentUser && <UserOrdersModal user={currentUser} onClose={() => setActiveTab('home')} onReorder={(o) => { o.items.forEach(i => addToCart(i, i.selectedUnit)); setIsCartOpen(true); }} />}
      {activeTab === 'services' && <ServicesModal user={currentUser} onClose={() => setActiveTab('home')} onLoginRequest={() => setShowAuthModal(true)} />}
      {activeTab === 'assistant' && <Assistant products={products} isOpen={true} onClose={() => setActiveTab('home')} />}
      {activeTab === 'health' && currentUser && <FamilyHealthModal user={currentUser} products={products} onClose={() => setActiveTab('home')} onAddToCart={(p) => addToCart(p, 'UNIT')} />}
      
      {showPrescriptionModal && <PrescriptionModal onClose={() => setShowPrescriptionModal(false)} />}
      
      {showStaffAccess && (
        <StaffAccessModal 
          onClose={() => setShowStaffAccess(false)} 
          onAuthorized={(targetView, role) => {
              setTempStaffRole(role);
              setView(targetView);
          }} 
        />
      )}
    </div>
  );
};

export default App;
