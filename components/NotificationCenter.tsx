import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, BellOff } from 'lucide-react';
import { Notification } from '../notificationTypes';
import { streamNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/db.notifications';
import NotificationItem from './NotificationItem';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsub = streamNotifications(userId, (data) => setNotifications(data));
    return () => unsub();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:hidden"
          />
          
          {/* Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-100"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-teal-600 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-teal-600">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Notificaciones</h2>
                  <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">
                    {unreadCount} nuevas hoy
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <BellOff className="h-12 w-12 text-gray-200" />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">Todo al día</h3>
                  <p className="text-gray-500 text-xs">No tienes notificaciones pendientes por ahora.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(n => (
                    <NotificationItem 
                      key={n.id} 
                      notification={n} 
                      onRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <button 
                  onClick={() => markAllAsRead(userId)}
                  className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm"
                >
                  <CheckCheck className="h-4 w-4" /> Marcar todas como leídas
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
