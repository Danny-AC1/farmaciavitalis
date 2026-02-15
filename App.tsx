
import React from 'react';
import { useAppLogic } from './hooks/useAppLogic';
import { 
  addProductDB, updateProductDB, deleteProductDB, updateStockDB, 
  addCategoryDB, deleteCategoryDB, addOrderDB, updateOrderStatusDB, deleteBannerDB 
} from './services/db';
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
  const logic = useAppLogic();

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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">
      <Navbar 
        cartCount={logic.cart.length} 
        onCartClick={() => logic.setIsCartOpen(true)}
        onAdminClick={() => logic.setShowStaffAccess(true)}
        onLogoClick={() => { logic.setActiveTab('home'); logic.setView('HOME'); }}
        onUserClick={() => logic.currentUser ? logic.setShowProfileModal(true) : logic.setShowAuthModal(true)}
        currentUser={logic.currentUser}
        onTabChange={logic.handleTabChange}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        <SearchBar 
          searchTerm={logic.searchTerm} 
          setSearchTerm={logic.setSearchTerm} 
          isSymptomMode={logic.isSymptomMode} 
          setIsSymptomMode={logic.setIsSymptomMode}
          isSearchingAI={logic.isSearchingAI}
          startVoiceSearch={() => alert("Próximamente...")}
        />
        <HomeView 
          banners={logic.banners} categories={logic.categories} activeCategory={logic.activeCategory} setActiveCategory={logic.setActiveCategory}
          displayedProducts={logic.displayedProducts} searchTerm={logic.searchTerm} currentUser={logic.currentUser} isSuperAdmin={logic.currentUser?.role === 'ADMIN'}
          handleDeleteBanner={deleteBannerDB} onOpenAdminPanel={() => logic.setView('ADMIN_DASHBOARD')} onOpenPrescription={() => logic.setShowPrescriptionModal(true)}
          onOpenServices={() => logic.setActiveTab('services')} onAddToCart={logic.addToCart} onSelectProduct={logic.setSelectedProduct} cart={logic.cart}
        />
      </main>

      <BottomNav activeTab={logic.activeTab} cartCount={logic.cart.length} onTabChange={logic.handleTabChange} onCartClick={() => logic.setIsCartOpen(true)} />

      <CartDrawer 
        isOpen={logic.isCartOpen} onClose={() => logic.setIsCartOpen(false)} cart={logic.cart} updateQuantity={logic.updateQuantity} 
        removeFromCart={logic.removeFromCart} subtotal={logic.subtotal} total={logic.totalBase} onCheckout={() => { logic.setIsCartOpen(false); logic.setView('CHECKOUT'); }}
        checkingInteractions={logic.checkingInteractions} interactionWarning={logic.interactionWarning}
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
            <button onClick={() => { logic.setView('HOME'); logic.setActiveTab('home'); }} className="w-full bg-white text-teal-600 py-4 rounded-xl font-bold">Volver al Inicio</button>
          </div>
        </div>
      )}

      {logic.showAuthModal && <AuthModal onClose={() => logic.setShowAuthModal(false)} onSuccess={() => {}} />}
      {logic.showProfileModal && logic.currentUser && <ProfileModal user={logic.currentUser} onClose={() => logic.setShowProfileModal(false)} />}
      
      {logic.activeTab === 'orders' && logic.currentUser && (
        <UserOrdersModal 
          user={logic.currentUser} onClose={() => logic.setActiveTab('home')} 
          onReorder={(o) => { o.items.forEach(i => logic.addToCart(i, i.selectedUnit)); logic.setIsCartOpen(true); }} 
        />
      )}
      {logic.activeTab === 'services' && <ServicesModal user={logic.currentUser} onClose={() => logic.setActiveTab('home')} onLoginRequest={() => logic.setShowAuthModal(true)} />}
      {logic.activeTab === 'assistant' && <Assistant products={logic.products} isOpen={true} onClose={() => logic.setActiveTab('home')} />}
      {logic.activeTab === 'health' && logic.currentUser && (
        <FamilyHealthModal user={logic.currentUser} products={logic.products} onClose={() => logic.setActiveTab('home')} onAddToCart={(p) => logic.addToCart(p, 'UNIT')} />
      )}
      
      {logic.showPrescriptionModal && <PrescriptionModal onClose={() => logic.setShowPrescriptionModal(false)} />}
      
      {logic.showStaffAccess && (
        <StaffAccessModal 
          onClose={() => logic.setShowStaffAccess(false)} 
          onAuthorized={(targetView, role) => {
              logic.setTempStaffRole(role);
              logic.setView(targetView);
          }} 
        />
      )}
    </div>
  );
};

export default App;
