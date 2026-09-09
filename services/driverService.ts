// services/driverService.ts
// Servicio avanzado de utilidades para el Panel de Reparto de Farmacia Vitalis

import { Order } from '../types';

export const VITALIS_STORE_LOCATION = {
  lat: -1.483699,
  lng: -80.77338,
  name: 'Farmacia Vitalis - Sede Principal Machalilla'
};

/**
 * Calcula la distancia en kilómetros entre dos coordenadas geográficas (Fórmula de Haversine)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Formato amigable de distancia (ej. 450 m o 2.4 km)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Algoritmo de optimización de paradas secuenciales (Nearest-Neighbor).
 * Ordena los pedidos para minimizar la distancia total de recorrido desde el punto actual.
 */
export function optimizeRouteSequence(
  startPos: { lat: number; lng: number },
  orders: Order[]
): { order: Order; distanceKm: number; legDistanceKm: number }[] {
  if (orders.length <= 1) {
    return orders.map(order => {
      const d = (order.lat && order.lng) 
        ? calculateDistanceKm(startPos.lat, startPos.lng, order.lat, order.lng) 
        : 0;
      return { order, distanceKm: d, legDistanceKm: d };
    });
  }

  const unvisited = [...orders];
  const route: { order: Order; distanceKm: number; legDistanceKm: number }[] = [];
  let currentLat = startPos.lat;
  let currentLng = startPos.lng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const o = unvisited[i];
      if (o.lat && o.lng) {
        const dist = calculateDistanceKm(currentLat, currentLng, o.lat, o.lng);
        if (dist < shortestDist) {
          shortestDist = dist;
          nearestIndex = i;
        }
      } else {
        // Si no tiene coordenadas GPS, la penalizamos con menor prioridad pero sin descartar
        const fallbackDist = 999;
        if (fallbackDist < shortestDist) {
          shortestDist = fallbackDist;
          nearestIndex = i;
        }
      }
    }

    const nextOrder = unvisited.splice(nearestIndex, 1)[0];
    const totalDistFromStart = (nextOrder.lat && nextOrder.lng)
      ? calculateDistanceKm(startPos.lat, startPos.lng, nextOrder.lat, nextOrder.lng)
      : 0;
    const legDist = shortestDist === Infinity || shortestDist === 999 ? 0 : shortestDist;

    route.push({
      order: nextOrder,
      distanceKm: totalDistFromStart,
      legDistanceKm: legDist
    });

    if (nextOrder.lat && nextOrder.lng) {
      currentLat = nextOrder.lat;
      currentLng = nextOrder.lng;
    }
  }

  return route;
}

/**
 * Genera un código OTP de entrega de 4 dígitos determinístico basado en el ID de la orden.
 * Tanto el cliente en su pantalla como el repartidor pueden verificarlo sin servidores extra.
 */
export function getOrderDeliveryOtp(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash << 5) - hash + orderId.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const code = (positive % 9000) + 1000;
  return code.toString();
}

/**
 * Aplica una marca de agua fotográfica con sello de tiempo, pedido y coordenadas GPS.
 * Retorna la imagen en formato JPEG Data URL.
 */
export function applyDeliveryWatermark(
  imageSource: string | File,
  meta: {
    orderId: string;
    customerName: string;
    address: string;
    lat?: number;
    lng?: number;
    date?: Date;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const processImage = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de canvas'));
          return;
        }

        // Limitamos dimensiones para no saturar memoria (máx 1200px ancho)
        const maxWidth = 1200;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Dibujar imagen base
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Barra inferior de marca de agua con fondo oscuro semitransparente
        const barHeight = Math.max(70, Math.round(canvas.height * 0.16));
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight - 20, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
        gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.85)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - barHeight - 20, canvas.width, barHeight + 20);

        // Estilos de texto
        const baseFontSize = Math.max(14, Math.round(canvas.width * 0.022));
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${baseFontSize * 1.1}px sans-serif`;

        const padding = Math.round(canvas.width * 0.035);
        const yStart = canvas.height - barHeight + (baseFontSize * 1.1);

        // Línea 1: Identificación y Pedido
        ctx.fillStyle = '#2dd4bf'; // teal-400
        ctx.fillText('FARMACIA VITALIS • COMPROBANTE DE ENTREGA OFICIAL', padding, yStart);

        // Línea 2: Pedido y Cliente
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `700 ${baseFontSize}px sans-serif`;
        const shortId = meta.orderId.slice(-6).toUpperCase();
        ctx.fillText(`PEDIDO: #${shortId} | CLIENTE: ${meta.customerName.toUpperCase()}`, padding, yStart + (baseFontSize * 1.3));

        // Línea 3: Fecha, Hora y Coordenadas GPS
        ctx.fillStyle = '#cbd5e1'; // slate-300
        ctx.font = `600 ${baseFontSize * 0.85}px sans-serif`;
        const now = meta.date || new Date();
        const dateStr = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const gpsStr = (meta.lat && meta.lng) 
          ? `📍 GPS: ${meta.lat.toFixed(5)}, ${meta.lng.toFixed(5)}`
          : '📍 GPS: Dirección Registrada';

        ctx.fillText(`FECHA: ${dateStr} - ${timeStr} | ${gpsStr}`, padding, yStart + (baseFontSize * 2.5));

        // Obtener data URL optimizada
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen para marca de agua'));
      img.src = src;
    };

    if (imageSource instanceof File) {
      reader.onload = (e) => {
        if (e.target?.result) processImage(e.target.result as string);
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de foto'));
      reader.readAsDataURL(imageSource);
    } else {
      processImage(imageSource);
    }
  });
}

/**
 * Síntesis de voz para modo manos libres / conducción en moto
 */
export function speakOrderInstructions(order: Order): void {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis no es compatible en este navegador');
    return;
  }

  window.speechSynthesis.cancel(); // Cancelar locuciones previas

  const shortId = order.id.slice(-4);
  const paymentText = order.paymentMethod === 'CASH'
    ? `Cobrar ${order.total.toFixed(2)} dólares en efectivo.`
    : `Pago ya transferido por ${order.total.toFixed(2)} dólares.`;

  const notesText = order.notes 
    ? `Nota del cliente: ${order.notes}.` 
    : 'Sin notas adicionales.';

  const textToSpeak = `Siguiente entrega. Pedido número ${shortId} para ${order.customerName}. Dirección: ${order.customerAddress}. ${paymentText} ${notesText}`;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = 'es-EC';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Intentar seleccionar voz en español si está disponible
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => v.lang.startsWith('es'));
  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Normaliza número de teléfono para WhatsApp en Ecuador
 */
export function formatWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('09') && cleaned.length === 10) {
    return '593' + cleaned.substring(1);
  }
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return '593' + cleaned;
  }
  if (!cleaned.startsWith('593') && cleaned.length >= 9) {
    return '593' + cleaned;
  }
  return cleaned;
}

/**
 * Abre WhatsApp con plantillas precargadas y profesionales
 */
export function openWhatsAppMessage(
  phone: string,
  type: 'EN_CAMINO' | 'LLEGANDO' | 'REFERENCIA',
  order: Order
): void {
  const cleanPhone = formatWhatsAppPhone(phone);
  const shortId = order.id.slice(-6).toUpperCase();
  const firstName = order.customerName.split(' ')[0] || 'Cliente';

  let message = '';
  switch (type) {
    case 'EN_CAMINO':
      message = `Hola *${firstName}*, te saluda tu repartidor de *Farmacia Vitalis* 🛵.\n\nYa voy en camino con tu pedido *#${shortId}* a tu dirección: *${order.customerAddress}*.\n\n*Total a pagar:* $${order.total.toFixed(2)} (${order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}).\n\n¡Llegaré en unos minutos!`;
      break;
    case 'LLEGANDO':
      message = `¡Hola *${firstName}*! 👋 Ya me encuentro afuera de tu domicilio con tu pedido de *Farmacia Vitalis* 🛵📦 (#${shortId}). ¿Me confirmas por favor para salir a recibir? Muchas gracias.`;
      break;
    case 'REFERENCIA':
      message = `Hola *${firstName}*, estoy en la zona de tu pedido *#${shortId}*, pero necesitaría una pequeña referencia adicional (color de casa, rejas o local cercano) para llegar más rápido. ¡Gracias!`;
      break;
  }

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Abre app de navegación seleccionada (Google Maps, Waze o Apple Maps)
 */
export function launchNavigationApp(
  app: 'google' | 'waze' | 'apple',
  order: Order
): void {
  const hasCoords = order.lat && order.lng;
  const destinationCoords = hasCoords ? `${order.lat},${order.lng}` : '';
  const fallbackAddress = encodeURIComponent(`${order.customerAddress}, Machalilla, Ecuador`);

  switch (app) {
    case 'waze': {
      if (hasCoords) {
        window.open(`https://waze.com/ul?ll=${destinationCoords}&navigate=yes`, '_blank');
      } else {
        window.open(`https://waze.com/ul?q=${fallbackAddress}&navigate=yes`, '_blank');
      }
      break;
    }
    case 'apple': {
      if (hasCoords) {
        window.open(`https://maps.apple.com/?daddr=${destinationCoords}&dirflg=d`, '_blank');
      } else {
        window.open(`https://maps.apple.com/?daddr=${fallbackAddress}&dirflg=d`, '_blank');
      }
      break;
    }
    case 'google':
    default: {
      if (hasCoords) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${destinationCoords}&travelmode=driving`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${fallbackAddress}`, '_blank');
      }
      break;
    }
  }
}

/**
 * Genera el resumen textual de liquidación de turno del repartidor para WhatsApp
 */
export function generateShiftReportText(
  deliveredOrders: Order[],
  driverName: string = 'Repartidor Vitalis'
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

  const totalDelivered = deliveredOrders.length;
  const cashOrders = deliveredOrders.filter(o => o.paymentMethod === 'CASH');
  const transferOrders = deliveredOrders.filter(o => o.paymentMethod !== 'CASH');

  const totalCash = cashOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalTransfer = transferOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const grandTotal = totalCash + totalTransfer;

  let text = `📦 *REPORTE DE LIQUIDACIÓN DE REPARTO*\n`;
  text += `🏥 *Farmacia Vitalis*\n`;
  text += `👤 *Repartidor:* ${driverName}\n`;
  text += `📅 *Fecha:* ${dateStr} - ${timeStr}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✅ *Entregas completadas:* ${totalDelivered} pedidos\n`;
  text += `💵 *Efectivo a entregar en caja:* $${totalCash.toFixed(2)}\n`;
  text += `🏦 *Total en Transferencias:* $${totalTransfer.toFixed(2)}\n`;
  text += `💰 *TOTAL RECAUDADO:* $${grandTotal.toFixed(2)}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (deliveredOrders.length > 0) {
    text += `📋 *DETALLE DE ENTREGAS:*\n`;
    deliveredOrders.forEach((o, index) => {
      const shortId = o.id.slice(-6).toUpperCase();
      const time = o.deliveredAt 
        ? new Date(o.deliveredAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
        : 'Hoy';
      const pMethod = o.paymentMethod === 'CASH' ? '💵 EFECTIVO' : '🏦 TRANSFERENCIA';
      text += `${index + 1}. #${shortId} - ${o.customerName} | $${o.total.toFixed(2)} (${pMethod}) [${time}]\n`;
    });
  }

  return text;
}
