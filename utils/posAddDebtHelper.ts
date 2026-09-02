import { CreditTicket, CartItem, Product, DebtAddition } from '../types';
import { updateCreditDB } from '../services/db.credits';
import { updateStockDB } from '../services/db.products';
import { addOrderDB } from '../services/db.orders';
import { createCreditPaymentOrder } from './creditPaymentOrders';

export interface AddDebtParams {
  credit: CreditTicket;
  cartItems: CartItem[];
  products: Product[];
  customNote?: string;
  initialAbono?: number;
  initialPaymentMethod?: 'CASH' | 'TRANSFER';
  cashGiven?: number;
}

export interface AddDebtResult {
  updatedCredit: CreditTicket;
  additionTotal: number;
  previousPending: number;
  newPending: number;
  initialAbono: number;
}

/**
 * Calcula el total en dólares de los productos que se van a agregar a la deuda,
 * respetando si se seleccionó por caja o unidad.
 */
export const calculateCartAdditionTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    const isBox = item.selectedUnit === 'BOX';
    const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    return sum + (price * item.quantity);
  }, 0);
};

/**
 * Procesa la suma de productos del carrito a una cuenta de crédito/deuda existente:
 * 1. Fusiona los productos en la lista principal del ticket.
 * 2. Guarda un registro histórico de adición (DebtAddition).
 * 3. Si hubo abono parcial inmediato en esta entrega, crea la orden contable para caja y pedidos.
 * 4. Descuenta el inventario físico de la farmacia.
 * 5. Actualiza la deuda en la base de datos.
 */
export const executeAddDebtToCredit = async ({
  credit,
  cartItems,
  products,
  customNote,
  initialAbono = 0,
  initialPaymentMethod = 'CASH',
  cashGiven
}: AddDebtParams): Promise<AddDebtResult> => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('No hay medicamentos en el carrito para sumar a la deuda.');
  }

  const additionTotal = calculateCartAdditionTotal(cartItems);
  const currentPaid = credit.paidAmount || 0;
  const previousPending = Math.max(0, credit.total - currentPaid);

  // 1. Fusionar items (incrementando cantidad si ya existía el mismo producto y presentación)
  const mergedItems: CartItem[] = [...credit.items];
  for (const newItem of cartItems) {
    const existingIndex = mergedItems.findIndex(
      i => i.id === newItem.id && i.selectedUnit === newItem.selectedUnit
    );
    if (existingIndex >= 0) {
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],
        quantity: mergedItems[existingIndex].quantity + newItem.quantity
      };
    } else {
      mergedItems.push({ ...newItem });
    }
  }

  // 2. Crear registro histórico de la adición
  const newDebtAddition: DebtAddition = {
    id: `ADD-DEBT-${Date.now()}`,
    date: new Date().toISOString(),
    items: [...cartItems],
    subtotal: additionTotal,
    note: customNote?.trim() || 'Despacho adicional desde Punto de Venta (POS)'
  };

  const newTotal = credit.total + additionTotal;
  const newPaidAmount = currentPaid + initialAbono;
  const newPending = Math.max(0, newTotal - newPaidAmount);

  // 3. Preparar registro de pagos si hubo abono inmediato
  const updatedPayments = [...(credit.payments || [])];
  if (initialAbono > 0) {
    updatedPayments.push({
      id: `PAY-ADD-${Date.now()}`,
      date: new Date().toISOString(),
      amount: initialAbono,
      paymentMethod: initialPaymentMethod,
      note: `Abono en entrega adicional (Ref #${credit.id.slice(-6).toUpperCase()})${customNote ? `: ${customNote}` : ''}`
    });
  }

  const updatedCredit: CreditTicket = {
    ...credit,
    items: mergedItems,
    subtotal: credit.subtotal + additionTotal,
    total: newTotal,
    status: newPending === 0 ? 'PAGADO' : 'PENDIENTE',
    paidAmount: newPaidAmount,
    payments: updatedPayments,
    additionalDebts: [...(credit.additionalDebts || []), newDebtAddition]
  };

  // 4. Si hubo abono inmediato, registrar en caja y pedidos
  if (initialAbono > 0) {
    const abonoOrder = createCreditPaymentOrder(
      credit,
      initialAbono,
      initialPaymentMethod,
      cashGiven,
      `Abono en entrega adicional de fiado${customNote ? ` | ${customNote}` : ''}`
    );
    await addOrderDB(abonoOrder);
  }

  // 5. Descontar stock de productos
  for (const item of cartItems) {
    const orig = products.find(p => p.id === item.id);
    if (orig) {
      const isBox = item.selectedUnit === 'BOX';
      const unitsToSubtract = isBox ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
      const newStock = Math.max(0, orig.stock - unitsToSubtract);
      await updateStockDB(item.id, newStock);
    }
  }

  // 6. Actualizar registro en base de datos
  await updateCreditDB(updatedCredit);

  return {
    updatedCredit,
    additionTotal,
    previousPending,
    newPending,
    initialAbono
  };
};

/**
 * Imprime un comprobante térmico tipo "Anexo de Deuda / Suma a Cuenta"
 */
export const printCreditAdditionVoucher = (
  credit: CreditTicket,
  addedItems: CartItem[],
  additionTotal: number,
  previousPending: number,
  newPending: number,
  initialAbono: number = 0
) => {
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  const itemsHtml = addedItems.map(item => {
    const isBox = item.selectedUnit === 'BOX';
    const priceToUse = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    const unitLabel = isBox ? `[CJ x${item.unitsPerBox || 1}]` : '[UN]';
    return `
      <div class="item-row">
        <div class="item-name bold">${item.name.toUpperCase()}</div>
        <div class="item-details">
          <span>${item.quantity} x $${priceToUse.toFixed(2)} ${unitLabel}</span>
          <span>+$${(priceToUse * item.quantity).toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');

  const content = `
    <html>
      <head>
        <title>ANEXO DE DEUDA - ${credit.id.slice(-6)}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 48mm; 
            padding: 2mm; 
            margin: 0; 
            font-size: 11px; 
            color: #000; 
            line-height: 1.15;
            font-weight: 700;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: 900; }
          .divider { border-top: 2px dashed #000; margin: 6px 0; }
          .header-main { font-size: 15px; margin-bottom: 2px; font-weight: 900; }
          .item-row { margin-bottom: 6px; }
          .item-details { display: flex; justify-content: space-between; font-size: 10px; }
          .totals-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10.5px; }
          .pending-box { border: 2px solid #000; padding: 5px; margin-top: 6px; text-align: center; }
          .signature-area { margin-top: 25px; text-align: center; border-top: 1px solid #000; padding-top: 4px; font-size: 9px; }
          .footer { margin-top: 12px; font-size: 8.5px; text-align: center; }
          .uppercase { text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="text-center bold header-main">FARMACIA VITALIS</div>
        <div class="text-center uppercase" style="font-size: 9px;">Tu Salud Al Día</div>
        <div class="text-center" style="font-size: 8px;">Machalilla, Manabí • TEL: 0998506160</div>
        
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 10.5px; background: #eee; padding: 3px;">
          ANEXO: CONSUMO ADICIONAL FIADO
        </div>
        <div class="divider"></div>

        <div style="font-size: 9.5px; margin-bottom: 6px;">
          <div><span class="bold">TICKET CUENTA:</span> #${credit.id.slice(-6).toUpperCase()}</div>
          <div><span class="bold">FECHA ADICIÓN:</span> ${new Date().toLocaleString('es-EC')}</div>
          <div><span class="bold">CLIENTE:</span> ${credit.customerName.toUpperCase()}</div>
          ${credit.customerPhone ? `<div><span class="bold">TELÉFONO:</span> ${credit.customerPhone}</div>` : ''}
        </div>

        <div class="divider"></div>
        <div class="bold" style="font-size: 9px; margin-bottom: 4px;">MEDICAMENTOS AGREGADOS A LA DEUDA:</div>
        ${itemsHtml}

        <div class="divider"></div>
        
        <div class="totals-row">
          <span>SALDO ANTERIOR:</span>
          <span>$${previousPending.toFixed(2)}</span>
        </div>

        <div class="totals-row">
          <span>+ VALOR AGREGADO:</span>
          <span class="bold">+$${additionTotal.toFixed(2)}</span>
        </div>

        ${initialAbono > 0 ? `
          <div class="totals-row" style="color: #000;">
            <span>- ABONO INMEDIATO:</span>
            <span class="bold">-$${initialAbono.toFixed(2)}</span>
          </div>
        ` : ''}

        <div class="pending-box">
          <div style="font-size: 8.5px; font-weight: 800;">NUEVO SALDO TOTAL PENDIENTE:</div>
          <div style="font-size: 16px; font-weight: 900;">$${newPending.toFixed(2)}</div>
        </div>

        <div class="signature-area">
          <div style="height: 22px;"></div>
          __________________________________<br>
          <span class="bold">FIRMA DE CONFORMIDAD</span><br>
          <span style="font-size: 8px;">${credit.customerName.toUpperCase()}</span>
        </div>

        <div class="footer">
          Se sumaron estos productos a su cuenta fiada de Farmacia Vitalis.<br>
          ¡Gracias por su puntual cumplimiento!
        </div>
        <div style="height: 8mm;"></div>
      </body>
    </html>
  `;

  const frameDoc = printFrame.contentWindow?.document;
  if (frameDoc) {
    frameDoc.open();
    frameDoc.write(content);
    frameDoc.close();
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 500);
  }
};
