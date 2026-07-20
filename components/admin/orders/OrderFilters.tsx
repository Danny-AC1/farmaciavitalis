import React from 'react';
import { Search, Calendar, RefreshCw, CreditCard, ShoppingBag, X } from 'lucide-react';

export interface FilterState {
  search: string;
  date: string;
  status: 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  paymentMethod: 'ALL' | 'CASH' | 'TRANSFER';
  source: 'ALL' | 'ONLINE' | 'POS';
}

interface OrderFiltersProps {
  filters: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onChange, onReset }) => {
  const statusTabs: { value: FilterState['status']; label: string; countColor: string }[] = [
    { value: 'ALL', label: 'Todos', countColor: 'bg-slate-100 text-slate-700' },
    { value: 'PENDING', label: 'Pendientes', countColor: 'bg-amber-100 text-amber-700' },
    { value: 'IN_TRANSIT', label: 'En Camino', countColor: 'bg-indigo-100 text-indigo-700' },
    { value: 'DELIVERED', label: 'Entregados', countColor: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4" id="order-filters-container">
      {/* Search & Date Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200/80 p-3 pl-10 pr-10 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            placeholder="Buscar por cliente, id de pedido o teléfono..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            id="order-search-input"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="relative w-full sm:w-48">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200/80 p-3 pl-10 rounded-2xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              value={filters.date}
              onChange={(e) => onChange({ date: e.target.value })}
              id="order-date-input"
            />
          </div>

          <button
            onClick={onReset}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 rounded-2xl transition-colors shrink-0"
            title="Restaurar Filtros"
            id="order-filters-reset-btn"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Grid for Quick Dropdowns and Tab Filters */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center pt-2 border-t border-slate-50">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap bg-slate-50 p-1 rounded-2xl border border-slate-150 gap-1 self-start xl:self-auto">
          {statusTabs.map((tab) => {
            const isActive = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => onChange({ status: tab.value })}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
                id={`status-tab-${tab.value}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Select Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {/* Method filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-1.5 min-w-[140px]">
            <CreditCard size={12} className="text-slate-400 shrink-0" />
            <select
              className="w-full bg-transparent border-none text-[11px] font-black uppercase text-slate-600 outline-none cursor-pointer p-1"
              value={filters.paymentMethod}
              onChange={(e) => onChange({ paymentMethod: e.target.value as any })}
              id="order-filter-payment-select"
            >
              <option value="ALL">Todo Pago</option>
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          {/* Source filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-1.5 min-w-[140px]">
            <ShoppingBag size={12} className="text-slate-400 shrink-0" />
            <select
              className="w-full bg-transparent border-none text-[11px] font-black uppercase text-slate-600 outline-none cursor-pointer p-1"
              value={filters.source}
              onChange={(e) => onChange({ source: e.target.value as any })}
              id="order-filter-source-select"
            >
              <option value="ALL">Todo Canal</option>
              <option value="ONLINE">Vía Web/App</option>
              <option value="POS">Venta POS</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
};
