import { CreditTicket, Order, CartItem } from '../types';

export interface CreditPaymentDetails {
  debtorName: string;
  isLiquidation: boolean;
  creditRef: string;
  remainingAmount?: number;
  totalDebt?: number;
  originalNote?: string;
}

/**
 * Crea un registro de tipo Order a partir de un abono o liquidación de crédito.
 * Esto permite:
 * 1. Sumar automáticamente el dinero (Efectivo / Transferencia) al Corte de Caja del día.
 * 2. Que aparezca en el historial de Pedidos con su propia pestaña y ficha visual.
 * 3. Emitir tickets térmicos y comprobantes digitales oficiales (incluso en imagen).
 */
export const createCreditPaymentOrder = (
  credit: CreditTicket,
  amountPaid: number,
  paymentMethod: 'CASH' | 'TRANSFER',
  cashGiven?: number,
  customNote?: string
): Order => {
  const currentPaid = credit.paidAmount || 0;
  const newPaidAmount = currentPaid + amountPaid;
  const isFullyPaid = newPaidAmount >= credit.total - 0.001;
  const remaining = Math.max(0, credit.total - newPaidAmount);
  const creditCode = credit.id.slice(-6).toUpperCase();

  const itemDescription = isFullyPaid
    ? `Cancelación total de deuda. Ticket Ref: #${creditCode}. Deuda original: $${credit.total.toFixed(2)}.`
    : `Abono a deuda. Ticket Ref: #${creditCode}. Deuda original: $${credit.total.toFixed(2)}. Saldo restante: $${remaining.toFixed(2)}.`;

  const items: CartItem[] = [
    {
      id: `credit_payment_${credit.id}`,
      name: `${isFullyPaid ? 'Cancelación Total' : 'Abono'} de Fiado - ${credit.customerName}`,
      description: itemDescription,
      price: amountPaid,
      costPrice: 0,
      image: '',
      category: 'Crédito / Fiados',
      stock: 1,
      quantity: 1,
      selectedUnit: 'UNIT'
    }
  ];

  const noteText = `Abono de fiado (Ticket #${creditCode}) - ${
    isFullyPaid ? 'Liquidación total' : 'Abono parcial'
  }${customNote ? ` | ${customNote}` : ''}`;

  return {
    id: `ORD-ABONO-${Date.now()}`,
    customerName: credit.customerName,
    customerPhone: credit.customerPhone || '0998506160',
    customerAddress: credit.customerAddress || 'Farmacia Vitalis - Mostrador',
    items,
    subtotal: amountPaid,
    deliveryFee: 0,
    discount: 0,
    total: amountPaid,
    paymentMethod,
    cashGiven: paymentMethod === 'CASH' && cashGiven ? cashGiven : undefined,
    status: 'DELIVERED', // Entregado para que sume a caja de inmediato
    source: 'POS',
    notes: noteText,
    date: new Date().toISOString()
  };
};

/**
 * Identifica si un pedido corresponde a un pago/abono de medicamento fiado.
 */
export const isCreditPaymentOrder = (order: Order): boolean => {
  if (!order) return false;
  
  if (order.id.startsWith('ORD-ABONO-')) return true;

  if (order.items && order.items.some(item => 
    item.category === 'Crédito / Fiados' || 
    item.category === 'Crédito' || 
    item.id === 'credit_payment' || 
    item.id === 'credit_liquidation' ||
    item.id.startsWith('credit_payment_')
  )) {
    return true;
  }

  if (order.notes && order.notes.toLowerCase().includes('abono')) {
    return true;
  }

  return false;
};

/**
 * Extrae información detallada y legible del abono para su representación visual.
 */
export const extractCreditPaymentDetails = (order: Order): CreditPaymentDetails => {
  const isLiquidation = order.items.some(i => 
    i.name.toLowerCase().includes('cancelación') || 
    i.name.toLowerCase().includes('liquidación') ||
    i.id === 'credit_liquidation'
  ) || (order.notes?.toLowerCase().includes('liquidación') ?? false);

  // Extraer número de ticket si existe
  const refMatch = order.notes?.match(/#([A-Z0-9_-]+)/i) || 
                   order.items[0]?.description?.match(/#([A-Z0-9_-]+)/i);
  const creditRef = refMatch ? `#${refMatch[1]}` : `#${order.id.slice(-6).toUpperCase()}`;

  // Extraer saldo restante si existe en la descripción
  let remainingAmount: number | undefined;
  const remainingMatch = order.items[0]?.description?.match(/saldo restante:\s*\$([0-9.]+)/i);
  if (remainingMatch && remainingMatch[1]) {
    remainingAmount = parseFloat(remainingMatch[1]);
  }

  return {
    debtorName: order.customerName,
    isLiquidation,
    creditRef,
    remainingAmount,
    originalNote: order.notes
  };
};
