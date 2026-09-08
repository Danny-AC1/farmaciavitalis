import { Product } from '../../../types';

export const handlePrintCostList = (filteredProducts: Product[]) => {
  if (filteredProducts.length === 0) {
    alert("No hay productos filtrados para imprimir.");
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Precios de Compra y Distribuidoras - Vitalis</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 20px; }
          h1 { color: #0f766e; margin-bottom: 4px; font-size: 18px; text-transform: uppercase; }
          p { margin-top: 0; color: #64748b; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
          td { padding: 6px 8px; border: 1px solid #e2e8f0; }
          .num { text-align: right; font-weight: bold; }
          .text-center { text-align: center; }
          .badge-out { color: #c2410c; font-weight: bold; }
          .badge-ok { color: #15803d; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Vitalis - Precios de Compra y Distribuidora</h1>
        <p>Generado el ${new Date().toLocaleString()} | Total ítems: ${filteredProducts.length}</p>
        <table>
          <thead>
            <tr>
              <th>Producto / Medicamento</th>
              <th>Categoría</th>
              <th class="num">P. Compra Unit.</th>
              <th class="num">Costo Caja</th>
              <th class="num">Rango Mínimo Sug.</th>
              <th class="num">Rango Máximo Sug.</th>
              <th class="num">PVP Recom. Unit. (Pastilla/Sobre)</th>
              <th class="num">PVP Actual Unit.</th>
              <th class="num">Margen Real</th>
            </tr>
          </thead>
          <tbody>
            ${filteredProducts.map(p => {
              const cost = p.costPrice !== undefined ? `$${p.costPrice.toFixed(2)}` : 'N/A';
              const box = p.supplierBoxPrice !== undefined ? `$${p.supplierBoxPrice.toFixed(2)}` : (p.boxPrice !== undefined ? `$${p.boxPrice.toFixed(2)}` : 'N/A');
              const min = p.supplierPriceRangeMin !== undefined ? `$${p.supplierPriceRangeMin.toFixed(2)}` : '-';
              const max = p.supplierPriceRangeMax !== undefined ? `$${p.supplierPriceRangeMax.toFixed(2)}` : '-';
              const rec = p.suggestedRetailPrice !== undefined ? `$${p.suggestedRetailPrice.toFixed(2)}` : '-';
              const pvp = `$${p.price.toFixed(2)}`;
              const margin = p.costPrice ? `${(((p.price - p.costPrice) / p.price) * 100).toFixed(1)}%` : 'N/A';

              return `
                <tr>
                  <td><strong>${p.name}</strong> ${p.activeIngredient ? `<br/><small>(${p.activeIngredient})</small>` : ''}</td>
                  <td>${p.category}</td>
                  <td class="num">${cost}</td>
                  <td class="num">${box}</td>
                  <td class="num">${min}</td>
                  <td class="num">${max}</td>
                  <td class="num">${rec}</td>
                  <td class="num">${pvp}</td>
                  <td class="num">${margin}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 300);
};
