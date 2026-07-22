import React from 'react';
import { Package, Tag, AlertTriangle, Info, Trash2, Check, ExternalLink, MessageSquare, Sparkles } from 'lucide-react';
import { Notification } from '../../notificationTypes';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead, onDelete, onClick }) => {
  const getCategoryConfig = () => {
    switch (notification.type) {
      case 'CHAT':
        return {
          icon: <MessageSquare className="h-4 w-4 text-emerald-600 animate-pulse" />,
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badgeText: notification.count && notification.count > 1 ? `${notification.count} Mensajes` : 'Soporte Chat',
          borderColor: 'border-l-emerald-500'
        };
      case 'NEW_PRODUCT':
      case 'PRODUCT':
        return {
          icon: <Sparkles className="h-4 w-4 text-purple-600" />,
          bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
          badgeText: 'Nuevo Producto',
          borderColor: 'border-l-purple-500'
        };
      case 'ORDER_UPDATE':
        return {
          icon: <Package className="h-4 w-4 text-blue-600" />,
          bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
          badgeText: 'Pedido',
          borderColor: 'border-l-blue-500'
        };
      case 'PROMOTION':
        return {
          icon: <Tag className="h-4 w-4 text-pink-600" />,
          bgColor: 'bg-pink-50 text-pink-700 border-pink-200',
          badgeText: 'Promoción',
          borderColor: 'border-l-pink-500'
        };
      case 'STOCK_ALERT':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
          bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
          badgeText: 'Disponibilidad',
          borderColor: 'border-l-amber-500'
        };
      default:
        return {
          icon: <Info className="h-4 w-4 text-teal-600" />,
          bgColor: 'bg-teal-50 text-teal-700 border-teal-200',
          badgeText: 'Aviso Vitalis',
          borderColor: 'border-l-teal-500'
        };
    }
  };

  const config = getCategoryConfig();

  const formatNotificationTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      if (isToday(date)) {
        return `Hoy ${format(date, 'HH:mm', { locale: es })}`;
      }
      if (isYesterday(date)) {
        return `Ayer ${format(date, 'HH:mm', { locale: es })}`;
      }
      return format(date, "d 'de' MMM, HH:mm", { locale: es });
    } catch {
      return '';
    }
  };

  return (
    <div 
      onClick={() => onClick(notification)}
      className={`p-4 border-b border-slate-100 border-l-4 transition-all duration-200 cursor-pointer relative group ${
        notification.read 
          ? 'bg-white hover:bg-slate-50/80 border-l-transparent' 
          : `bg-teal-50/40 hover:bg-teal-50/70 ${config.borderColor}`
      }`}
    >
      <div className="flex gap-3">
        {/* Category Icon */}
        <div className={`p-2.5 rounded-xl shrink-0 self-start border shadow-2xs ${config.bgColor}`}>
          {config.icon}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${config.bgColor}`}>
                {config.badgeText}
              </span>
              {!notification.read && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap shrink-0">
              {formatNotificationTime(notification.createdAt)}
            </span>
          </div>

          <h4 className={`text-xs font-black leading-tight ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
            {notification.title}
          </h4>

          <p className={`text-[11.5px] font-medium leading-relaxed mt-1 ${notification.read ? 'text-slate-500' : 'text-slate-700'}`}>
            {notification.message}
          </p>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/60 text-[10px]">
            {notification.link ? (
              <span className="text-teal-600 font-black flex items-center gap-1 hover:underline">
                <span>Ver detalles</span>
                <ExternalLink size={11} />
              </span>
            ) : <span />}

            <div className="flex items-center gap-3 ml-auto">
              {!notification.read && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
                  className="font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-teal-100/50"
                  title="Marcar leída"
                >
                  <Check className="h-3 w-3" /> Leída
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                className="font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                title="Eliminar notificación"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
