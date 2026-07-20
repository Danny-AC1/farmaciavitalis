import React, { useState, useMemo } from 'react';
import { ClipboardList, Calendar, ChevronDown, ChevronRight, Calculator, DollarSign } from 'lucide-react';
import { Order, Product } from '../../types';

// Modular Sub-Components
import { OrderStats } from './orders/OrderStats';
import { OrderFilters, FilterState } from './orders/OrderFilters';
import { OrderCard } from './orders/OrderCard';
import { OrderDetailModal } from './orders/OrderDetailModal';
import { printOrderTicket } from './orders/TicketPrinter';

interface AdminOrdersProps {
  orders: Order[];
  products: Product[];
  onUpdateStatus: (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order: Order) => void;
  onDeleteOrder?: (id: string) => void;
  onShowCashClosure?: (cash: number, trans: number, date: string) => void;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  products,
  onUpdateStatus,
  onDeleteOrder,
  onShowCashClosure
}) => {
  // 1. Filter States
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    date: '',
    status: 'ALL',
    paymentMethod: 'ALL',
    source: 'ALL'
  });

  // 2. UI & Expanded Accordion States
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 3. Reset Filters Handler
  const handleResetFilters = () => {
    setFilters({
      search: '',
      date: '',
      status: 'ALL',
      paymentMethod: 'ALL',
      source: 'ALL'
    });
  };

  // 4. Multi-Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status Filter
      const matchesStatus = filters.status === 'ALL' || order.status === filters.status;

      // Search Filter (matches name, partial ID, phone or address)
      const query = filters.search.toLowerCase();
      const matchesSearch = 
        !query ||
        order.customerName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.customerPhone.includes(query) ||
        order.customerAddress.toLowerCase().includes(query);

      // Date Filter (compares year-month-day local format)
      let matchesDate = true;
      if (filters.date) {
        const d = new Date(order.date);
        const localDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        matchesDate = localDateString === filters.date;
      }

      // Payment Method Filter
      const matchesPayment = filters.paymentMethod === 'ALL' || order.paymentMethod === filters.paymentMethod;

      // Source Filter (POS / Online)
      const matchesSource = filters.source === 'ALL' || order.source === filters.source;

      return matchesStatus && matchesSearch && matchesDate && matchesPayment && matchesSource;
    });
  }, [orders, filters]);

  // 5. Date-Based Grouping (guarantees local midnight cut)
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    filteredOrders.forEach(order => {
      const d = new Date(order.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(order);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOrders]);

  // 6. Accordion Toggle Handler
  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  // 7. Cash Closure Launcher
  const handleCashClosure = (e: React.MouseEvent, dateKey: string, dayOrders: Order[]) => {
    e.stopPropagation();
    const delivered = dayOrders.filter(o => o.status === 'DELIVERED');
    const cash = delivered.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
    const trans = delivered.filter(o => o.paymentMethod === 'TRANSFER').reduce((sum, o) => sum + o.total, 0);
    onShowCashClosure?.(cash, trans, dateKey);
  };

  // 8. Delete Order Handler
  const handleDeleteOrder = (id: string) => {
    if (onDeleteOrder && confirm('¿Está seguro de que desea eliminar permanentemente este pedido?')) {
      onDeleteOrder(id);
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="bg-teal-50 p-3 rounded-2xl border border-teal-100 text-teal-600">
          <ClipboardList size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Gestión de Pedidos
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Supervisa, despacha y realiza el cierre de caja de todos los pedidos de la sucursal.
          </p>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <OrderStats
        orders={orders}
        activeFilter={filters.status}
        onQuickFilter={(status) => setFilters(prev => ({ ...prev, status }))}
      />

      {/* Filters Search Box */}
      <OrderFilters
        filters={filters}
        onChange={(updates) => setFilters(prev => ({ ...prev, ...updates }))}
        onReset={handleResetFilters}
      />

      {/* Grouped Day Accordions */}
      <div className="space-y-4">
        {groupedOrders.map(([dateKey, dayOrders]) => {
          const isExpanded = !!expandedDays[dateKey];
          const totalDay = dayOrders.reduce((sum, o) => sum + o.total, 0);
          const pendingCount = dayOrders.filter(o => o.status === 'PENDING').length;
          const inTransitCount = dayOrders.filter(o => o.status === 'IN_TRANSIT').length;

          return (
            <div key={dateKey} className="bg-white rounded-[2rem] border border-slate-100 shadow-xs overflow-hidden">
              {/* Accordion Trigger Header */}
              <div 
                onClick={() => toggleDay(dateKey)}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors gap-4"
                id={`accordion-header-${dateKey}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    isExpanded ? 'bg-teal-600 text-white' : 'bg-slate-50 border border-slate-150 text-slate-400'
                  }`}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-teal-600" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {new Date(dateKey + 'T12:00:00').toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {dayOrders.length} {dayOrders.length === 1 ? 'pedido' : 'pedidos'}
                      </span>
                      {pendingCount > 0 && (
                        <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
                          {pendingCount} PENDIENTES
                        </span>
                      )}
                      {inTransitCount > 0 && (
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">
                          {inTransitCount} EN CAMINO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ventas del Día</p>
                    <p className="text-lg font-black text-teal-700 flex items-center justify-end gap-0.5">
                      <DollarSign size={14} /> {totalDay.toFixed(2)}
                    </p>
                  </div>

                  <button 
                    onClick={(e) => handleCashClosure(e, dateKey, dayOrders)}
                    className="flex items-center justify-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-150 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-xs"
                    id={`corte-button-${dateKey}`}
                  >
                    <Calculator size={13} />
                    Corte
                  </button>
                </div>
              </div>

              {/* Accordion Content (List of Day's Orders) */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-50 animate-in slide-in-from-top-1 duration-250">
                  <div className="grid grid-cols-1 gap-4 mt-5">
                    {dayOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onSelect={(ord) => setSelectedOrder(ord)}
                        onUpdateStatus={(id, status, ord) => onUpdateStatus(id, status, ord)}
                        onPrint={(ord) => printOrderTicket(ord)}
                        onDelete={handleDeleteOrder}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {groupedOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 p-6">
            <ClipboardList size={40} className="mx-auto text-slate-300 mb-3 animate-bounce duration-1000" />
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">No se encontraron pedidos</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Prueba cambiando tus filtros de búsqueda o el rango de fecha.</p>
          </div>
        )}
      </div>

      {/* Advanced Order Inspection Drawer/Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          products={products}
          onClose={() => setSelectedOrder(null)}
          onPrint={(ord) => printOrderTicket(ord)}
          onUpdateStatus={(id, status) => {
            onUpdateStatus(id, status, selectedOrder);
            // Sync current modal state
            setSelectedOrder({ ...selectedOrder, status });
          }}
        />
      )}
    </div>
  );
};

export default AdminOrders;
