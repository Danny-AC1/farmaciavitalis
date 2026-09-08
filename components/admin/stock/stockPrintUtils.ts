import { Product } from '../../../types';
import { StockAlertConfig, filterProductsInAlert } from '../../../services/stockAlertService';

export const sendStockAlertWhatsApp = (products: Product[], alertConfig: StockAlertConfig) => {
  const lowStockList = filterProductsInAlert(products, alertConfig).all;
  if (lowStockList.length === 0) {
    return alert("¡Excelente! No hay medicamentos en alerta según la configuración actual.");
  }

  const itemsList = lowStockList.map(p => {
    const hasBox = Boolean(p.unitsPerBox && p.unitsPerBox > 1);
    return hasBox 
      ? `• ${p.name}: Quedan ${p.stock} uds (Caja x ${p.unitsPerBox})`
      : `• ${p.name}: Quedan ${p.stock} unidades`;
  }).join('\n');
  const message = `*ALERTA DE REABASTECIMIENTO - FARMACIA VITALIS* ⚠️\n\nPor favor gestionar el ingreso de los siguientes medicamentos:\n\n${itemsList}`;
  
  const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(waLink, '_blank');
};

export const generateShoppingListPrint = (products: Product[], alertConfig: StockAlertConfig) => {
  const lowStockList = filterProductsInAlert(products, alertConfig).all;
  if (lowStockList.length === 0) {
    return alert(`No hay productos en alerta (≤ ${alertConfig.boxThreshold} uds en caja / ≤ ${alertConfig.unitThreshold} uds indiv.) para generar lista.`);
  }

  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  const itemsHtml = lowStockList.map(p => {
    const hasBox = Boolean(p.unitsPerBox && p.unitsPerBox > 1);
    const detailLabel = hasBox ? `Cj x ${p.unitsPerBox}` : 'Indiv.';
    return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 13px; color: #1e293b;">
        ${p.name} <span style="font-size: 10px; color: #64748b;">(${detailLabel})</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">${p.category}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #ef4444;">${p.stock} uds</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #94a3b8;">[ &nbsp; &nbsp; &nbsp; &nbsp; ] u.</td>
    </tr>
  `;
  }).join('');

  const content = `
    <html>
      <head>
        <title>Lista de Pedidos - Vitalis</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
          h1 { color: #0f766e; font-size: 20px; margin: 0; text-transform: uppercase; }
          .date { font-size: 11px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { text-align: left; background: #f8fafc; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lista Oficial de Pedidos y Reposición</h1>
          <div class="date">Farmacia Vitalis • Fecha: ${new Date().toLocaleDateString()}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Medicamento / Insumo</th>
              <th>Categoría</th>
              <th style="text-align: center;">Stock Actual</th>
              <th style="text-align: right;">Cantidad Requerida</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
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

export const printBarcodeLabel = (product: Product) => {
  const printFrame = document.createElement('iframe');
  printFrame.style.display = 'none';
  document.body.appendChild(printFrame);

  let barsHtml = '';
  for (let i = 0; i < 40; i++) {
    const width = [1, 2, 3][Math.floor(Math.random() * 3)];
    const spacing = [1, 2][Math.floor(Math.random() * 2)];
    barsHtml += `<div style="width: ${width}px; background: black; height: 35px; margin-right: ${spacing}px; display: inline-block;"></div>`;
  }

  const content = `
    <html>
      <head>
        <title>Etiqueta - ${product.name}</title>
        <style>
          @page { size: 80mm 40mm; margin: 0; }
          body {
            font-family: monospace;
            padding: 10px;
            width: 76mm;
            height: 36mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: white;
          }
          .header { font-size: 8px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 2px; }
          .title { font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
          .price { font-size: 13px; font-weight: bold; }
          .barcode-container { text-align: center; margin-top: 4px; }
          .barcode-visual { display: flex; justify-content: center; align-items: flex-end; height: 35px; }
          .barcode-text { font-size: 9px; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div>
          <div class="header">FARMACIA VITALIS</div>
          <div class="title">${product.name}</div>
          <div class="price">$${product.price.toFixed(2)} - ${product.category}</div>
        </div>
        <div class="barcode-container">
          <div class="barcode-visual">${barsHtml}</div>
          <div class="barcode-text">*${product.barcode || 'V' + product.id.substring(0,8).toUpperCase()}*</div>
        </div>
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
