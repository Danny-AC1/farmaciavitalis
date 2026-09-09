import React from 'react';
import { Order } from '../../types';
import { Phone, Clock, MapPin, Loader2, CheckCircle, Map as MapIcon } from 'lucide-react';

interface DriverActiveOrderCardProps {
  order: Order;
  onCallCustomer: (phone: string) => void;
  onOpenMap: (order: Order) => void;
  onStatusChange: (order: Order, status: 'IN_TRANSIT' | 'DELIVERED') => void;
}

export const DriverActiveOrderCard: React.FC<DriverActiveOrderCardProps> = ({
  order,
  onCallCustomer,
  onOpenMap,
  onStatusChange
}) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 mb-6 animate-in slide-in-from-bottom-4 group">
      <div className={`p-4 text-white font-black flex justify-between items-center ${order.status === 'IN_TRANSIT' ? 'bg-blue-600' : 'bg-slate-900'}`}>
        <span className="text-[10px] uppercase tracking-[0.15em] flex items-center gap-2">
          {order.status === 'IN_TRANSIT' ? <><Loader2 className="animate-spin" size={14}/> EN RUTA 🛵</> : 'ESPERANDO ⏳'}
        </span>
        <span className="text-[10px] opacity-60 font-mono">#{order.id.slice(-6)}</span>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none mb-2">{order.customerName}</h3>
          <div className="flex gap-4">
            <button 
              onClick={() => onCallCustomer(order.customerPhone)} 
              className="flex items-center gap-2 text-[10px] bg-slate-100 px-3 py-1.5 rounded-full text-slate-700 font-black hover:bg-teal-50 hover:text-teal-600 transition-colors uppercase tracking-widest"
            >
              <Phone size={12} /> {order.customerPhone}
            </button>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <Clock size={12} /> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors relative" onClick={() => onOpenMap(order)}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dirección de Entrega</p>
            {order.lat && order.lng && (
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">📍 GPS Exacto</span>
            )}
          </div>
          <p className="flex items-start gap-3 text-slate-800 font-bold text-sm leading-snug uppercase">
            <MapPin className="shrink-0 mt-0.5 text-red-500" size={18} />
            {order.customerAddress}
          </p>
          <div className="absolute bottom-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
            <MapIcon size={20} className="text-blue-600"/>
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-slate-100 pt-5">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto a Cobrar</p>
            <p className="text-3xl font-black text-teal-700 tabular-nums">${order.total.toFixed(2)}</p>
            <span className={`inline-block mt-2 text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${order.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
              {order.paymentMethod === 'CASH' ? '💵 EFECTIVO' : '🏦 TRANSFERENCIA'}
            </span>
          </div>
          {order.paymentMethod === 'CASH' && order.cashGiven && (
            <div className="text-right bg-red-50 p-3 rounded-2xl border border-red-100">
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Dar Vuelto</p>
              <p className="text-xl font-black text-red-600 tabular-nums">${(order.cashGiven - order.total).toFixed(2)}</p>
            </div>
          )}
        </div>

        {order.status === 'PENDING' ? (
          <button 
            onClick={() => onStatusChange(order, 'IN_TRANSIT')} 
            className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black shadow-xl hover:bg-black active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"
          >
            Empezar Entrega 🛵
          </button>
        ) : (
          <button 
            onClick={() => onStatusChange(order, 'DELIVERED')} 
            className="w-full bg-emerald-600 text-white py-4.5 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-xs"
          >
            <CheckCircle size={20}/> Confirmar Entrega ✅
          </button>
        )}
      </div>
    </div>
  );
};
