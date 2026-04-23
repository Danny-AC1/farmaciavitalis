
import React, { useState, useMemo } from 'react';
import { ClipboardList, Search, Clock, CheckCircle, Phone, MapPin, Printer, Trash2, Calendar, Calculator, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import { Order } from '../types';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: 'DELIVERED', order: Order) => void;
  onDeleteOrder?: (id: string) => void;
  onShowCashClosure?: (cash: number, trans: number, date: string) => void;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, onUpdateStatus, onDeleteOrder, onShowCashClosure }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'ALL' || o.status === filter;
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    
    let matchesDate = true;
    if (dateFilter) {
      const d = new Date(o.date);
      const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      matchesDate = localDate === dateFilter;
    }
    
    return matchesFilter && matchesSearch && matchesDate;
  });

  // Agrupar pedidos por fecha local (respetando 00:00 local)
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    filteredOrders.forEach(order => {
      const d = new Date(order.date);
      // Usar componentes locales para asegurar que el corte es a las 00:00 local
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(order);
    });
    // Ordenar fechas descendente
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOrders]);

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const handleCashClosure = (e: React.MouseEvent, dateKey: string, dayOrders: Order[]) => {
    e.stopPropagation(); // Evitar que se cierre el acordeón al hacer clic en el botón
    const delivered = dayOrders.filter(o => o.status === 'DELIVERED');
    const cash = delivered.filter(o => o.paymentMethod === 'CASH').reduce((a, b) => a + b.total, 0);
    const trans = delivered.filter(o => o.paymentMethod === 'TRANSFER').reduce((a, b) => a + b.total, 0);
    onShowCashClosure?.(cash, trans, dateKey);
  };

  const handlePrintOrder = (order: Order) => {
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

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="text-teal-600"/> Gestión de Pedidos</h2>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:w-48">
            <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
            <input 
              className="w-full border p-2 pl-9 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500" 
              placeholder="Buscar..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-gray-400 h-4 w-4 pointer-events-none" />
            <input 
              type="date"
              className="border p-2 pl-9 rounded-lg text-sm bg-white font-bold text-gray-600 outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-auto"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <select 
            className="border p-2 rounded-lg text-sm bg-white font-bold text-gray-600 outline-none focus:ring-2 focus:ring-teal-500"
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
          >
            <option value="ALL">Estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="DELIVERED">Entregados</option>
          </select>
          {dateFilter && (
            <button 
                onClick={() => setDateFilter('')}
                className="bg-red-50 text-red-500 text-[10px] font-black uppercase px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
            >
                Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {groupedOrders.map(([dateKey, dayOrders]) => {
          const isExpanded = expandedDays[dateKey];
          const totalDay = dayOrders.reduce((sum, o) => sum + o.total, 0);
          const pendingCount = dayOrders.filter(o => o.status === 'PENDING').length;

          return (
            <div key={dateKey} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              {/* Encabezado del Día (Acordeón) */}
              <div 
                onClick={() => toggleDay(dateKey)}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isExpanded ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-teal-600" />
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                        {new Date(dateKey + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {dayOrders.length} {dayOrders.length === 1 ? 'pedido' : 'pedidos'}
                      </span>
                      {pendingCount > 0 && (
                        <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                          {pendingCount} PENDIENTES
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas del Día</p>
                    <p className="text-xl font-black text-teal-700 flex items-center justify-end gap-1">
                      <DollarSign size={16} /> {totalDay.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={(e) => handleCashClosure(e, dateKey, dayOrders)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-50 text-teal-700 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-100 transition-colors border border-teal-100"
                    >
                      <Calculator size={14} />
                      Corte
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Pedidos (Contenido Expandible) */}
              {isExpanded && (
                <div className="p-6 pt-0 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 gap-4 mt-6">
                    {dayOrders.map(order => (
                      <div key={order.id} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'DELIVERED' ? 'bg-teal-500' : 'bg-orange-500'}`}></div>

                        <div className="flex-grow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Orden #{order.id.slice(-6)}</p>
                              <h4 className="text-xl font-black text-slate-900 uppercase">{order.customerName}</h4>
                              <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1"><Clock size={12} className="text-teal-500"/> {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'DELIVERED' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
                                {order.status === 'DELIVERED' ? 'Entregado' : 'Pendiente'}
                              </span>
                              <p className="text-2xl font-black text-teal-700 mt-2">${order.total.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100"><Phone size={16} className="text-teal-500"/></div>
                              <span>{order.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100"><MapPin size={16} className="text-teal-500"/></div>
                              <span className="truncate">{order.customerAddress}</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-2xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalles del Carrito</p>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => {
                                const isBox = item.selectedUnit === 'BOX';
                                const priceToUse = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                                return (
                                  <div key={idx} className="flex justify-between text-xs font-bold text-slate-700">
                                    <span className="uppercase">{item.quantity}x {item.name} {isBox ? `(Caja x${item.unitsPerBox})` : '(Unid)'}</span>
                                    <span className="text-teal-700">${(priceToUse * item.quantity).toFixed(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="md:w-48 flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                          <button 
                            onClick={() => handlePrintOrder(order)}
                            className="w-full bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-600 transition-all shadow-lg active:scale-95"
                          >
                            <Printer size={14}/> Ticket
                          </button>
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => onUpdateStatus(order.id, 'DELIVERED', order)}
                              className="w-full bg-teal-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-700 transition shadow-lg active:scale-95"
                            >
                              <CheckCircle size={14}/> Entregar
                            </button>
                          )}
                          <button 
                            onClick={() => onDeleteOrder?.(order.id)}
                            className="w-full bg-red-50 text-red-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition border border-red-100 active:scale-95"
                          >
                            <Trash2 size={14}/> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {groupedOrders.length === 0 && (
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
