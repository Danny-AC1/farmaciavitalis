import { Order, Product, ServiceBooking } from '../../../types';
import { SupportChat } from '../../../services/db.support';
import { triggerNativeNotification } from '../../../services/nativeNotificationService';
import { notificationAudio } from '../../../services/notificationAudioService';
import { VitalisToast } from '../../notifications/VitalisToastEngine';

export function dispatchBatchEvents(
  newOrders: Order[],
  newLowStocks: Product[],
  newBookings: ServiceBooking[],
  updatedChats: SupportChat[],
  soundEnabled: boolean,
  pushPermission: NotificationPermission,
  setToasts: React.Dispatch<React.SetStateAction<VitalisToast[]>>
) {
  const parts: string[] = [];
  if (newOrders.length > 0) parts.push(`${newOrders.length} pedido${newOrders.length > 1 ? 's' : ''}`);
  if (newLowStocks.length > 0) parts.push(`${newLowStocks.length} alerta${newLowStocks.length > 1 ? 's' : ''} de stock`);
  if (newBookings.length > 0) parts.push(`${newBookings.length} cita${newBookings.length > 1 ? 's' : ''}`);
  if (updatedChats.length > 0) parts.push(`${updatedChats.length} mensaje${updatedChats.length > 1 ? 's' : ''}`);

  const batchDesc = `Se registraron ${parts.join(' y ')}`;
  setToasts(prev => [
    ...prev.filter(t => t.type !== 'SUMMARY'),
    {
      id: `toast-batch-${Date.now()}`,
      type: 'SUMMARY',
      title: 'Nuevas Alertas Recibidas',
      desc: batchDesc,
      actionLabel: 'Ver Alertas',
      tab: newOrders.length > 0 ? 'orders' : 'stock_quick'
    }
  ]);
  if (soundEnabled) notificationAudio.playOrderChime();
  if (pushPermission === 'granted') {
    triggerNativeNotification('Alertas Vitalis Recibidas 🔔', {
      body: batchDesc,
      tag: `vitalis-admin-batch-${Date.now()}`
    });
  }
}

export function dispatchSingleEvent(
  newOrders: Order[],
  newLowStocks: Product[],
  newBookings: ServiceBooking[],
  updatedChats: SupportChat[],
  soundEnabled: boolean,
  pushPermission: NotificationPermission,
  setToasts: React.Dispatch<React.SetStateAction<VitalisToast[]>>
) {
  if (newOrders.length === 1) {
    const o = newOrders[0];
    setToasts(prev => [...prev, {
      id: `toast-order-${o.id}`,
      type: 'ORDER',
      title: 'Nuevo Pedido Web',
      desc: `${o.customerName} • Total: $${o.total.toFixed(2)}`,
      actionLabel: 'Ver Orden',
      tab: 'orders'
    }]);
    if (soundEnabled) notificationAudio.playOrderChime();
    if (pushPermission === 'granted') {
      triggerNativeNotification('🛒 Nuevo Pedido Web', {
        body: `${o.customerName} - Total: $${o.total.toFixed(2)}`,
        tag: `vitalis-admin-order-${o.id}`
      });
    }
  } else if (newLowStocks.length === 1) {
    const p = newLowStocks[0];
    const isBox = Boolean(p.unitsPerBox && p.unitsPerBox > 1);
    setToasts(prev => [...prev, {
      id: `toast-stock-${p.id}`,
      type: 'STOCK',
      title: isBox ? 'Caja por Terminar 📦' : 'Stock Crítico 🚨',
      desc: isBox 
        ? `${p.name}: Quedan solo ${p.stock} uds de la caja x ${p.unitsPerBox}`
        : `${p.name} se está agotando (${p.stock} un. restantes)`,
      actionLabel: 'Reabastecer',
      tab: 'stock_quick'
    }]);
    if (soundEnabled) notificationAudio.playAlertTone();
    if (pushPermission === 'granted') {
      triggerNativeNotification(isBox ? '📦 Alerta Caja por Terminar' : '⚠️ Stock Crítico', {
        body: isBox 
          ? `${p.name}: Solo quedan ${p.stock} uds restantes de la caja x ${p.unitsPerBox}`
          : `${p.name} (${p.stock} un. restantes)`,
        tag: `vitalis-admin-stock-${p.id}`
      });
    }
  } else if (newBookings.length === 1) {
    const b = newBookings[0];
    setToasts(prev => [...prev, {
      id: `toast-booking-${b.id}`,
      type: 'BOOKING',
      title: 'Nueva Cita Médica 📅',
      desc: `${b.patientName} • ${b.serviceName}`,
      actionLabel: 'Ver Agenda',
      tab: 'bookings'
    }]);
    if (soundEnabled) notificationAudio.playAlertTone();
    if (pushPermission === 'granted') {
      triggerNativeNotification('📅 Nueva Cita Médica', {
        body: `${b.patientName} - ${b.serviceName}`,
        tag: `vitalis-admin-booking-${b.id}`
      });
    }
  } else if (updatedChats.length === 1) {
    const c = updatedChats[0];
    setToasts(prev => [...prev, {
      id: `toast-chat-${c.id}`,
      type: 'CHAT',
      title: `💬 Soporte: ${c.userDisplayName || 'Cliente'}`,
      desc: c.lastMessageText || 'Nuevo mensaje recibido',
      actionLabel: 'Responder',
      tab: 'support',
      chatId: c.id
    }]);
    if (soundEnabled) notificationAudio.playChatPing();
    if (pushPermission === 'granted') {
      triggerNativeNotification(`💬 Soporte: ${c.userDisplayName || 'Cliente'}`, {
        body: c.lastMessageText || 'Nuevo mensaje recibido',
        tag: `vitalis-admin-chat-${c.id}`,
        requireInteraction: true
      });
    }
  }
}
