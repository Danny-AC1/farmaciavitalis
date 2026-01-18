
import React from 'react';
import { LogOut, LayoutDashboard, Store, Package, ClipboardList, Grid, Truck, TrendingUp, Megaphone, Users, Wallet, Ticket, CalendarCheck, BellRing, X, Activity } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (b: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, onLogout, isAdmin, isMobileOpen, setIsMobileOpen }) => {
  const menuGroups = [
    {
      title: 'GESTIÓN DE VENTAS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'Punto de Venta', icon: Store },
        { id: 'orders', label: 'Pedidos', icon: ClipboardList },
      ]
    },
    ...(isAdmin ? [{
      title: 'INVENTARIO Y CATÁLOGO',
      items: [
        { id: 'products', label: 'Productos', icon: Package },
        { id: 'stock_quick', label: 'Stock Rápido', icon: Activity },
        { id: 'categories', label: 'Categorías', icon: Grid },
        { id: 'suppliers', label: 'Proveedores', icon: Truck },
        { id: 'demand', label: 'Demanda', icon: TrendingUp },
      ]
    },
    {
      title: 'MARKETING Y ADMIN',
      items: [
        { id: 'marketing', label: 'Marketing IA', icon: Megaphone },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'expenses', label: 'Gastos (Caja)', icon: Wallet },
        { id: 'subscriptions', label: 'Suscripciones', icon: Activity },
      ]
    },
    {
      title: 'GESTIÓN EXTRA',
      items: [
        { id: 'coupons', label: 'Cupones', icon: Ticket },
        { id: 'bookings', label: 'Citas Médicas', icon: CalendarCheck },
        { id: 'stock_alerts', label: 'Alertas Stock', icon: BellRing },
      ]
    }] : [])
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-700 font-bold text-xl tracking-tight text-white flex justify-between items-center bg-slate-900">
        <span>Vitalis Admin</span>
        <button className="md:hidden" onClick={() => setIsMobileOpen(false)}><X size={20}/></button>
      </div>
      <div className="flex-grow overflow-y-auto py-6 px-3 space-y-8 bg-slate-900">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">{group.title}</h3>
            {group.items.map(item => (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-1 ${activeTab === item.id ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-700 bg-slate-900">
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm font-medium w-full px-2 py-2">
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 text-white shadow-xl h-screen shrink-0 border-r border-slate-800">
        <SidebarContent />
      </aside>
      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
          <div className="relative w-64 bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
