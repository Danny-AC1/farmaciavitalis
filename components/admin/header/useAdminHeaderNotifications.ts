import { useState, useRef, useEffect } from 'react';
import { Order, Product, ServiceBooking } from '../../../types';
import { SupportChat } from '../../../services/db.support';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  triggerNativeNotification 
} from '../../../services/nativeNotificationService';
import { registerDeviceForPush } from '../../../services/pushSubscriptionService';
import { VitalisToast } from '../../notifications/VitalisToastEngine';
import { dispatchBatchEvents, dispatchSingleEvent } from './adminNotificationDispatcher';

const DISMISSED_STORAGE_KEY = 'vitalis_admin_dismissed_ids';
const LAST_SEEN_STORAGE_KEY = 'vitalis_admin_last_seen_timestamp';

interface UseAdminHeaderNotificationsProps {
  pendingOrders: Order[];
  lowStockItems: Product[];
  pendingBookings: ServiceBooking[];
  unreadChats: SupportChat[];
  soundEnabled: boolean;
}

export function useAdminHeaderNotifications({
  pendingOrders,
  lowStockItems,
  pendingBookings,
  unreadChats,
  soundEnabled
}: UseAdminHeaderNotificationsProps) {
  const [toasts, setToasts] = useState<VitalisToast[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DISMISSED_STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const prevOrdersRef = useRef<string[]>([]);
  const prevLowStockRef = useRef<string[]>([]);
  const prevBookingsRef = useRef<string[]>([]);
  const prevChatsSignaturesRef = useRef<Record<string, string>>({});
  
  const isInitialPhaseRef = useRef(true);
  const initialBatchSummaryShownRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialPhaseRef.current = false;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const updateDismissedIds = (newIds: string[]) => {
    setDismissedIds(newIds);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(newIds.slice(-500)));
      }
    } catch (e) {
      console.error('Error guardando notificaciones descartadas:', e);
    }
  };

  useEffect(() => {
    setPushPermission(getNotificationPermission());
  }, []);

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    const newPerm = getNotificationPermission();
    setPushPermission(newPerm);
    if (granted) {
      await registerDeviceForPush('admin', 'ADMIN', soundEnabled, true);
      triggerNativeNotification('Alertas Vitalis Activas 🔔', {
        body: 'Notificaciones del sistema configuradas correctamente en este dispositivo.'
      });
    }
    setShowDeviceModal(true);
  };

  const activeOrders = pendingOrders.filter(o => !dismissedIds.includes(`order-${o.id}`));
  const activeLowStock = lowStockItems.filter(p => !dismissedIds.includes(`stock-${p.id}`));
  const activeBookings = pendingBookings.filter(b => !dismissedIds.includes(`booking-${b.id}`));
  const activeChats = unreadChats.filter(c => !dismissedIds.includes(`chat-${c.id}`));

  const totalNotifications = activeOrders.length + activeLowStock.length + activeBookings.length + activeChats.length;

  useEffect(() => {
    const currentOrderIds = pendingOrders.map(o => o.id);
    const currentLowStockIds = lowStockItems.map(p => p.id);
    const currentBookingIds = pendingBookings.map(b => b.id);

    const currentChatSignatures: Record<string, string> = {};
    unreadChats.forEach(c => {
      const timeKey = (c.lastMessageTime as any)?.seconds || c.lastMessageTime || '';
      currentChatSignatures[c.id] = `${c.lastMessageText || ''}_${timeKey}`;
    });

    if (isInitialPhaseRef.current) {
      prevOrdersRef.current = currentOrderIds;
      prevLowStockRef.current = currentLowStockIds;
      prevBookingsRef.current = currentBookingIds;
      prevChatsSignaturesRef.current = currentChatSignatures;

      const activeOrd = pendingOrders.filter(o => !dismissedIds.includes(`order-${o.id}`));
      const activeStk = lowStockItems.filter(p => !dismissedIds.includes(`stock-${p.id}`));
      const activeBkg = pendingBookings.filter(b => !dismissedIds.includes(`booking-${b.id}`));
      const activeCht = unreadChats.filter(c => !dismissedIds.includes(`chat-${c.id}`));

      const totalInitialActive = activeOrd.length + activeStk.length + activeBkg.length + activeCht.length;

      if (totalInitialActive > 0 && !initialBatchSummaryShownRef.current) {
        initialBatchSummaryShownRef.current = true;
        const parts: string[] = [];
        if (activeOrd.length > 0) parts.push(`${activeOrd.length} pedido${activeOrd.length > 1 ? 's' : ''}`);
        if (activeStk.length > 0) parts.push(`${activeStk.length} alerta${activeStk.length > 1 ? 's' : ''} de stock`);
        if (activeBkg.length > 0) parts.push(`${activeBkg.length} cita${activeBkg.length > 1 ? 's' : ''}`);
        if (activeCht.length > 0) parts.push(`${activeCht.length} chat${activeCht.length > 1 ? 's' : ''}`);

        const summaryText = parts.length > 1 ? `Tienes ${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}` : `Tienes ${parts[0]}`;

        setToasts([{
          id: `toast-summary-${Date.now()}`,
          type: 'SUMMARY',
          title: 'Resumen de Actividad',
          desc: summaryText,
          actionLabel: 'Ver Alertas',
          tab: activeOrd.length > 0 ? 'orders' : 'stock_quick'
        }]);
      }
      return;
    }

    const newOrders = pendingOrders.filter(o => !prevOrdersRef.current.includes(o.id) && !dismissedIds.includes(`order-${o.id}`));
    const newLowStocks = lowStockItems.filter(p => !prevLowStockRef.current.includes(p.id) && !dismissedIds.includes(`stock-${p.id}`));
    const newBookings = pendingBookings.filter(b => !prevBookingsRef.current.includes(b.id) && !dismissedIds.includes(`booking-${b.id}`));
    const updatedChats = unreadChats.filter(c => {
      const prevSig = prevChatsSignaturesRef.current[c.id];
      const currentSig = currentChatSignatures[c.id];
      return (!prevSig || prevSig !== currentSig) && !dismissedIds.includes(`chat-${c.id}`);
    });

    const totalNewEvents = newOrders.length + newLowStocks.length + newBookings.length + updatedChats.length;

    if (totalNewEvents > 0) {
      if (totalNewEvents > 1) {
        dispatchBatchEvents(newOrders, newLowStocks, newBookings, updatedChats, soundEnabled, pushPermission, setToasts);
      } else {
        dispatchSingleEvent(newOrders, newLowStocks, newBookings, updatedChats, soundEnabled, pushPermission, setToasts);
      }
    }

    prevOrdersRef.current = currentOrderIds;
    prevLowStockRef.current = currentLowStockIds;
    prevBookingsRef.current = currentBookingIds;
    prevChatsSignaturesRef.current = currentChatSignatures;
  }, [pendingOrders, lowStockItems, pendingBookings, unreadChats, soundEnabled, pushPermission, dismissedIds]);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const dismissNotification = (id: string) => {
    const next = Array.from(new Set([...dismissedIds, id]));
    updateDismissedIds(next);
  };

  const dismissAllNotifications = () => {
    const allIds = [
      ...activeOrders.map(o => `order-${o.id}`),
      ...activeLowStock.map(p => `stock-${p.id}`),
      ...activeBookings.map(b => `booking-${b.id}`),
      ...activeChats.map(c => `chat-${c.id}`)
    ];
    const next = Array.from(new Set([...dismissedIds, ...allIds]));
    updateDismissedIds(next);
    try {
      localStorage.setItem(LAST_SEEN_STORAGE_KEY, String(Date.now()));
    } catch (e) {
      console.error(e);
    }
    setToasts([]);
  };

  return {
    toasts,
    setToasts,
    removeToast,
    pushPermission,
    showDeviceModal,
    setShowDeviceModal,
    handleEnablePush,
    activeOrders,
    activeLowStock,
    activeBookings,
    activeChats,
    totalNotifications,
    dismissNotification,
    dismissAllNotifications
  };
}
