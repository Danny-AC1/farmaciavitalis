import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, X, CheckCheck, BellOff, Smartphone, 
  Sparkles, Volume2, VolumeX, ShieldCheck, ArrowRight, Trash2 
} from 'lucide-react';
import { Notification } from '../../notificationTypes';
import { streamNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '../../services/db.notifications';
import { getNotificationPermission, requestNotificationPermission } from '../../services/nativeNotificationService';
import { notificationAudio } from '../../services/notificationAudioService';
import NotificationItem from './NotificationItem';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (notification: Notification) => void;
}

type FilterType = 'ALL' | 'CHAT' | 'NEW_PRODUCT' | 'ORDER_UPDATE' | 'PROMOTION' | 'STOCK_ALERT';

const isChatNotification = (n: Notification) => {
  if (n.type === 'CHAT') return true;
  if (n.link && (n.link.includes('/assistant') || n.link.includes('/chat') || n.link.includes('/support'))) return true;
  const title = (n.title || '').toLowerCase();
  const msg = (n.message || '').toLowerCase();
  return title.includes('soporte') || title.includes('mensaje') || msg.includes('soporte');
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    setPermissionState(getNotificationPermission());
  }, [isOpen]);

  useEffect(() => {
    if (!userId) return;
    const unsub = streamNotifications(userId, (data) => setNotifications(data));
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (isOpen && soundEnabled) {
      notificationAudio.playChatPing();
    }
  }, [isOpen]);

  const handleEnableDeviceNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermissionState(getNotificationPermission());
    if (granted) {
      if (soundEnabled) notificationAudio.playOrderChime();
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    notificationAudio.setSoundEnabled(next);
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;
    if (confirm('¿Eliminar todas las notificaciones? esta acción no se puede deshacer.')) {
      await deleteAllNotifications(userId);
      if (soundEnabled) notificationAudio.playChatPing();
    }
  };

  // Process and accumulate unread chat notifications into a consolidated card
  const processedNotifications = useMemo(() => {
    const unreadChatNotifs = notifications.filter(n => !n.read && isChatNotification(n));
    const nonAccumulated = notifications.filter(n => n.read || !isChatNotification(n));

    let result: Notification[] = [...nonAccumulated];

    if (unreadChatNotifs.length > 0) {
      const latest = unreadChatNotifs[0];
      const count = unreadChatNotifs.length;
      const accumulatedChatNotif: Notification = {
        id: latest.id,
        userId: latest.userId,
        title: count > 1 ? `💬 ${count} Nuevos mensajes de Soporte` : latest.title || '💬 Mensaje de Soporte Vitalis',
        message: latest.message,
        type: 'CHAT',
        read: false,
        createdAt: latest.createdAt,
        link: '/assistant',
        count: count,
        idsToMarkRead: unreadChatNotifs.map(n => n.id)
      };
      result.unshift(accumulatedChatNotif);
    }

    // Sort by createdAt desc
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = processedNotifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CHAT') return isChatNotification(n);
    if (activeFilter === 'NEW_PRODUCT') return n.type === 'NEW_PRODUCT' || n.type === 'PRODUCT' || (n.title && n.title.toLowerCase().includes('producto'));
    return n.type === activeFilter;
  });

  const handleReadItem = async (id: string, idsToMarkRead?: string[]) => {
    if (idsToMarkRead && idsToMarkRead.length > 0) {
      await Promise.all(idsToMarkRead.map(item => markAsRead(item)));
    } else {
      await markAsRead(id);
    }
  };

  const handleDeleteItem = async (id: string, idsToMarkRead?: string[]) => {
    if (idsToMarkRead && idsToMarkRead.length > 0) {
      await Promise.all(idsToMarkRead.map(item => deleteNotification(item)));
    } else {
      await deleteNotification(id);
    }
  };

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
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[90]"
          />
          
          {/* Notification Center Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[100] flex flex-col border-l border-slate-200 font-sans"
          >
            {/* Header Banner */}
            <div className="p-5 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white shrink-0 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="relative p-2 bg-white/15 rounded-xl backdrop-blur-md border border-white/20">
                    <Bell className="h-5 w-5 text-white animate-wiggle" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-teal-700 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                      <span>Centro de Alertas</span>
                      <Sparkles size={14} className="text-amber-300" />
                    </h2>
                    <p className="text-[10px] text-teal-100 font-bold uppercase tracking-wider">
                      {unreadCount === 0 ? 'Sin alertas pendientes' : `${unreadCount} pendientes de revisión`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={toggleSound}
                    className="p-2 hover:bg-white/15 rounded-xl transition-colors text-teal-100 hover:text-white"
                    title={soundEnabled ? "Silenciar audio" : "Activar audio"}
                  >
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </button>
                  <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-white/15 rounded-xl transition-colors text-teal-100 hover:text-white"
                    title="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Native Push Notification Control Card */}
              <div className="mt-3 bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/15 flex items-center justify-between text-xs">
                {permissionState === 'granted' ? (
                  <div className="flex items-center gap-2 text-[11px] font-black text-emerald-200">
                    <ShieldCheck size={15} className="text-emerald-300" />
                    <span>Alertas de dispositivo activas</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2 text-[10.5px] font-bold text-teal-50">
                      <Smartphone size={14} className="shrink-0 text-amber-300" />
                      <span>Activar Push en tu Celular</span>
                    </div>
                    <button
                      onClick={handleEnableDeviceNotifications}
                      className="py-1 px-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-lg transition shadow-sm shrink-0 flex items-center gap-1"
                    >
                      <span>Activar</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Todas' },
                  { id: 'CHAT', label: 'Mensajes' },
                  { id: 'NEW_PRODUCT', label: 'Productos' },
                  { id: 'ORDER_UPDATE', label: 'Pedidos' },
                  { id: 'PROMOTION', label: 'Ofertas' },
                  { id: 'STOCK_ALERT', label: 'Stock' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as FilterType)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                      activeFilter === tab.id 
                        ? 'bg-teal-600 text-white shadow-sm' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List Stream */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center my-auto">
                  <div className="bg-slate-100 p-5 rounded-2xl mb-3 text-slate-400">
                    <BellOff className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-slate-800 font-black text-sm mb-1">
                    {activeFilter === 'ALL' ? 'Todo al día' : 'Sin notificaciones en esta sección'}
                  </h3>
                  <p className="text-slate-500 text-xs font-medium max-w-[200px]">
                    No tienes alertas pendientes para mostrar en este momento.
                  </p>
                </div>
              ) : (
                filteredNotifications.map(n => (
                  <NotificationItem 
                    key={n.id} 
                    notification={n} 
                    onRead={(id) => handleReadItem(id, n.idsToMarkRead)}
                    onDelete={(id) => handleDeleteItem(id, n.idsToMarkRead)}
                    onClick={(notif) => {
                      if (!notif.read) handleReadItem(notif.id, notif.idsToMarkRead);
                      if (soundEnabled) notificationAudio.playChatPing();
                      onNavigate(notif);
                      onClose();
                    }}
                  />
                ))
              )}
            </div>

            {/* Footer Action Bar */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center gap-2">
                <button 
                  onClick={() => {
                    markAllAsRead(userId);
                    if (soundEnabled) notificationAudio.playOrderChime();
                  }}
                  className="flex-1 py-2.5 bg-white border border-slate-300 rounded-xl text-[11px] font-black text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors shadow-xs active:scale-[0.99]"
                >
                  <CheckCheck className="h-3.5 w-3.5 text-teal-600" /> 
                  <span>Marcar leídas</span>
                </button>

                <button 
                  onClick={handleDeleteAll}
                  className="py-2.5 px-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors shadow-xs active:scale-[0.99]"
                  title="Eliminar todas las notificaciones"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Vaciar todas</span>
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
