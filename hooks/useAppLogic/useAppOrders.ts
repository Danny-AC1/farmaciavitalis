import { Product, Order, User, CartItem, CheckoutFormData } from '../../types';
import { addOrderDB, updateUserFieldsDB, updateStockDB } from '../../services/db';

export const useAppOrders = (
  currentUser: User | null, 
  cart: CartItem[], 
  subtotal: number, 
  products: Product[],
  setCart: (v: CartItem[]) => void,
  setView: (v: any) => void,
  setShowAuthModal: (v: boolean) => void
) => {
  const handleConfirmOrder = async (details: CheckoutFormData, discount: number, pointsRedeemed: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const orderId = `WEB-${Date.now()}`;
    const finalTotal = subtotal + details.deliveryFee - discount;
    const order: Order = {
      id: orderId,
      customerName: details.name,
      customerPhone: details.phone,
      customerAddress: `${details.deliveryZone}: ${details.address}`,
      items: cart,
      subtotal,
      deliveryFee: details.deliveryFee,
      discount,
      pointsRedeemed,
      total: finalTotal,
      paymentMethod: details.paymentMethod,
      cashGiven: details.cashGiven ? parseFloat(details.cashGiven) : undefined,
      status: 'PENDING',
      source: 'ONLINE',
      date: new Date().toISOString(),
      userId: currentUser.uid,
      lat: details.lat,
      lng: details.lng
    };

    try {
      await addOrderDB(order);
      await updateUserFieldsDB(currentUser.uid, {
          address: details.address,
          lat: details.lat,
          lng: details.lng,
          deliveryZone: details.deliveryZone,
          phone: details.phone
      });

      for (const item of cart) {
        const orig = products.find(p => p.id === item.id);
        if (orig) {
          const unitsToSubtract = item.selectedUnit === 'BOX' ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
          await updateStockDB(item.id, Math.max(0, orig.stock - unitsToSubtract));
        }
      }

      const itemsText = cart.map(i => `- ${i.quantity}x ${i.name} (${i.selectedUnit === 'BOX' ? 'Caja' : 'Unid'})`).join('\n');
      const mapsLink = order.lat && order.lng ? `\n📍 *Ubicación GPS:* https://www.google.com/maps?q=${order.lat},${order.lng}` : '';
      
      const waMessage = `*NUEVO PEDIDO VITALIS* 💊\n\n` +
        `*Orden:* #${orderId.slice(-8)}\n` +
        `*Cliente:* ${order.customerName}\n` +
        `*Zona:* ${details.deliveryZone}\n` +
        `*Dirección:* ${details.address}\n` +
        mapsLink + `\n\n` +
        `*PRODUCTOS:*\n${itemsText}\n\n` +
        `*Subtotal:* $${order.subtotal.toFixed(2)}\n` +
        `*Envío:* $${order.deliveryFee.toFixed(2)}\n` +
        (order.discount ? `*Descuento:* -$${order.discount.toFixed(2)}\n` : '') +
        `*TOTAL A PAGAR: $${order.total.toFixed(2)}*\n\n` +
        `*Método de Pago:* ${order.paymentMethod === 'CASH' ? 'Efectivo 💵' : 'Transferencia 🏦'}\n` +
        (order.paymentMethod === 'CASH' && order.cashGiven ? `*Paga con:* $${order.cashGiven.toFixed(2)}\n*Cambio:* $${(order.cashGiven - order.total).toFixed(2)}` : '');

      const waNumber = "593998506160";
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`, '_blank');
      setCart([]);
      setView('SUCCESS');
    } catch (e) {
      console.error(e);
      alert("Error al procesar el pedido");
    }
  };

  return { handleConfirmOrder };
};
