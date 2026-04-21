
import React, { useRef } from 'react';
import { Product, Order, Category, CashClosure } from '../types';
import { useAdminPanelState } from '../hooks/useAdminPanelState';
import { useUSBScanner } from '../hooks/useUSBScanner';

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

  // Escáner USB Global para el POS
  useUSBScanner((code) => {
    if (state.activeTab === 'pos') {
        const p = props.products.find(x => x.barcode === code);
        if (p) {
            state.addToPosCart(p);
            // Podríamos añadir una notificación sutil aquí
        } else {
            alert(`Producto con código "${code}" no encontrado.`);
        }
    } else if (state.activeTab === 'products') {
        // Si estamos en productos, seteamos el código en el estado del formulario
        state.setProdBarcode(code);
        // Opcional: feedback visual
        console.log("Código escaneado para catálogo:", code);
    }
  }, true); // Activo globalmente para mayor fluidez

  // Estado para corte de caja personalizado / edición
  const [customClosure, setCustomClosure] = React.useState<{cash: number, trans: number, date: string, closure?: CashClosure | null} | null>(null);

  const handleShowCustomClosure = (cash: number, trans: number, date: string, closure?: CashClosure) => {
    setCustomClosure({ cash, trans, date, closure });
    state.setShowCashClosure(true);
  };

  const handleEditClosure = (closure: CashClosure) => {
    setCustomClosure({ 
        cash: closure.cashExpected || 0, 
        trans: closure.transExpected || 0, 
        date: closure.date || '',
        closure: closure 
    });
    state.setShowCashClosure(true);
  };

  const handleSaveWrapper = async (closure: CashClosure) => {
    if (customClosure?.closure) {
        // En lugar de import dinámico que puede fallar en algunos entornos, 
        // podrías simplemente llamar a una función del servicio que ya está disponible
        // pero preferimos mantener la consistencia con el flujo del estado
        const { updateCashClosureDB } = await import('../services/db.admin');
        await updateCashClosureDB(closure);
    } else {
        await state.handleSaveCashClosure(closure);
    }
  };

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
                    props={props as any} 
                    state={state as any} 
                    productInputRef={productInputRef}
                    bannerInputRef={bannerInputRef}
                    onShowCashClosure={handleShowCustomClosure}
                    onEditClosure={handleEditClosure}
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
        onClose={() => {
          state.setShowCashClosure(false);
          setCustomClosure(null);
        }}
        todayCash={customClosure ? customClosure.cash : state.todayCash}
        todayTrans={customClosure ? customClosure.trans : state.todayTrans}
        customDate={customClosure?.date}
        onSave={handleSaveWrapper}
        initialClosure={customClosure?.closure}
      />
    </div>
  );
};

export default AdminPanel;
