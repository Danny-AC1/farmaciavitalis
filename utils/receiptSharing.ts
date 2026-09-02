import { Order } from '../types';

export interface ReceiptShareData {
  order: Order;
  pharmacyName?: string;
  pharmacyPhone?: string;
  pharmacyAddress?: string;
  pharmacyWebsite?: string;
}

/**
 * Normaliza y formatea un número telefónico ecuatoriano o internacional para WhatsApp/SMS.
 */
export const formatPhoneNumberForMessaging = (rawPhone: string, defaultCountry = '593'): string => {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  
  if (digits.startsWith(defaultCountry)) {
    return digits;
  }
  
  if (digits.startsWith('0')) {
    return `${defaultCountry}${digits.slice(1)}`;
  }
  
  return digits.length <= 9 ? `${defaultCountry}${digits}` : digits;
};

/**
 * Genera el texto premium formateado con emojis y estructura limpia para WhatsApp/Telegram.
 */
export const generateReceiptText = (order: Order, options?: { isShort?: boolean }): string => {
  const dateStr = new Date(order.date).toLocaleString('es-EC', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const paymentLabel = order.paymentMethod === 'CASH' ? '💵 Efectivo' : '🏦 Transferencia';
  const statusLabel = 
    order.status === 'DELIVERED' ? '✅ Entregado / Completado' :
    order.status === 'IN_TRANSIT' ? '🛵 En Camino' : '⏳ Procesando en Farmacia';

  const itemsList = order.items.map((item, idx) => {
    const isBox = item.selectedUnit === 'BOX';
    const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    const unitTag = isBox ? `[Caja x${item.unitsPerBox || 1}]` : '[Unid]';
    return `${idx + 1}. *${item.name}* ${unitTag}\n   ↳ ${item.quantity} x $${price.toFixed(2)} = *$${(price * item.quantity).toFixed(2)}*`;
  }).join('\n');

  if (options?.isShort) {
    return `🧾 *FARMACIA VITALIS* | Comprobante #${order.id.slice(-6)}\n` +
      `👤 Cliente: *${order.customerName}*\n` +
      `📅 Fecha: ${dateStr}\n` +
      `📦 Artículos: ${order.items.reduce((acc, i) => acc + i.quantity, 0)} unid.\n` +
      `💰 *Total: $${order.total.toFixed(2)}* (${paymentLabel})\n` +
      `📍 Dir: ${order.customerAddress || 'Retiro en Farmacia'}\n` +
      `¡Gracias por tu compra en Farmacia Vitalis! 💚`;
  }

  return `🌿 *FARMACIA VITALIS - COMPROBANTE DIGITAL* 🌿\n` +
    `_Tu Salud Al Día • Machalilla, Ecuador_\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🧾 *Orden:* #${order.id.slice(-6).toUpperCase()}\n` +
    `📅 *Fecha:* ${dateStr}\n` +
    `📌 *Estado:* ${statusLabel}\n` +
    `👤 *Cliente:* ${order.customerName}\n` +
    `📱 *Teléfono:* ${order.customerPhone || 'N/A'}\n` +
    `📍 *Dirección:* ${order.customerAddress || 'Entrega en mostrador'}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💊 *DETALLE DE MEDICAMENTOS:*\n\n` +
    `${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔹 *Subtotal:* $${order.subtotal.toFixed(2)}\n` +
    (order.deliveryFee ? `🔹 *Envío:* $${order.deliveryFee.toFixed(2)}\n` : '') +
    (order.discount ? `🔹 *Descuento:* -$${order.discount.toFixed(2)}\n` : '') +
    (order.pointsRedeemed ? `🔹 *Puntos Canjeados:* -${order.pointsRedeemed} pts\n` : '') +
    `💎 *TOTAL A PAGAR:* *$${order.total.toFixed(2)}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 *Método de Pago:* ${paymentLabel}\n` +
    (order.paymentMethod === 'CASH' && order.cashGiven ? 
      `💵 *Paga con:* $${order.cashGiven.toFixed(2)}\n` +
      `🪙 *Cambio:* $${(order.cashGiven - order.total).toFixed(2)}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✨ *¡Gracias por confiar en Farmacia Vitalis!*\n` +
    `📞 Consultas y Delivery: 0998506160\n` +
    `🌐 vitalis.ec`;
};

/**
 * Genera el asunto y cuerpo para correo electrónico.
 */
export const generateReceiptEmail = (order: Order) => {
  const subject = `Comprobante de Compra #${order.id.slice(-6).toUpperCase()} - Farmacia Vitalis`;
  const body = generateReceiptText(order);
  return {
    subject,
    body,
    mailtoUrl: `mailto:${encodeURIComponent(order.customerEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };
};

/**
 * Genera el enlace directo para WhatsApp.
 */
export const generateWhatsAppLink = (order: Order, customPhone?: string): string => {
  const targetPhone = customPhone || order.customerPhone;
  const formattedPhone = formatPhoneNumberForMessaging(targetPhone);
  const text = generateReceiptText(order);
  
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

/**
 * Genera el enlace directo para Telegram.
 */
export const generateTelegramLink = (order: Order): string => {
  const text = generateReceiptText(order);
  return `https://t.me/share/url?url=${encodeURIComponent('https://vitalis.ec')}&text=${encodeURIComponent(text)}`;
};

/**
 * Genera el enlace directo para SMS estándar.
 */
export const generateSmsLink = (order: Order, customPhone?: string): string => {
  const targetPhone = customPhone || order.customerPhone;
  const digits = targetPhone.replace(/\D/g, '');
  const text = generateReceiptText(order, { isShort: true });
  
  // Soporte universal para URI de SMS (iOS / Android / Desktop)
  return `sms:${digits}?body=${encodeURIComponent(text)}`;
};

/**
 * Ejecuta el Web Share API nativo si está disponible en el navegador/dispositivo.
 */
export const executeNativeShare = async (order: Order): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Comprobante #${order.id.slice(-6)} - Farmacia Vitalis`,
        text: generateReceiptText(order),
        url: window.location.origin
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Error al compartir nativamente:', err);
      }
      return false;
    }
  }
  return false;
};
