import { Order, TreasurySession, TreasuryTransaction } from '../types';

/**
 * Utility to print a thermal receipt/ticket for POS orders.
 */
export const printPOSTicket = (order: Order) => {
  const itemsHtml = order.items.map(item => {
    const isBox = item.selectedUnit === 'BOX';
    const priceToUse = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    const unitLabel = isBox ? `[CJ x${item.unitsPerBox}]` : '[UN]';
    
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

  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  const content = `
    <html>
      <head>
        <title>TICKET - ${order.id.slice(-6)}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 48mm; 
            padding: 2mm; 
            margin: 0; 
            font-size: 11px;
            color: #000;
            line-height: 1.1;
            font-weight: 700;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: 900; }
          .divider { border-top: 2px dashed #000; margin: 6px 0; }
          .header-main { font-size: 16px; margin-bottom: 2px; font-weight: 900; }
          .item-row { margin-bottom: 8px; }
          .item-details { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; }
          .totals-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: 700; }
          .total-final { font-size: 14px; border-top: 3px solid #000; padding-top: 4px; margin-top: 5px; font-weight: 900; }
          .mt-1 { margin-top: 6px; }
          .mt-2 { margin-top: 12px; }
          .footer { margin-top: 20px; font-size: 9px; font-style: italic; font-weight: 700; }
          .uppercase { text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="text-center bold header-main">FARMACIA VITALIS</div>
        <div class="text-center uppercase" style="font-size: 8px;">Tu Salud Al Día</div>
        <div class="text-center" style="font-size: 8px;">Machalilla, Ecuador</div>
        <div class="text-center" style="font-size: 8px;">TEL: 0998506160</div>
        
        <div class="divider"></div>
        
        <div class="bold">ORDEN: #${order.id.slice(-8)}</div>
        <div>FECHA: ${new Date(order.date).toLocaleString()}</div>
        <div>MODO: ${order.source || 'VENTA'}</div>
        
        <div class="divider"></div>
        
        <div class="bold">CLIENTE:</div>
        <div class="uppercase">${order.customerName}</div>
        <div style="font-size: 9px;">DIR: ${order.customerAddress.substring(0, 30)}</div>
        
        <div class="divider"></div>
        
        <div class="bold">DETALLE PRODUCTOS:</div>
        <div class="mt-1">${itemsHtml}</div>
        
        <div class="divider"></div>
        
        <div class="totals-row">
          <span>SUBTOTAL:</span>
          <span>$${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>ENVIO:</span>
          <span>$${(order.deliveryFee || 0).toFixed(2)}</span>
        </div>
        ${order.discount ? `
        <div class="totals-row">
          <span>DESCUENTO:</span>
          <span>-$${order.discount.toFixed(2)}</span>
        </div>` : ''}
        
        <div class="totals-row bold total-final">
          <span>TOTAL:</span>
          <span>$${order.total.toFixed(2)}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="bold">METODO PAGO: ${order.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TRANSFERENCIA'}</div>
        ${order.paymentMethod === 'CASH' && order.cashGiven ? `
          <div class="totals-row">
            <span>RECIBIDO:</span>
            <span>$${order.cashGiven.toFixed(2)}</span>
          </div>
          <div class="totals-row bold">
            <span>CAMBIO:</span>
            <span>$${(order.cashGiven - order.total).toFixed(2)}</span>
          </div>
        ` : ''}

        ${order.userId ? `
          <div class="mt-2 text-center bold" style="font-size: 8px;">
            ¡PUNTOS VITALIS SUMADOS!
          </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="text-center footer">
          DOCUMENTO NO VALIDO COMO FACTURA.<br>
          ¡GRACIAS POR SU PREFERENCIA!<br>
          vitalis.ec
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
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    }, 500);
  }
};

/**
 * Utility to print a thermal receipt for a Treasury Shift / Blind Cash Audit (Cierre de Turno y Arqueo).
 */
export const printTreasuryShiftTicket = (
  session: TreasurySession, 
  extraDetails?: {
    cashSales?: number;
    transferSales?: number;
    totalSales?: number;
    ordersCount?: number;
    extraIngresos?: number;
    totalEgresos?: number;
    totalRetiros?: number;
    transactions?: TreasuryTransaction[];
  }
) => {
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  const initialCash = session.initialCash || 0;
  const expected = session.expectedCash !== undefined ? session.expectedCash : (extraDetails?.cashSales || 0) + initialCash;
  const counted = session.actualCash !== undefined ? session.actualCash : 0;
  const discrepancy = session.discrepancy !== undefined ? session.discrepancy : (counted - expected);

  const discText = discrepancy === 0 ? 'CUADRE EXACTO ($0.00)' : discrepancy > 0 ? `SOBRANTE: +$${discrepancy.toFixed(2)}` : `FALTANTE: -$${Math.abs(discrepancy).toFixed(2)}`;

  // Desglose de arqueo si existe
  const b = session.blindArqueo;
  const arqueoHtml = b ? `
    <div class="divider"></div>
    <div class="bold text-center">DESGLOSE DE ARQUEO</div>
    <div style="font-size: 9px; margin-top: 4px;">
      ${b.bills100 ? `<div>Billetes $100: ${b.bills100} ($${(b.bills100 * 100).toFixed(2)})</div>` : ''}
      ${b.bills50 ? `<div>Billetes $50: ${b.bills50} ($${(b.bills50 * 50).toFixed(2)})</div>` : ''}
      ${b.bills20 ? `<div>Billetes $20: ${b.bills20} ($${(b.bills20 * 20).toFixed(2)})</div>` : ''}
      ${b.bills10 ? `<div>Billetes $10: ${b.bills10} ($${(b.bills10 * 10).toFixed(2)})</div>` : ''}
      ${b.bills5 ? `<div>Billetes $5: ${b.bills5} ($${(b.bills5 * 5).toFixed(2)})</div>` : ''}
      ${b.bills1 ? `<div>Billetes $1: ${b.bills1} ($${(b.bills1 * 1).toFixed(2)})</div>` : ''}
      ${b.coins050 ? `<div>Monedas 50ct: ${b.coins050} ($${(b.coins050 * 0.50).toFixed(2)})</div>` : ''}
      ${b.coins025 ? `<div>Monedas 25ct: ${b.coins025} ($${(b.coins025 * 0.25).toFixed(2)})</div>` : ''}
      ${b.coins010 ? `<div>Monedas 10ct: ${b.coins010} ($${(b.coins010 * 0.10).toFixed(2)})</div>` : ''}
      ${b.coins005 ? `<div>Monedas 5ct: ${b.coins005} ($${(b.coins005 * 0.05).toFixed(2)})</div>` : ''}
      ${b.coins001 ? `<div>Monedas 1ct: ${b.coins001} ($${(b.coins001 * 0.01).toFixed(2)})</div>` : ''}
    </div>
  ` : '';

  const content = `
    <html>
      <head>
        <title>ARQUEO - ${session.id}</title>
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
          .totals-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10.5px; }
          .total-final { font-size: 13px; border-top: 2px solid #000; padding-top: 4px; margin-top: 5px; font-weight: 900; }
          .uppercase { text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="text-center bold header-main">FARMACIA VITALIS</div>
        <div class="text-center uppercase" style="font-size: 8px;">Tesorería & Arqueo de Caja</div>
        <div class="text-center" style="font-size: 8px;">Machalilla, Ecuador</div>
        
        <div class="divider"></div>
        
        <div><span class="bold">SESIÓN:</span> ${session.id}</div>
        <div><span class="bold">RESPONSABLE:</span> <span class="uppercase">${session.openedBy}</span></div>
        <div><span class="bold">APERTURA:</span> ${new Date(session.openedAt).toLocaleString()}</div>
        ${session.closedAt ? `<div><span class="bold">CIERRE:</span> ${new Date(session.closedAt).toLocaleString()}</div>` : `<div><span class="bold">ESTADO:</span> EN CURSO</div>`}
        
        <div class="divider"></div>
        
        <div class="totals-row">
          <span>FONDO INICIAL:</span>
          <span>$${initialCash.toFixed(2)}</span>
        </div>
        
        ${extraDetails?.cashSales !== undefined ? `
          <div class="totals-row">
            <span>VENTAS EFECTIVO:</span>
            <span>+$${(extraDetails.cashSales || 0).toFixed(2)}</span>
          </div>
        ` : ''}

        ${extraDetails?.transferSales !== undefined ? `
          <div class="totals-row">
            <span>TRANSF/TARJETA:</span>
            <span>$${(extraDetails.transferSales || 0).toFixed(2)}</span>
          </div>
        ` : ''}

        ${extraDetails?.extraIngresos ? `
          <div class="totals-row">
            <span>INGRESOS EXTRA:</span>
            <span>+$${extraDetails.extraIngresos.toFixed(2)}</span>
          </div>
        ` : ''}

        ${extraDetails?.totalEgresos ? `
          <div class="totals-row">
            <span>EGRESOS CAJA:</span>
            <span>-$${extraDetails.totalEgresos.toFixed(2)}</span>
          </div>
        ` : ''}

        ${extraDetails?.totalRetiros ? `
          <div class="totals-row">
            <span>RETIROS/REMESAS:</span>
            <span>-$${extraDetails.totalRetiros.toFixed(2)}</span>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="totals-row bold">
          <span>EFECTIVO ESPERADO:</span>
          <span>$${expected.toFixed(2)}</span>
        </div>

        <div class="totals-row bold">
          <span>EFECTIVO CONTADO:</span>
          <span>$${counted.toFixed(2)}</span>
        </div>

        <div class="totals-row bold total-final">
          <span>RESULTADO:</span>
          <span>${discText}</span>
        </div>

        ${session.notes ? `
          <div class="divider"></div>
          <div class="bold">NOTAS DE AUDITORÍA:</div>
          <div style="font-size: 9.5px; font-style: italic;">${session.notes}</div>
        ` : ''}

        ${arqueoHtml}

        <div class="divider"></div>

        <div style="margin-top: 30px; border-top: 1px solid #000; text-align: center; font-size: 9px;">
          FIRMA RESPONSABLE DE CAJA<br>
          <span class="uppercase">${session.openedBy}</span>
        </div>

        <div style="margin-top: 30px; border-top: 1px solid #000; text-align: center; font-size: 9px;">
          FIRMA AUDITOR / ADMINISTRADOR
        </div>

        <div style="height: 12mm;"></div>
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
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    }, 500);
  }
};

