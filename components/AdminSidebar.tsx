
import React from 'react';
import { LogOut, LayoutDashboard, Store, Package, ClipboardList, Grid, Truck, TrendingUp, Megaphone, Users, Wallet, CalendarCheck, BellRing, X, Activity, Map, MapPin } from 'lucide-react';
import { User } from '../types';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin: boolean;
  currentUserRole?: User['role'];
  isMobileOpen: boolean;
  setIsMobileOpen: (b: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, onLogout, currentUserRole, isMobileOpen, setIsMobileOpen }) => {
  
  // Lógica de filtrado de menú basada en rol
  const isActuallyAdmin = currentUserRole === 'ADMIN';

  const menuGroups = [
    {
      title: 'GESTIÓN DE VENTAS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'Punto de Venta', icon: Store },
        { id: 'orders', label: 'Pedidos', icon: ClipboardList },
        ...(isActuallyAdmin ? [{ id: 'geostats', label: 'Mapa de Ventas', icon: Map }] : []),
      ]
    },
    // Solo mostramos estos grupos si es Administrador
    ...(isActuallyAdmin ? [
        {
          title: 'INVENTARIO Y CATÁLOGO',
          items: [
            { id: 'products', label: 'Productos', icon: Package },
            { id: 'stock_quick', label: 'Stock Rápido', icon: Activity },
            { id: 'categories', label: 'Categorías', icon: Grid },
            { id: 'suppliers', label: 'Proveedores', icon: Truck },
            { id: 'ciudadelas', label: 'Ciudadelas / Envíos', icon: MapPin },
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
            { id: 'bookings', label: 'Citas Médicas', icon: CalendarCheck },
            { id: 'stock_alerts', label: 'Alertas Stock', icon: BellRing },
          ]
        }
    ] : [])
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-700 font-bold text-xl tracking-tight text-white flex justify-between items-center bg-slate-900">
        <div className="flex flex-col">
            <span>Vitalis Admin</span>
            <span className="text-[10px] text-teal-400 uppercase tracking-widest leading-none mt-1">
                {isActuallyAdmin ? 'Modo Gerencia' : 'Terminal Caja'}
            </span>
        </div>
        <button className="md:hidden" onClick={() => setIsMobileOpen(false)}><X size={20}/></button>
      </div>
      <div className="flex-grow overflow-y-auto py-6 px-3 space-y-8 bg-slate-900 no-scrollbar">
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
          <LogOut size={18} /> Salir de Terminal
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
