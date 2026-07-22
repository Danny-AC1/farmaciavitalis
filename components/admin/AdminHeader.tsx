import React, { useRef, useEffect, useState } from 'react';
import { 
  Menu, Bell, Layout, ChevronRight, Volume2, VolumeX, X, 
  Package, AlertTriangle, Calendar, BellRing, Sparkles,
  MessageSquare, CheckCheck, Radio
} from 'lucide-react';
import { Order, Product, ServiceBooking, User } from '../../types';
import { SupportChat } from '../../services/db.support';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  triggerNativeNotification 
} from '../../services/nativeNotificationService';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminHeaderProps {
    onMenuClick: () => void;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    pendingOrders: Order[];
    lowStockItems: Product[];
    pendingBookings: ServiceBooking[];
    unreadChats?: SupportChat[];
    onSelectChat?: (chatId: string) => void;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
    currentUserRole?: User['role'];
}

interface LiveToast {
  id: string;
  type: 'ORDER' | 'STOCK' | 'BOOKING' | 'CHAT';
  title: string;
  desc: string;
  actionLabel: string;
  tab: string;
  chatId?: string;
}

const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // Primera nota (Suave y alta)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain1.gain.setValueAtTime(0.06, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.35);

        // Segunda nota en armonía (Un poco más tarde)
        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
            gain2.gain.setValueAtTime(0.06, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.45);
        }, 90);
    } catch (e) {
        console.error("Audio error", e);
    }
};

const AdminHeader: React.FC<AdminHeaderProps> = ({
    onMenuClick, showNotifications, setShowNotifications, pendingOrders,
    lowStockItems, pendingBookings, unreadChats = [], onSelectChat,
    setActiveTab, onLogout, currentUserRole
}) => {
    const notificationRef = useRef<HTMLDivElement>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
      const saved = localStorage.getItem('vitalis_admin_sound');
      return saved !== 'false';
    });
    
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORDERS' | 'STOCK' | 'BOOKINGS' | 'CHAT'>('ALL');
    const [toasts, setToasts] = useState<LiveToast[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

    const prevOrdersRef = useRef<string[]>([]);
    const prevLowStockRef = useRef<string[]>([]);
    const prevBookingsRef = useRef<string[]>([]);
    const prevChatsRef = useRef<string[]>([]);
    const isFirstRender = useRef(true);

    // Verificar permiso de notificaciones push de escritorio
    useEffect(() => {
      setPushPermission(getNotificationPermission());
    }, []);

    const handleEnablePush = async () => {
      const granted = await requestNotificationPermission();
      const newPerm = getNotificationPermission();
      setPushPermission(newPerm);
      if (granted) {
        triggerNativeNotification('Alertas Vitalis Activas 🔔', {
          body: 'Notificaciones del sistema configuradas correctamente en este navegador.'
        });
      }
    };

    // Conteos activos no descartados
    const activeOrders = pendingOrders.filter(o => !dismissedIds.includes(`order-${o.id}`));
    const activeLowStock = lowStockItems.filter(p => !dismissedIds.includes(`stock-${p.id}`));
    const activeBookings = pendingBookings.filter(b => !dismissedIds.includes(`booking-${b.id}`));
    const activeChats = unreadChats.filter(c => !dismissedIds.includes(`chat-${c.id}`));

    const totalNotifications = activeOrders.length + activeLowStock.length + activeBookings.length + activeChats.length;

    // Sincronizar preferencia de sonido en localStorage
    useEffect(() => {
      localStorage.setItem('vitalis_admin_sound', String(soundEnabled));
    }, [soundEnabled]);

    // Escuchar cambios para emitir alertas acústicas, visuales y Push
    useEffect(() => {
      const currentOrderIds = pendingOrders.map(o => o.id);
      const currentLowStockIds = lowStockItems.map(p => p.id);
      const currentBookingIds = pendingBookings.map(b => b.id);
      const currentChatIds = unreadChats.map(c => c.id);

      if (isFirstRender.current) {
        prevOrdersRef.current = currentOrderIds;
        prevLowStockRef.current = currentLowStockIds;
        prevBookingsRef.current = currentBookingIds;
        prevChatsRef.current = currentChatIds;
        isFirstRender.current = false;
        return;
      }

      const newOrders = pendingOrders.filter(o => !prevOrdersRef.current.includes(o.id));
      const newLowStocks = lowStockItems.filter(p => !prevLowStockRef.current.includes(p.id));
      const newBookings = pendingBookings.filter(b => !prevBookingsRef.current.includes(b.id));
      const newChats = unreadChats.filter(c => !prevChatsRef.current.includes(c.id));

      let hasNew = false;
      const createdToasts: LiveToast[] = [];

      newOrders.forEach(o => {
        hasNew = true;
        createdToasts.push({
          id: `toast-order-${o.id}-${Date.now()}`,
          type: 'ORDER',
          title: 'Nuevo Pedido Web',
          desc: `${o.customerName} • Total: $${o.total.toFixed(2)}`,
          actionLabel: 'Ver Orden',
          tab: 'orders'
        });
        if (pushPermission === 'granted') {
          triggerNativeNotification('🛒 Nuevo Pedido Web', {
            body: `${o.customerName} - Total: $${o.total.toFixed(2)}`
          });
        }
      });

      newLowStocks.forEach(p => {
        hasNew = true;
        createdToasts.push({
          id: `toast-stock-${p.id}-${Date.now()}`,
          type: 'STOCK',
          title: 'Stock Crítico 🚨',
          desc: `${p.name} se está agotando (${p.stock} un.)`,
          actionLabel: 'Reabastecer',
          tab: 'stock_quick'
        });
        if (pushPermission === 'granted') {
          triggerNativeNotification('⚠️ Stock Crítico', {
            body: `${p.name} (${p.stock} un. restantes)`
          });
        }
      });

      newBookings.forEach(b => {
        hasNew = true;
        createdToasts.push({
          id: `toast-booking-${b.id}-${Date.now()}`,
          type: 'BOOKING',
          title: 'Nueva Cita Médica 📅',
          desc: `${b.patientName} • ${b.serviceName}`,
          actionLabel: 'Ver Agenda',
          tab: 'bookings'
        });
        if (pushPermission === 'granted') {
          triggerNativeNotification('📅 Nueva Cita Médica', {
            body: `${b.patientName} - ${b.serviceName}`
          });
        }
      });

      newChats.forEach(c => {
        hasNew = true;
        createdToasts.push({
          id: `toast-chat-${c.id}-${Date.now()}`,
          type: 'CHAT',
          title: 'Nuevo Mensaje de Cliente 💬',
          desc: `${c.userDisplayName || 'Cliente'}: "${c.lastMessageText || 'Consulta de soporte'}"`,
          actionLabel: 'Responder',
          tab: 'support',
          chatId: c.id
        });
        if (pushPermission === 'granted') {
          triggerNativeNotification('💬 Mensaje de Soporte', {
            body: `${c.userDisplayName || 'Cliente'}: ${c.lastMessageText || 'Nuevo mensaje'}`
          });
        }
      });

      if (hasNew) {
        if (soundEnabled) {
          playNotificationSound();
        }
        setToasts(prev => [...prev, ...createdToasts]);
      }

      // Actualizar referencias
      prevOrdersRef.current = currentOrderIds;
      prevLowStockRef.current = currentLowStockIds;
      prevBookingsRef.current = currentBookingIds;
      prevChatsRef.current = currentChatIds;
    }, [pendingOrders, lowStockItems, pendingBookings, unreadChats, soundEnabled, pushPermission]);

    // Manejar el cierre de clics externos
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowNotifications]);

    // Eliminar Toast automáticamente
    const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Descartar notificación individual
    const dismissNotification = (id: string) => {
      setDismissedIds(prev => [...prev, id]);
    };

    // Descartar todas las activas
    const dismissAllNotifications = () => {
      const allIds = [
        ...activeOrders.map(o => `order-${o.id}`),
        ...activeLowStock.map(p => `stock-${p.id}`),
        ...activeBookings.map(b => `booking-${b.id}`),
        ...activeChats.map(c => `chat-${c.id}`)
      ];
      setDismissedIds(prev => [...prev, ...allIds]);
    };

    // Filtrar notificaciones para el panel
    const filteredNotifications = () => {
      const list: any[] = [];
      
      if (activeFilter === 'ALL' || activeFilter === 'ORDERS') {
        activeOrders.forEach(order => {
          list.push({
            id: `order-${order.id}`,
            type: 'ORDER',
            icon: Package,
            title: 'Pedido Web',
            desc: `${order.customerName} - $${order.total.toFixed(2)}`,
            color: 'bg-orange-50 text-orange-600 border-orange-100',
            actionLabel: 'Ver Pedido',
            onClick: () => { setActiveTab('orders'); setShowNotifications(false); }
          });
        });
      }

      if (activeFilter === 'ALL' || activeFilter === 'STOCK') {
        activeLowStock.forEach(item => {
          list.push({
            id: `stock-${item.id}`,
            type: 'STOCK',
            icon: AlertTriangle,
            title: 'Stock Crítico',
            desc: `${item.name} (${item.stock} unidades restantes)`,
            color: 'bg-red-50 text-red-600 border-red-100',
            actionLabel: 'Reabastecer',
            onClick: () => { setActiveTab('stock_quick'); setShowNotifications(false); }
          });
        });
      }

      if (activeFilter === 'ALL' || activeFilter === 'BOOKINGS') {
        activeBookings.forEach(booking => {
          list.push({
            id: `booking-${booking.id}`,
            type: 'BOOKING',
            icon: Calendar,
            title: 'Cita Médica',
            desc: `${booking.patientName} - ${booking.serviceName}`,
            color: 'bg-blue-50 text-blue-600 border-blue-100',
            actionLabel: 'Ver Agenda',
            onClick: () => { setActiveTab('bookings'); setShowNotifications(false); }
          });
        });
      }

      if (activeFilter === 'ALL' || activeFilter === 'CHAT') {
        activeChats.forEach(chat => {
          list.push({
            id: `chat-${chat.id}`,
            type: 'CHAT',
            icon: MessageSquare,
            title: 'Soporte Cliente',
            desc: `${chat.userDisplayName || 'Cliente'}: "${chat.lastMessageText || 'Consulta pendiente'}"`,
            color: 'bg-teal-50 text-teal-600 border-teal-100',
            actionLabel: 'Atender Chat',
            onClick: () => {
              if (onSelectChat) onSelectChat(chat.id);
              else setActiveTab('support');
              setShowNotifications(false);
            }
          });
        });
      }

      return list;
    };

    const currentList = filteredNotifications();

    const handleToastAction = (toast: LiveToast) => {
      if (toast.type === 'CHAT' && toast.chatId && onSelectChat) {
        onSelectChat(toast.chatId);
      } else {
        setActiveTab(toast.tab);
      }
      removeToast(toast.id);
    };

    return (
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0 z-30 shadow-sm relative font-sans">
             
             {/* Toasts Flotantes del Más Alto Nivel */}
             <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
                <AnimatePresence>
                  {toasts.map(toast => (
                    <motion.div
                      key={toast.id}
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                      className="pointer-events-auto w-full bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden"
                    >
                      {/* Efecto de barra de progreso */}
                      <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 7, ease: 'linear' }}
                        onAnimationComplete={() => removeToast(toast.id)}
                        className="absolute bottom-0 left-0 h-1 bg-teal-400"
                      />

                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          toast.type === 'ORDER' ? 'bg-orange-500/20 text-orange-400' :
                          toast.type === 'STOCK' ? 'bg-red-500/20 text-red-400' : 
                          toast.type === 'CHAT' ? 'bg-teal-500/20 text-teal-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {toast.type === 'ORDER' ? <Package size={18}/> :
                           toast.type === 'STOCK' ? <AlertTriangle size={18}/> : 
                           toast.type === 'CHAT' ? <MessageSquare size={18}/> : <Calendar size={18}/>}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1">ALERTA VITALIS</p>
                          <h4 className="text-xs font-black text-white leading-tight">{toast.title}</h4>
                          <p className="text-[11px] text-slate-300 font-bold leading-tight mt-1 truncate">{toast.desc}</p>
                        </div>
                        <button 
                          onClick={() => removeToast(toast.id)}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <X size={16}/>
                        </button>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleToastAction(toast)}
                          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[10px] px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors"
                        >
                          {toast.actionLabel}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>

             <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"><Menu size={24}/></button>
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-xl hidden sm:block"><Layout className="text-white" size={20}/></div>
                    <div>
                        <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">Vitalis <span className="text-teal-600">Admin</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Panel de Control Premium v2.8</p>
                    </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3 md:gap-5 relative" ref={notificationRef}>
                 
                 {/* Botón de Sonido de Notificación */}
                 <button 
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      if(!soundEnabled) playNotificationSound();
                    }}
                    className={`p-2 rounded-xl transition-all ${soundEnabled ? 'text-teal-600 bg-teal-50 hover:bg-teal-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                    title={soundEnabled ? "Silenciar alertas" : "Activar sonido de alertas"}
                 >
                   {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                 </button>

                 {/* Campana de Notificación de primera clase */}
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)} 
                    className={`relative p-2 rounded-xl transition-all group ${showNotifications ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                 >
                    <Bell size={22} className={totalNotifications > 0 ? "animate-swing origin-top" : ""} />
                    {totalNotifications > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
                          <span className="h-1 w-1 bg-white rounded-full"></span>
                        </span>
                    )}
                 </button>

                 <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in-50 duration-250"
                    >
                        {/* Cabecera del Centro de Alertas */}
                        <div className="bg-slate-900 p-4 text-white space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Sparkles className="text-teal-400" size={14} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Panel de Alertas</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                {totalNotifications > 0 && (
                                  <button
                                    onClick={dismissAllNotifications}
                                    className="text-[9px] font-bold text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1"
                                    title="Marcar todas como vistas"
                                  >
                                    <CheckCheck size={12} />
                                    <span>Limpiar</span>
                                  </button>
                                )}
                                <span className="bg-teal-500 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                  {totalNotifications} Activas
                                </span>
                              </div>
                            </div>

                            {/* Push Notification Banner Config */}
                            <div className="bg-slate-800/90 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-slate-700/60">
                              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300 min-w-0">
                                <Radio size={14} className={pushPermission === 'granted' ? 'text-emerald-400 shrink-0' : 'text-amber-400 shrink-0'} />
                                <span className="truncate">
                                  {pushPermission === 'granted' ? 'Notificaciones Web Activas' : 'Alertas Escritorio Desactivadas'}
                                </span>
                              </div>
                              {pushPermission !== 'granted' && (
                                <button
                                  onClick={handleEnablePush}
                                  className="text-[9px] font-black bg-teal-500 hover:bg-teal-400 text-slate-950 px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors shrink-0"
                                >
                                  Activar
                                </button>
                              )}
                            </div>
                            
                            {/* Filtros de Pestaña */}
                            <div className="flex gap-1 bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
                              <button 
                                onClick={() => setActiveFilter('ALL')}
                                className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center ${activeFilter === 'ALL' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                              >
                                Todos ({totalNotifications})
                              </button>
                              <button 
                                onClick={() => setActiveFilter('ORDERS')}
                                className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center ${activeFilter === 'ORDERS' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                              >
                                Pedidos ({activeOrders.length})
                              </button>
                              <button 
                                onClick={() => setActiveFilter('STOCK')}
                                className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center ${activeFilter === 'STOCK' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                              >
                                Stock ({activeLowStock.length})
                              </button>
                              <button 
                                onClick={() => setActiveFilter('BOOKINGS')}
                                className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center ${activeFilter === 'BOOKINGS' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                              >
                                Citas ({activeBookings.length})
                              </button>
                              {activeChats.length > 0 && (
                                <button 
                                  onClick={() => setActiveFilter('CHAT')}
                                  className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center ${activeFilter === 'CHAT' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                  Chat ({activeChats.length})
                                </button>
                              )}
                            </div>
                        </div>

                        {/* Listado de Notificaciones */}
                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 bg-slate-50/50">
                            {currentList.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <div className="bg-slate-100 p-3.5 rounded-full mb-2.5 text-slate-400">
                                      <BellRing size={26}/>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sin novedades pendientes</p>
                                    <p className="text-[9px] text-slate-400 mt-1 max-w-[200px]">¡Todo al día! No hay alertas sin responder en esta sección.</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1.5">
                                    {currentList.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <div 
                                                key={item.id}
                                                className={`flex items-start gap-3 p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 shadow-2xs relative group`}
                                            >
                                                <div className={`p-2 rounded-xl shrink-0 border ${item.color}`}>
                                                  <Icon size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.title}</span>
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                                                        <button 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            dismissNotification(item.id);
                                                          }}
                                                          className="text-slate-300 hover:text-slate-500 p-0.5 rounded transition"
                                                          title="Descartar"
                                                        >
                                                          <X size={12} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-700 font-bold leading-snug mb-2">{item.desc}</p>
                                                    
                                                    {/* Botón de Acción Directo */}
                                                    <button
                                                      onClick={item.onClick}
                                                      className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest flex items-center gap-1 transition-all"
                                                    >
                                                      {item.actionLabel}
                                                      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                  )}
                 </AnimatePresence>

                 {/* Botón de Perfil */}
                 <button onClick={onLogout} className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white hover:bg-slate-850 transition-colors">{currentUserRole?.charAt(0) || 'A'}</button>
              </div>
        </header>
    );
};

export default AdminHeader;
