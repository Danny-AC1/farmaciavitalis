import React, { useState } from 'react';
import { 
  CheckCheck, Radio, BellRing, Package, Boxes, AlertTriangle, 
  Calendar, MessageSquare 
} from 'lucide-react';
import { Order, Product, ServiceBooking } from '../../../types';
import { SupportChat } from '../../../services/db.support';
import { motion } from 'framer-motion';
import { AdminNotificationItem, NotificationItemData } from './AdminNotificationItem';

interface AdminNotificationDropdownProps {
  totalNotifications: number;
  activeOrders: Order[];
  activeLowStock: Product[];
  activeBookings: ServiceBooking[];
  activeChats: SupportChat[];
  pushPermission: NotificationPermission;
  onEnablePush: () => void;
  onOpenDeviceModal: () => void;
  onDismissNotification: (id: string) => void;
  onDismissAll: () => void;
  onSelectTab: (tab: string) => void;
  onSelectChat?: (chatId: string) => void;
  onClose: () => void;
}

export const AdminNotificationDropdown: React.FC<AdminNotificationDropdownProps> = ({
  totalNotifications,
  activeOrders,
  activeLowStock,
  activeBookings,
  activeChats,
  pushPermission,
  onEnablePush,
  onOpenDeviceModal,
  onDismissNotification,
  onDismissAll,
  onSelectTab,
  onSelectChat,
  onClose
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORDERS' | 'STOCK' | 'BOOKINGS' | 'CHAT'>('ALL');

  const filteredNotifications = (): NotificationItemData[] => {
    const list: NotificationItemData[] = [];
    
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
          onClick: () => { onSelectTab('orders'); onClose(); }
        });
      });
    }

    if (activeFilter === 'ALL' || activeFilter === 'STOCK') {
      activeLowStock.forEach(item => {
        const isBox = Boolean(item.unitsPerBox && item.unitsPerBox > 1);
        list.push({
          id: `stock-${item.id}`,
          type: 'STOCK',
          icon: isBox ? Boxes : AlertTriangle,
          title: isBox ? 'Alerta Caja por Terminar' : 'Stock Crítico en Unidades',
          desc: isBox 
            ? `${item.name} • Solo quedan ${item.stock} uds de la caja (Cj x ${item.unitsPerBox})`
            : `${item.name} • Quedan ${item.stock} unidades en inventario`,
          color: isBox ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-red-50 text-red-600 border-red-100',
          actionLabel: 'Reabastecer',
          onClick: () => { onSelectTab('stock_quick'); onClose(); }
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
          onClick: () => { onSelectTab('bookings'); onClose(); }
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
            else onSelectTab('support');
            onClose();
          }
        });
      });
    }

    return list;
  };

  const currentList = filteredNotifications();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in-50 duration-250"
    >
      <div className="bg-slate-900 p-4 text-white space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BellRing className="text-teal-400" size={14} />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Panel de Alertas</h4>
          </div>
          <div className="flex items-center gap-2">
            {totalNotifications > 0 && (
              <button
                onClick={onDismissAll}
                className="text-[9px] font-bold text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1 cursor-pointer"
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

        <div className="bg-slate-800/90 rounded-xl p-2.5 flex items-center justify-between gap-2 border border-slate-700/60">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300 min-w-0">
            <Radio size={14} className={pushPermission === 'granted' ? 'text-emerald-400 shrink-0' : 'text-amber-400 shrink-0'} />
            <span className="truncate">
              {pushPermission === 'granted' ? 'Notificaciones en Dispositivo Activas' : 'Alertas Escritorio Desactivadas'}
            </span>
          </div>
          {pushPermission === 'granted' ? (
            <button
              onClick={onOpenDeviceModal}
              className="text-[9px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-wider transition-colors shrink-0 underline underline-offset-2 cursor-pointer"
            >
              Ajustar / Probar
            </button>
          ) : (
            <button
              onClick={onEnablePush}
              className="text-[9px] font-black bg-teal-500 hover:bg-teal-400 text-slate-950 px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
            >
              Activar
            </button>
          )}
        </div>
        
        <div className="flex gap-1 bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveFilter('ALL')}
            className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center cursor-pointer ${activeFilter === 'ALL' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Todos ({totalNotifications})
          </button>
          <button 
            onClick={() => setActiveFilter('ORDERS')}
            className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center cursor-pointer ${activeFilter === 'ORDERS' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Pedidos ({activeOrders.length})
          </button>
          <button 
            onClick={() => setActiveFilter('STOCK')}
            className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center cursor-pointer ${activeFilter === 'STOCK' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Stock ({activeLowStock.length})
          </button>
          <button 
            onClick={() => setActiveFilter('BOOKINGS')}
            className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center cursor-pointer ${activeFilter === 'BOOKINGS' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Citas ({activeBookings.length})
          </button>
          {activeChats.length > 0 && (
            <button 
              onClick={() => setActiveFilter('CHAT')}
              className={`flex-1 min-w-[50px] text-[9px] font-black uppercase py-1 px-1.5 rounded-lg transition-all text-center cursor-pointer ${activeFilter === 'CHAT' ? 'bg-teal-500 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Chat ({activeChats.length})
            </button>
          )}
        </div>
      </div>

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
            {currentList.map(item => (
              <AdminNotificationItem
                key={item.id}
                item={item}
                onDismiss={onDismissNotification}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
