import React from 'react';
import { DollarSign, Clock, Truck, TrendingUp } from 'lucide-react';
import { Order } from '../../../types';

interface OrderStatsProps {
  orders: Order[];
  onQuickFilter: (status: 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED') => void;
  activeFilter: 'ALL' | 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
}

export const OrderStats: React.FC<OrderStatsProps> = ({ orders, onQuickFilter, activeFilter }) => {
  // Calculations based on all orders in the database
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const inTransitOrders = orders.filter(o => o.status === 'IN_TRANSIT');

  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const averageTicket = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  const stats = [
    {
      label: 'Ingresos Totales',
      value: `$${totalRevenue.toFixed(2)}`,
      sub: 'De pedidos entregados',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      filterKey: 'DELIVERED' as const,
    },
    {
      label: 'Pedidos Pendientes',
      value: pendingOrders.length.toString(),
      sub: 'En espera de despacho',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      filterKey: 'PENDING' as const,
    },
    {
      label: 'En Camino',
      value: inTransitOrders.length.toString(),
      sub: 'Reparto motorizado activo',
      icon: Truck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      filterKey: 'IN_TRANSIT' as const,
    },
    {
      label: 'Ticket Promedio',
      value: `$${averageTicket.toFixed(2)}`,
      sub: 'Valor de compra promedio',
      icon: TrendingUp,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      filterKey: 'ALL' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const isClickable = ['PENDING', 'IN_TRANSIT', 'DELIVERED'].includes(stat.filterKey);
        const isHighlighted = activeFilter === stat.filterKey;

        return (
          <div
            key={idx}
            onClick={() => isClickable && onQuickFilter(stat.filterKey as any)}
            className={`bg-white p-5 rounded-3xl border transition-all duration-200 shadow-xs flex items-center justify-between gap-4 ${
              isClickable ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
            } ${isHighlighted ? 'ring-2 ring-teal-500 bg-teal-50/20' : 'border-slate-100'}`}
            id={`stat-card-${idx}`}
          >
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {stat.label}
              </span>
              <p className="text-2xl font-black text-slate-800 tracking-tight truncate">
                {stat.value}
              </p>
              <span className="text-[10px] font-medium text-slate-500 block truncate">
                {stat.sub}
              </span>
            </div>
            <div className={`p-3 rounded-2xl shrink-0 border ${stat.color}`}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
