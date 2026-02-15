
import React, { useRef } from 'react';
import { Product, Order, Category } from '../types';
import { useAdminPanelState } from '../hooks/useAdminPanelState.ts';

// Componentes Base
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminMainContent from './AdminMainContent';
import CashClosureModal from './CashClosureModal';
import BarcodeScanner from './BarcodeScanner';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onAddProduct: (p: Product) => Promise<any>;
  onEditProduct: (p: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
  onAddCategory: (c: Category) => Promise<any>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddOrder: (o: Order) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: 'DELIVERED', order: Order) => Promise<void>;
  onLogout: () => void;
  currentUserRole?: 'ADMIN' | 'CASHIER' | 'DRIVER' | 'USER'; 
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const state = useAdminPanelState(
    props.products, props.categories, props.orders, props.onAddProduct, 
    props.onEditProduct, props.onDeleteProduct, props.onUpdateStock, 
    props.onAddCategory, props.onUpdateOrderStatus
  );

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  // Filtros para el Header
  const pendingOrders = props.orders.filter(o => o.status === 'PENDING');
  const lowStockItems = props.products.filter(p => p.stock <= 5);
  const pendingBookings = state.bookings.filter(b => b.status === 'PENDING');
  
  const isPosActive = state.activeTab === 'pos';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 1. Barra Lateral de Navegación */}
      <AdminSidebar 
        activeTab={state.activeTab} setActiveTab={state.setActiveTab} onLogout={props.onLogout} 
        isAdmin={props.currentUserRole === 'ADMIN'} currentUserRole={props.currentUserRole} 
        isMobileOpen={state.isSidebarOpen} setIsMobileOpen={state.setIsSidebarOpen} 
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          {/* 2. Cabecera y Alertas */}
          <AdminHeader 
            onMenuClick={() => state.setIsSidebarOpen(true)}
            showNotifications={state.showNotifications}
            setShowNotifications={state.setShowNotifications}
            pendingOrders={pendingOrders}
            lowStockItems={lowStockItems}
            pendingBookings={pendingBookings}
            setActiveTab={state.setActiveTab}
            onLogout={props.onLogout}
            currentUserRole={props.currentUserRole}
          />

          {/* 3. Área de Contenido Dinámico */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className={`max-w-[1500px] mx-auto ${isPosActive ? 'p-0 h-full' : 'p-4 md:p-8 lg:p-10 pb-32 md:pb-10 space-y-8 h-full'}`}>
                <AdminMainContent 
                    activeTab={state.activeTab} 
                    props={props} 
                    state={state} 
                    productInputRef={productInputRef}
                    bannerInputRef={bannerInputRef}
                />
              </div>
          </div>
      </main>

      {/* 4. Modales Globales */}
      {state.showPosScanner && (
        <BarcodeScanner 
            onScan={(code) => {
                if (state.activeTab === 'products') state.setProdBarcode(code);
                else {
                    const p = props.products.find(x => x.barcode === code);
                    if (p) state.addToPosCart(p);
                }
                state.setShowPosScanner(false);
            }} 
            onClose={() => state.setShowPosScanner(false)} 
        />
      )}

      <CashClosureModal 
        isOpen={state.showCashClosure}
        onClose={() => state.setShowCashClosure(false)}
        todayCash={state.todayCash}
        todayTrans={state.todayTrans}
      />
    </div>
  );
};

export default AdminPanel;
