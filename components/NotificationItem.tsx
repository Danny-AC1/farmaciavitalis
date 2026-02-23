import React from 'react';
import { Package, Tag, AlertTriangle, Info, Trash2, Check } from 'lucide-react';
import { Notification } from '../notificationTypes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead, onDelete }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'ORDER_UPDATE': return <Package className="h-5 w-5 text-blue-500" />;
      case 'PROMOTION': return <Tag className="h-5 w-5 text-pink-500" />;
      case 'STOCK_ALERT': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-teal-500" />;
    }
  };

  return (
    <div className={`p-4 border-b border-gray-100 last:border-0 transition-colors ${notification.read ? 'bg-white' : 'bg-teal-50/30'}`}>
      <div className="flex gap-3">
        <div className="mt-1 shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`text-sm font-bold truncate ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </h4>
            <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
              {format(new Date(notification.createdAt), 'HH:mm', { locale: es })}
            </span>
          </div>
          <p className={`text-xs mt-1 leading-relaxed ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          <div className="flex justify-end gap-3 mt-3">
            {!notification.read && (
              <button 
                onClick={() => onRead(notification.id)}
                className="text-[10px] font-bold text-teal-600 flex items-center gap-1 hover:text-teal-700"
              >
                <Check className="h-3 w-3" /> Marcar como leída
              </button>
            )}
            <button 
              onClick={() => onDelete(notification.id)}
              className="text-[10px] font-bold text-gray-400 flex items-center gap-1 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
