
import React from 'react';
import { Product } from '../types';
import { Printer } from 'lucide-react';

interface AdminProductPriceListProps {
  products: Product[];
}

const AdminProductPriceList: React.FC<AdminProductPriceListProps> = ({ products }) => {
  const handlePrintPriceList = () => {
    if (products.length === 0) {
      return alert("No hay productos en el catálogo para imprimir.");
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

    const itemsHtml = sortedProducts.map(p => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 11px; text-transform: uppercase;">${p.name}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 11px;">$${p.price.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Lista de Precios - Vitalis</title>
          <style>
            @page { margin: 10mm; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 0; color: #333; line-height: 1.2; }
            .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 15px; }
            h2 { color: #0d9488; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
            .info { font-size: 10px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #f8fafc; padding: 8px; border-bottom: 1px solid #0d9488; font-size: 10px; text-transform: uppercase; color: #0d9488; }
            .footer { margin-top: 20px; font-size: 9px; text-align: center; color: #999; border-top: 1px dashed #eee; padding-top: 10px; }
            .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body onload="window.print();">
          <div class="header">
            <h2>Lista de Precios Vitalis</h2>
            <div class="info">Machalilla, Ecuador • Generado: ${new Date().toLocaleString()}</div>
          </div>
          
          <div class="grid-container">
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: right;">P. Venta</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml.split('</tr>').slice(0, Math.ceil(sortedProducts.length / 2)).join('</tr>')}
                </tbody>
              </table>
            </div>
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: right;">P. Venta</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml.split('</tr>').slice(Math.ceil(sortedProducts.length / 2)).join('</tr>')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">
            Precios sujetos a cambios sin previo aviso. Documento de uso informativo.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button 
      onClick={handlePrintPriceList}
      className="flex-1 sm:flex-none bg-slate-800 text-white p-4 md:px-6 md:py-5 rounded-2xl font-black flex flex-col items-center justify-center min-w-[110px] shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
    >
      <Printer size={24} className="mb-1.5" />
      <span className="text-[10px] leading-tight uppercase tracking-widest text-center">Imprimir<br/>Precios</span>
    </button>
  );
};

export default AdminProductPriceList;
