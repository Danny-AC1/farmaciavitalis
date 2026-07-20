import React from 'react';
import { 
  Clock, Phone, MapPin, Printer, CheckCircle, Trash2, Eye, Truck, ShoppingCart 
} from 'lucide-react';
import { Order } from '../../../types';

interface OrderCardProps {
  order: Order;
  onSelect: (order: Order) => void;
  onUpdateStatus: (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order: Order) => void;
  onDelete: (id: string) => void;
  onPrint: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onSelect,
  onUpdateStatus,
  onDelete,
  onPrint
}) => {
  const isPending = order.status === 'PENDING';
  const isInTransit = order.status === 'IN_TRANSIT';
  const isDelivered = order.status === 'DELIVERED';

  const statusConfig = {
    PENDING: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      dot: 'bg-amber-500',
      label: 'Pendiente'
    },
    IN_TRANSIT: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      dot: 'bg-indigo-500',
      label: 'En Camino'
    },
    DELIVERED: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Entregado'
    }
  };

  const currentStatus = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <div 
      className="bg-white rounded-3xl p-5 border border-slate-100 hover:shadow-lg transition-all flex flex-col lg:flex-row gap-5 relative overflow-hidden group"
      id={`order-card-${order.id}`}
    >
      {/* Visual Status Strip Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        isDelivered ? 'bg-emerald-500' : isInTransit ? 'bg-indigo-500' : 'bg-amber-500'
      }`}></div>

      {/* Main Details */}
      <div className="flex-grow space-y-4">
        {/* Header Area */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">
                Orden #{order.id.slice(-6)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${currentStatus.bg}`}>
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${currentStatus.dot}`} />
                {currentStatus.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                order.paymentMethod === 'TRANSFER' 
                  ? 'bg-blue-50 border-blue-100 text-blue-700' 
                  : 'bg-teal-50 border-teal-100 text-teal-700'
              }`}>
                {order.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Efectivo'}
              </span>
              {order.source && (
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
                  {order.source === 'POS' ? 'POS' : 'Web'}
                </span>
              )}
            </div>
            <h4 className="text-lg font-black text-slate-900 uppercase mt-1">
              {order.customerName}
            </h4>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Monto Cobrado
            </span>
            <p className="text-2xl font-black text-teal-700">
              ${order.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Contact/Address Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-400">
              <Phone size={14} />
            </div>
            <span className="font-bold text-slate-700">{order.customerPhone}</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium min-w-0">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-400 shrink-0">
              <MapPin size={14} />
            </div>
            <span className="truncate font-bold text-slate-700" title={order.customerAddress}>
              {order.customerAddress}
            </span>
          </div>
        </div>

        {/* Cart items count and metadata */}
        <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">
          <div className="flex items-center gap-1">
            <ShoppingCart size={12} className="text-slate-300" />
            <span>
              {order.items.reduce((sum, i) => sum + i.quantity, 0)} Medicamentos en Carrito
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-500 font-mono">
            <Clock size={12} />
            <span>
              {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Side Action Column */}
      <div className="lg:w-44 flex lg:flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-5 shrink-0">
        <button
          onClick={() => onSelect(order)}
          className="flex-1 lg:flex-none bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border border-slate-200/60 shadow-xs active:scale-95"
          id={`order-view-btn-${order.id}`}
        >
          <Eye size={13} /> Ver Detalle
        </button>

        <button
          onClick={() => onPrint(order)}
          className="flex-1 lg:flex-none bg-slate-900 hover:bg-slate-850 text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          id={`order-print-btn-${order.id}`}
        >
          <Printer size={13} /> Ticket
        </button>

        {isPending && (
          <button
            onClick={() => onUpdateStatus(order.id, 'IN_TRANSIT', order)}
            className="flex-1 lg:flex-none bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 animate-pulse"
            id={`order-dispatch-btn-${order.id}`}
          >
            <Truck size={13} /> Despachar
          </button>
        )}

        {isInTransit && (
          <button
            onClick={() => onUpdateStatus(order.id, 'DELIVERED', order)}
            className="flex-1 lg:flex-none bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            id={`order-deliver-btn-${order.id}`}
          >
            <CheckCircle size={13} /> Entregar
          </button>
        )}

        <button
          onClick={() => onDelete(order.id)}
          className="px-3.5 bg-red-50 text-red-500 hover:bg-red-650 hover:text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border border-red-150 active:scale-95"
          id={`order-delete-btn-${order.id}`}
          title="Eliminar Orden"
        >
          <Trash2 size={13} /> <span className="lg:hidden">Eliminar</span>
        </button>
      </div>
    </div>
  );
};
