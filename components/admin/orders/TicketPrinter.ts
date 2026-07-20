import { Order } from '../../../types';

export const printOrderTicket = (order: Order) => {
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
            font-size: 12px;
            color: #000;
            line-height: 1.1;
            font-weight: 700;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: 900; }
          .divider { border-top: 2px dashed #000; margin: 6px 0; }
          .header-main { font-size: 18px; margin-bottom: 2px; font-weight: 900; }
          .item-row { margin-bottom: 8px; }
          .item-details { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; }
          .totals-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: 700; }
          .total-final { font-size: 16px; border-top: 3px solid #000; padding-top: 4px; margin-top: 5px; font-weight: 900; }
          .mt-1 { margin-top: 6px; }
          .mt-2 { margin-top: 12px; }
          .footer { margin-top: 20px; font-size: 10px; font-style: italic; font-weight: 700; }
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
        document.body.removeChild(printFrame);
      }, 1000);
    }, 500);
  }
};
