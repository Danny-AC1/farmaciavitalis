import { CreditTicket, User } from '../types';

/**
 * Encuentra todos los créditos / fiados pendientes de un cliente específico.
 * Busca coincidencias por ID de usuario, cédula, teléfono o nombre.
 */
export const findCustomerCredits = (
  customer: User | { displayName?: string; phone?: string; cedula?: string; uid?: string } | null,
  credits: CreditTicket[]
): CreditTicket[] => {
  if (!customer) return [];

  const nameTrim = customer.displayName?.trim().toLowerCase() || '';
  const phoneTrim = customer.phone?.replace(/\D/g, '') || '';
  const cedulaTrim = customer.cedula?.replace(/\D/g, '') || '';

  return credits.filter(credit => {
    // Si ya está totalmente pagado, no cuenta como deuda pendiente activa
    if (credit.status === 'PAGADO') return false;

    const creditName = (credit.customerName || '').trim().toLowerCase();
    const creditPhone = (credit.customerPhone || '').replace(/\D/g, '');
    const creditAddress = (credit.customerAddress || '').replace(/\D/g, '');

    // 1. Coincidencia por teléfono
    if (phoneTrim && creditPhone && (phoneTrim === creditPhone || creditPhone.includes(phoneTrim) || phoneTrim.includes(creditPhone))) {
      return true;
    }

    // 2. Coincidencia por cédula (a veces almacenada en customerAddress o en el ticket)
    if (cedulaTrim && creditAddress && creditAddress.includes(cedulaTrim)) {
      return true;
    }

    // 3. Coincidencia exacta o contenida por nombre (al menos 4 caracteres)
    if (nameTrim.length >= 4 && creditName.length >= 4) {
      if (creditName.includes(nameTrim) || nameTrim.includes(creditName)) {
        return true;
      }
    }

    return false;
  });
};

/**
 * Calcula el saldo total pendiente de una lista de créditos.
 */
export const calculatePendingBalance = (credits: CreditTicket[]): number => {
  return credits.reduce((sum, c) => {
    const paid = c.paidAmount || 0;
    const pending = Math.max(0, c.total - paid);
    return sum + pending;
  }, 0);
};

/**
 * Imprime un comprobante físico o pagaré térmico para el cliente que lleva medicamentos fiados.
 */
export const printCreditVoucher = (credit: CreditTicket, _initialAbono?: number) => {
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  const pendingAmount = credit.total - (credit.paidAmount || 0);

  const itemsHtml = credit.items.map(item => {
    const isBox = item.selectedUnit === 'BOX';
    const priceToUse = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    const unitLabel = isBox ? `[CJ x${item.unitsPerBox || 1}]` : '[UN]';
    return `
      <div class="item-row">
        <div class="item-name bold">${item.name.toUpperCase()}</div>
        <div class="item-details">
          <span>${item.quantity} x $${priceToUse.toFixed(2)} ${unitLabel}</span>
          <span>$${(priceToUse * item.quantity).toFixed(2)}</span>
        </div>
      </div>
    `;
  }).join('');

  const content = `
    <html>
      <head>
        <title>COMPROBANTE DE FIADO - ${credit.id.slice(-6)}</title>
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
          .totals-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
          .total-final { font-size: 13px; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; font-weight: 900; }
          .pending-box { border: 2px solid #000; padding: 4px; margin-top: 6px; text-align: center; }
          .signature-area { margin-top: 30px; text-align: center; border-top: 1px solid #000; padding-top: 4px; font-size: 9px; }
          .footer { margin-top: 14px; font-size: 8.5px; text-align: center; }
          .uppercase { text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="text-center bold header-main">FARMACIA VITALIS</div>
        <div class="text-center uppercase" style="font-size: 9px;">Tu Salud Al Día</div>
        <div class="text-center" style="font-size: 8px;">Machalilla, Manabí • TEL: 0998506160</div>
        
        <div class="divider"></div>
        <div class="text-center bold" style="font-size: 11px; background: #eee; padding: 2px;">
          VALE DE ENTREGA / FIADO
        </div>
        <div class="divider"></div>

        <div style="font-size: 9.5px; margin-bottom: 6px;">
          <div><span class="bold">TICKET #:</span> ${credit.id}</div>
          <div><span class="bold">FECHA:</span> ${new Date(credit.date).toLocaleString('es-EC')}</div>
          <div><span class="bold">CLIENTE:</span> ${credit.customerName.toUpperCase()}</div>
          ${credit.customerPhone ? `<div><span class="bold">TELÉFONO:</span> ${credit.customerPhone}</div>` : ''}
        </div>

        <div class="divider"></div>
        <div class="bold" style="font-size: 9px; margin-bottom: 4px;">MEDICAMENTOS DESPACHADOS:</div>
        ${itemsHtml}

        <div class="divider"></div>
        <div class="totals-row">
          <span>VALOR TOTAL ENTREGA:</span>
          <span class="bold">$${credit.total.toFixed(2)}</span>
        </div>

        ${(credit.paidAmount && credit.paidAmount > 0) ? `
          <div class="totals-row" style="color: #000;">
            <span>ABONO INICIAL REGISTRADO:</span>
            <span class="bold font-mono">-$${credit.paidAmount.toFixed(2)}</span>
          </div>
        ` : ''}

        <div class="pending-box">
          <div style="font-size: 9px; font-weight: 800;">SALDO PENDIENTE POR PAGAR:</div>
          <div style="font-size: 16px; font-weight: 900;">$${pendingAmount.toFixed(2)}</div>
        </div>

        <div class="signature-area">
          <div style="height: 25px;"></div>
          __________________________________<br>
          <span class="bold">FIRMA DE CONFORMIDAD DEL CLIENTE</span><br>
          <span style="font-size: 8px;">${credit.customerName.toUpperCase()}</span>
        </div>

        <div class="footer">
          Me comprometo a cancelar este saldo en los plazos acordados con Farmacia Vitalis.<br>
          ¡Gracias por su confianza!
        </div>
        <div style="height: 10mm;"></div>
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
