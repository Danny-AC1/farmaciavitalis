
import React, { useState } from 'react';
import { ClipboardList, Search, Clock, CheckCircle, Phone, MapPin, Printer, Trash2 } from 'lucide-react';
import { Order } from '../types';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: 'DELIVERED', order: Order) => void;
  onDeleteOrder?: (id: string) => void;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, onUpdateStatus, onDeleteOrder }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');
  const [search, setSearch] = useState('');

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'ALL' || o.status === filter;
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    return matchesFilter && matchesSearch;
  });

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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

    printWindow.document.write(`
      <html>
        <head>
          <title>VITALIS TICKET - ${order.id.slice(-6)}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 58mm; 
              padding: 2mm; 
              margin: 0; 
              font-size: 10px;
              color: #000;
              line-height: 1.2;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .header-main { font-size: 14px; margin-bottom: 2px; }
            .item-row { margin-bottom: 5px; }
            .item-details { display: flex; justify-content: space-between; font-size: 9px; }
            .totals-row { display: flex; justify-content: space-between; margin: 1px 0; }
            .total-final { font-size: 13px; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .footer { margin-top: 15px; font-size: 8px; font-style: italic; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="text-center bold header-main">FARMACIA VITALIS</div>
          <div class="text-center uppercase">Tu Salud Al Día</div>
          <div class="text-center">Machalilla, Ecuador</div>
          <div class="text-center">TEL: 0998506160</div>
          
          <div class="divider"></div>
          
          <div class="bold">ORDEN: #${order.id.slice(-8)}</div>
          <div>FECHA: ${new Date(order.date).toLocaleString()}</div>
          <div>MODO: ${order.source || 'VENTA'}</div>
          
          <div class="divider"></div>
          
          <div class="bold">CLIENTE:</div>
          <div class="uppercase">${order.customerName}</div>
          <div>DIR: ${order.customerAddress.substring(0, 30)}</div>
          
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
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="text-teal-600"/> Gestión de Pedidos</h2>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
            <input 
              className="w-full border p-2 pl-9 rounded-lg text-sm bg-white" 
              placeholder="Buscar por cliente o ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="border p-2 rounded-lg text-sm bg-white font-bold text-gray-600"
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="DELIVERED">Entregados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-orange-500'}`}></div>

            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orden #{order.id.slice(-6)}</p>
                  <h4 className="text-xl font-bold text-gray-900">{order.customerName}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Clock size={12}/> {new Date(order.date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status === 'DELIVERED' ? 'Entregado' : 'Pendiente'}
                  </span>
                  <p className="text-2xl font-black text-teal-700 mt-2">${order.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="bg-gray-100 p-2 rounded-lg"><Phone size={16}/></div>
                  <span>{order.customerPhone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="bg-gray-100 p-2 rounded-lg"><MapPin size={16}/></div>
                  <span className="truncate">{order.customerAddress}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Detalles del Carrito</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => {
                    const isBox = item.selectedUnit === 'BOX';
                    const priceToUse = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                    return (
                      <div key={idx} className="flex justify-between text-xs font-medium text-gray-700">
                        <span>{item.quantity}x {item.name} {isBox ? `(Caja x${item.unitsPerBox})` : '(Unid)'}</span>
                        <span>$${(priceToUse * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="md:w-48 flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
              <button 
                onClick={() => handlePrintOrder(order)}
                className="w-full bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors shadow-sm"
              >
                <Printer size={14}/> Imprimir Ticket
              </button>
              {order.status === 'PENDING' && (
                <button 
                  onClick={() => onUpdateStatus(order.id, 'DELIVERED', order)}
                  className="w-full bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-sm"
                >
                  <CheckCircle size={14}/> Marcar Entregado
                </button>
              )}
              <button 
                onClick={() => onDeleteOrder?.(order.id)}
                className="w-full bg-red-50 text-red-500 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition border border-red-100"
              >
                <Trash2 size={14}/> Eliminar Registro
              </button>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <ClipboardList size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold">No hay pedidos que coincidan con los filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
