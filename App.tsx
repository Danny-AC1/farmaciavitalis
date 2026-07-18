
import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import { 
  addProductDB, updateProductDB, deleteProductDB, updateStockDB, 
  addCategoryDB, deleteCategoryDB, addOrderDB, updateOrderStatusDB 
} from './services/db';
import { CheckCircle } from 'lucide-react';
import { Product } from './types';

// Components
import {
  Navbar,
  HomeView,
  CartDrawer,
  ProductDetail,
  Checkout,
  AdminPanel,
  DriverDashboard,
  BottomNav,
  SearchBar,
  AuthModal,
  ProfileModal,
  UserOrdersModal,
  PrescriptionModal,
  ServicesModal,
  SupportAndDoseCalculator,
  FamilyHealthModal,
  UserSubscriptionsModal,
  StaffAccessModal,
  Footer,
  NotificationCenter,
  BlogSection,
  DeliveryInfo
} from './components';

const App: React.FC = () => {
  const logic = useAppLogic();
  const [showExitToast, setShowExitToast] = React.useState(false);

  // Lógica de horario de servicio para Machalilla: Activo de 08:00 a 20:00
  const now = new Date();
  const currentHour = now.getHours();
  const isServiceActive = currentHour >= 8 && currentHour < 20;

  React.useEffect(() => {
    const handleExitToast = () => {
      setShowExitToast(true);
      setTimeout(() => setShowExitToast(false), 2000);
    };
    window.addEventListener('show-exit-toast', handleExitToast);
    return () => window.removeEventListener('show-exit-toast', handleExitToast);
  }, []);

  if (logic.view === 'DRIVER_DASHBOARD') {
    return <DriverDashboard orders={logic.orders} onLogout={() => { logic.setView('HOME'); logic.setTempStaffRole(null); }} />;
  }

  if (logic.view === 'ADMIN_DASHBOARD') {
    return (
      <AdminPanel 
        products={logic.products} categories={logic.categories} orders={logic.orders}
        onAddProduct={addProductDB} onEditProduct={updateProductDB} onDeleteProduct={deleteProductDB} onUpdateStock={updateStockDB}
        onAddCategory={addCategoryDB} onDeleteCategory={deleteCategoryDB} onAddOrder={addOrderDB} onUpdateOrderStatus={updateOrderStatusDB}
        onLogout={() => { logic.setView('HOME'); logic.setTempStaffRole(null); }} 
        currentUserRole={logic.tempStaffRole || logic.currentUser?.role}
        currentUser={logic.currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">
      <Navbar 
        cartCount={logic.cart.length} 
        onCartClick={() => logic.setIsCartOpen(true)}
        onAdminClick={() => logic.setShowStaffAccess(true)}
        onLogoClick={() => logic.handleTabChange('home')}
        onUserClick={() => logic.currentUser ? logic.setShowProfileModal(true) : logic.setShowAuthModal(true)}
        onNotificationClick={() => logic.notifications.toggle()}
        unreadNotificationsCount={logic.notifications.unreadCount}
        currentUser={logic.currentUser}
        onTabChange={logic.handleTabChange}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        {logic.view === 'HOME' && <DeliveryInfo isServiceActive={isServiceActive} />}
        <SearchBar 
          searchTerm={logic.searchTerm} 
          setSearchTerm={logic.setSearchTerm} 
          isSymptomMode={logic.isSymptomMode} 
          setIsSymptomMode={logic.setIsSymptomMode}
          isSearchingAI={logic.isSearchingAI}
          allProducts={logic.products}
          onAddToCart={logic.addToCart}
          onSelectProduct={logic.setSelectedProduct}
          cart={logic.cart}
        />
        <HomeView 
          categories={logic.categories} bundles={logic.bundles} activeCategory={logic.activeCategory} setActiveCategory={logic.setActiveCategory}
          displayedProducts={logic.displayedProducts} allProducts={logic.products} searchTerm={logic.searchTerm} 
          onOpenPrescription={() => logic.setShowPrescriptionModal(true)}
          onOpenServices={() => logic.setActiveTab('services')} onAddToCart={logic.addToCart} onAddBundle={(b) => logic.addBundleToCart(b, logic.products)} onSelectProduct={logic.setSelectedProduct} 
          cart={logic.cart}
        />
        <Footer />
      </main>

      <BottomNav activeTab={logic.activeTab} onTabChange={logic.handleTabChange} />

      <CartDrawer 
        isOpen={logic.isCartOpen} onClose={() => logic.setIsCartOpen(false)} cart={logic.cart} updateQuantity={logic.updateQuantity} 
        removeFromCart={logic.removeFromCart} subtotal={logic.subtotal} total={logic.totalBase} onCheckout={() => { logic.setIsCartOpen(false); logic.setView('CHECKOUT'); }}
      />

      {logic.selectedProduct && (
        <ProductDetail 
          product={logic.selectedProduct} cart={logic.cart} products={logic.products} 
          currentUserEmail={logic.currentUser?.email} onClose={() => logic.setSelectedProduct(null)} onAddToCart={logic.addToCart} 
        />
      )}

      {logic.view === 'CHECKOUT' && (
        <Checkout 
          cart={logic.cart} subtotal={logic.subtotal} total={logic.totalBase} 
          onConfirmOrder={logic.handleConfirmOrder} onCancel={() => logic.setView('HOME')} currentUser={logic.currentUser} 
        />
      )}

      {logic.view === 'SUCCESS' && (
        <div className="fixed inset-0 z-[100] bg-teal-600 flex items-center justify-center p-6 text-white text-center">
          <div className="max-sm animate-in zoom-in duration-300">
            <CheckCircle className="h-24 w-24 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">¡Pedido Recibido!</h2>
            <p className="mb-8 opacity-90">Tu pedido ha sido registrado con éxito. Te avisaremos cuando esté en camino.</p>
            <button onClick={() => logic.handleTabChange('home')} className="w-full bg-white text-teal-600 py-4 rounded-xl font-bold">Volver al Inicio</button>
          </div>
        </div>
      )}

      {logic.showAuthModal && <AuthModal onClose={() => logic.setShowAuthModal(false)} onSuccess={() => {}} />}
      {logic.showProfileModal && logic.currentUser && (
        <ProfileModal 
          user={logic.currentUser} 
          onClose={() => logic.setShowProfileModal(false)} 
          onOpenSubscriptions={() => logic.setShowUserSubscriptionsModal(true)}
        />
      )}
      
      {logic.showUserSubscriptionsModal && logic.currentUser && (
        <UserSubscriptionsModal 
          user={logic.currentUser} 
          products={logic.products} 
          onClose={() => logic.setShowUserSubscriptionsModal(false)} 
        />
      )}
      
      {logic.activeTab === 'orders' && logic.currentUser && (
        <UserOrdersModal 
          user={logic.currentUser} onClose={() => logic.setActiveTab('home')} 
          onReorder={(o) => { o.items.forEach(i => logic.addToCart(i, i.selectedUnit)); logic.setIsCartOpen(true); }} 
        />
      )}
      {logic.activeTab === 'services' && <ServicesModal user={logic.currentUser} onClose={() => logic.setActiveTab('home')} onLoginRequest={() => logic.setShowAuthModal(true)} />}
      {logic.activeTab === 'assistant' && (
        <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col pt-16 md:pt-20 pb-4 md:pb-6 overflow-hidden">
          <SupportAndDoseCalculator 
            products={logic.products} 
            currentUser={logic.currentUser} 
            onAddToCart={(p) => logic.addToCart(p, 'UNIT')} 
            onClose={() => logic.setActiveTab('home')} 
            onLoginRequest={() => logic.setShowAuthModal(true)} 
          />
        </div>
      )}
      {logic.activeTab === 'health' && logic.currentUser && (
        <FamilyHealthModal user={logic.currentUser} products={logic.products} onClose={() => logic.setActiveTab('home')} onAddToCart={(p) => logic.addToCart(p, 'UNIT')} />
      )}
      
      {logic.activeTab === 'wellness' && (
        <div className="fixed inset-0 z-40 bg-gray-50 overflow-y-auto pt-20 pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <BlogSection isAuthorized={logic.currentUser?.role === 'ADMIN'} onOpenAdminPanel={() => logic.setView('ADMIN_DASHBOARD')} />
          </div>
        </div>
      )}
      
      {logic.showPrescriptionModal && <PrescriptionModal onClose={() => logic.setShowPrescriptionModal(false)} />}
      
      {logic.currentUser && (
        <NotificationCenter 
          userId={logic.currentUser.uid} 
          isOpen={logic.notifications.isOpen} 
          onClose={() => logic.notifications.setIsOpen(false)} 
          onNavigate={(n) => {
            // Cerrar cualquier modal o panel lateral que pueda interferir u ocultar el detalle del producto
            logic.setIsCartOpen(false);
            logic.setShowProfileModal(false);
            logic.setShowUserSubscriptionsModal(false);
            logic.setShowPrescriptionModal(false);
            logic.setShowAuthModal(false);
            logic.setShowStaffAccess(false);
            
            let foundProd: Product | null = null;

            // 1. Intentar buscar por coincidencia directa de ID dentro del enlace de manera exhaustiva
            if (n.link) {
              const segments = n.link.split(/[\/\?&=\-_]/).filter(Boolean);
              for (const segment of segments) {
                const match = logic.products.find(p => p.id === segment || p.id.toLowerCase() === segment.toLowerCase());
                if (match) {
                  foundProd = match;
                  break;
                }
              }

              // 2. Intentar buscar por query parameters si no se encontró en segmentos simples
              if (!foundProd) {
                try {
                  const urlObj = n.link.includes('://') ? new URL(n.link) : new URL(n.link, window.location.origin);
                  const pid = urlObj.searchParams.get('id') || urlObj.searchParams.get('product') || urlObj.searchParams.get('productId');
                  if (pid) {
                    const match = logic.products.find(p => p.id === pid || p.id.toLowerCase() === pid.toLowerCase());
                    if (match) foundProd = match;
                  }
                } catch (e) {
                  // Ignorar error de URL
                }
              }
            }

            // 3. Fallback: Buscar nombres de productos encerrados entre comillas en el mensaje
            if (!foundProd && n.message) {
              const nameMatch = n.message.match(/"([^"]+)"/);
              if (nameMatch) {
                const extractedName = nameMatch[1].toLowerCase().trim();
                const prodByName = logic.products.find(p => p.name.toLowerCase().includes(extractedName) || extractedName.includes(p.name.toLowerCase()));
                if (prodByName) foundProd = prodByName;
              }
            }

            // 4. Fallback final: Buscar si algún nombre de producto está presente de manera directa en el mensaje o título
            if (!foundProd) {
              const msgLower = (n.message || '').toLowerCase();
              const titleLower = (n.title || '').toLowerCase();
              // Ordenar productos por longitud de nombre para evitar falsos positivos con palabras cortas
              const sortedProducts = [...logic.products].sort((a, b) => b.name.length - a.name.length);
              for (const prod of sortedProducts) {
                const prodNameLower = prod.name.toLowerCase();
                if (prodNameLower.length > 3 && (msgLower.includes(prodNameLower) || titleLower.includes(prodNameLower))) {
                  foundProd = prod;
                  break;
                }
              }
            }

            // Ejecutar la redirección final
            if (foundProd) {
              logic.handleTabChange('home');
              // Pequeño timeout para asegurar que el cambio de pestaña y estado de navegación se asiente antes de abrir el modal
              setTimeout(() => {
                logic.setSelectedProduct(foundProd);
              }, 100);
            } else if (n.link) {
              const linkLower = n.link.toLowerCase();
              if (linkLower.includes('/orders')) {
                logic.handleTabChange('orders');
              } else if (linkLower.includes('/health')) {
                logic.handleTabChange('health');
              } else if (linkLower.includes('/assistant')) {
                logic.handleTabChange('assistant');
              } else if (linkLower.includes('/services')) {
                logic.handleTabChange('services');
              } else if (linkLower.includes('/wellness')) {
                logic.handleTabChange('wellness');
              } else {
                logic.handleTabChange('home');
              }
            } else {
              // Fallback por tipo de notificación
              if (n.type === 'ORDER_UPDATE') {
                logic.handleTabChange('orders');
              } else if (n.type === 'PROMOTION') {
                logic.handleTabChange('home');
              }
            }
          }}
        />
      )}

      {logic.showStaffAccess && (
        <StaffAccessModal 
          onClose={() => logic.setShowStaffAccess(false)} 
          onAuthorized={(targetView, role) => {
              logic.setTempStaffRole(role);
              logic.setView(targetView);
          }} 
        />
      )}

      {showExitToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gray-900/90 text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl backdrop-blur-sm">
            Presione de nuevo para salir
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
