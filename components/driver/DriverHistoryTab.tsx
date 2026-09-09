import React from 'react';
import { Order } from '../../types';
import { CheckCircle2, Clock, MapPin, Package } from 'lucide-react';

interface DriverHistoryTabProps {
  deliveredOrders: Order[];
}

export const DriverHistoryTab: React.FC<DriverHistoryTabProps> = ({ deliveredOrders }) => {
  const totalMoneyCollected = deliveredOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalCash = deliveredOrders
    .filter(o => o.paymentMethod === 'CASH')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalTransfer = deliveredOrders
    .filter(o => o.paymentMethod !== 'CASH')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Resumen de Recaudación */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Recaudación Total Hoy ({deliveredOrders.length} pedidos)
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Total</span>
            <span className="text-base font-black text-slate-900 tabular-nums">${totalMoneyCollected.toFixed(2)}</span>
          </div>
          <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider block mb-0.5">Efectivo</span>
            <span className="text-base font-black text-orange-700 tabular-nums">${totalCash.toFixed(2)}</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider block mb-0.5">Transfer</span>
            <span className="text-base font-black text-blue-700 tabular-nums">${totalTransfer.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos Entregados */}
      {deliveredOrders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="bg-white h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Package className="h-10 w-10 text-slate-200" />
          </div>
          <p className="font-black uppercase tracking-widest text-xs">Sin entregas completadas hoy</p>
          <p className="text-[10px] uppercase font-bold mt-1 text-slate-400">
            Los pedidos que entregues hoy aparecerán en este registro.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[1.8rem] shadow-sm overflow-hidden border border-slate-100 p-5 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black">
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 uppercase leading-none">
                      {order.customerName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">#{order.id.slice(-6)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-teal-700 tabular-nums">${order.total.toFixed(2)}</span>
                  <span className="block text-[9px] font-black text-slate-400 uppercase">
                    {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '🏦 Transfer'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 font-medium flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="uppercase text-[11px] leading-tight">{order.customerAddress}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase pt-1 border-t border-slate-50">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-emerald-600 font-black">Entregado con éxito</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
