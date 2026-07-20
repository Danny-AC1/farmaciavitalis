
import React, { useRef, useState, useEffect } from 'react';
import { Product, Order, Category, CashClosure, User } from '../../types';
import { useAdminPanelState } from '../../hooks/useAdminPanelState';
import { useUSBScanner } from '../../hooks/useUSBScanner';
import { streamAdminChats, SupportChat, markChatAsReadByAdmin } from '../../services/db.support';
import { MessageSquare, Check, BellOff } from 'lucide-react';

// Componentes Base
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminMainContent from './AdminMainContent';
import CashClosureModal from '../modals/CashClosureModal';
import BarcodeScanner from '../modals/BarcodeScanner';

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
  onUpdateOrderStatus: (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order: Order) => Promise<void>;
  onLogout: () => void;
  currentUserRole?: 'ADMIN' | 'CASHIER' | 'DRIVER' | 'USER'; 
  currentUser?: User | null;
}

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const state = useAdminPanelState(
    props.products, props.categories, props.orders, props.onAddProduct, 
    props.onEditProduct, props.onDeleteProduct, props.onUpdateStock, 
    props.onAddCategory, props.onUpdateOrderStatus
  );

  // Soporte de chat: Notificaciones flotantes
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [mutedChatIds, setMutedChatIds] = useState<string[]>([]);
  const [initialSelectedChatId, setInitialSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = streamAdminChats((data) => {
      setChats(data);
    });
    return () => unsubscribe();
  }, []);

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
        const { updateCashClosureDB } = await import('../../services/db.admin');
        await updateCashClosureDB(closure);
    } else {
        await state.handleSaveCashClosure(closure);
    }
  };

  // Filtros para el Header
  const pendingOrders = props.orders.filter(o => o.status === 'PENDING');
  const lowStockItems = props.products.filter(p => p.stock <= 5);
  const pendingBookings = state.bookings.filter(b => b.status === 'PENDING');
  
  const isFullHeightTab = state.activeTab === 'pos' || state.activeTab === 'support_chats';

  const unreadChats = chats.filter(c => c.unreadByAdmin && !mutedChatIds.includes(c.id));

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
          <div className={`flex-1 bg-[#F8FAFC] ${isFullHeightTab ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              <div className={`max-w-[1500px] mx-auto ${isFullHeightTab ? 'p-0 h-full' : 'p-4 md:p-8 lg:p-10 pb-32 md:pb-10 space-y-8 h-full'}`}>
                <AdminMainContent 
                    activeTab={state.activeTab} 
                    props={props as any} 
                    state={{
                      ...state,
                      initialSelectedChatId,
                      onClearInitialChatId: () => setInitialSelectedChatId(null)
                    } as any} 
                    productInputRef={productInputRef}
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

      {/* Notificaciones flotantes de Soporte de Chat */}
      {unreadChats.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full animate-in slide-in-from-bottom duration-300 pointer-events-none">
          {unreadChats.map((chat) => (
            <div 
              key={chat.id} 
              className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-3 pointer-events-auto backdrop-blur-md bg-opacity-95 transform transition-all hover:scale-[1.02]"
              style={{ boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-teal-500 text-slate-900 font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                    {chat.userDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black tracking-wide uppercase truncate text-teal-400">
                      Mensaje de Soporte
                    </p>
                    <p className="text-xs font-black text-slate-100 truncate">
                      {chat.userDisplayName}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md uppercase shrink-0">
                  {chat.lastMessageTime ? new Date(chat.lastMessageTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-xl text-slate-300 text-[11px] font-medium leading-relaxed italic truncate max-h-16">
                "{chat.lastMessageText || 'Imagen o archivo adjunto'}"
              </div>

              <div className="flex gap-2 text-[10px] font-bold">
                <button
                  onClick={() => {
                    setInitialSelectedChatId(chat.id);
                    state.setActiveTab('support_chats');
                  }}
                  className="flex-grow bg-teal-500 hover:bg-teal-400 text-slate-950 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider font-black shadow-lg shadow-teal-500/10 text-center"
                >
                  <MessageSquare size={12} />
                  <span>Responder</span>
                </button>
                <button
                  onClick={async () => {
                    await markChatAsReadByAdmin(chat.id);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  title="Marcar como leído"
                >
                  <Check size={13} className="text-emerald-400 shrink-0" />
                  <span>Leído</span>
                </button>
                <button
                  onClick={() => {
                    setMutedChatIds((prev) => [...prev, chat.id]);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  title="Silenciar / Descartar"
                >
                  <BellOff size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
