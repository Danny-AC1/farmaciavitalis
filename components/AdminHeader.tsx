
import React, { useRef, useEffect } from 'react';
import { Menu, Bell, Layout, ChevronRight } from 'lucide-react';
import { Order, Product, ServiceBooking, User } from '../types';

interface AdminHeaderProps {
    onMenuClick: () => void;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    pendingOrders: Order[];
    lowStockItems: Product[];
    pendingBookings: ServiceBooking[];
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
    currentUserRole?: User['role'];
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
    onMenuClick, showNotifications, setShowNotifications, pendingOrders,
    lowStockItems, pendingBookings, setActiveTab, onLogout, currentUserRole
}) => {
    const notificationRef = useRef<HTMLDivElement>(null);
    const totalNotifications = pendingOrders.length + lowStockItems.length + pendingBookings.length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowNotifications]);

    const NotificationItem = ({ icon: Icon, title, desc, color, onClick }: any) => (
        <button 
            onClick={onClick}
            className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 text-left group"
        >
            <div className={`p-2 rounded-xl shrink-0 ${color}`}><Icon size={16} /></div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-slate-800 uppercase truncate leading-none mb-1">{title}</p>
                <p className="text-[10px] text-slate-400 font-bold leading-tight line-clamp-1">{desc}</p>
            </div>
            <ChevronRight size={14} className="text-slate-200 group-hover:text-teal-500 transition-colors self-center" />
        </button>
    );

    return (
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0 z-30 shadow-sm">
             <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"><Menu size={24}/></button>
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-xl hidden sm:block"><Layout className="text-white" size={20}/></div>
                    <div>
                        <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">Vitalis <span className="text-teal-600">Admin</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Panel de Control v2.5</p>
                    </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3 md:gap-5 relative" ref={notificationRef}>
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)} 
                    className={`relative p-2 rounded-xl transition-all group ${showNotifications ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                 >
                    <Bell size={22} />
                    {totalNotifications > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                 </button>

                 {showNotifications && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Centro de Alertas</h4>
                            <span className="bg-teal-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{totalNotifications} Nuevas</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                            {totalNotifications === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <Bell className="text-slate-100 mb-3" size={40}/>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Sin novedades</p>
                                </div>
                            ) : (
                                <>
                                    {pendingOrders.map(order => (
                                        <NotificationItem 
                                            key={order.id} icon={Bell} title={`Pedido Web`} desc={`${order.customerName} - $${order.total.toFixed(2)}`} color="bg-orange-50 text-orange-600"
                                            onClick={() => { setActiveTab('orders'); setShowNotifications(false); }}
                                        />
                                    ))}
                                    {lowStockItems.map(item => (
                                        <NotificationItem 
                                            key={item.id} icon={Bell} title={`Stock Crítico`} desc={`${item.name} (${item.stock} disponibles)`} color="bg-red-50 text-red-600"
                                            onClick={() => { setActiveTab('stock_quick'); setShowNotifications(false); }}
                                        />
                                    ))}
                                    {pendingBookings.map(booking => (
                                        <NotificationItem 
                                            key={booking.id} icon={Bell} title={`Cita Médica`} desc={`${booking.patientName} - ${booking.serviceName}`} color="bg-blue-50 text-blue-600"
                                            onClick={() => { setActiveTab('bookings'); setShowNotifications(false); }}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                 )}

                 <button onClick={onLogout} className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white">{currentUserRole?.charAt(0) || 'A'}</button>
             </div>
        </header>
    );
};

export default AdminHeader;
