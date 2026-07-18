import React, { useState, useEffect } from 'react';
import { Order } from '../../../types';
import { getOrdersByUserDB } from '../../../services/db.orders';
import { Calendar, ShoppingBag, Award } from 'lucide-react';

interface CustomerSidebarProps {
  userId: string;
  userDisplayName: string;
  userEmail: string;
}

export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
  userId,
  userDisplayName,
  userEmail,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Retrieve user orders live
  useEffect(() => {
    if (!userId) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    const unsubscribe = getOrdersByUserDB(userId, (data) => {
      setOrders(data);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="w-full lg:w-72 xl:w-80 border-l border-slate-200 bg-slate-50/30 flex flex-col h-full font-sans overflow-y-auto custom-scrollbar overscroll-contain p-5 space-y-6">
      
      {/* User Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full inline-block">
          Ficha del Cliente
        </span>
        
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm shrink-0 border border-teal-100/50">
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">
              {userDisplayName}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold truncate leading-normal">
              {userEmail}
            </p>
          </div>
        </div>

        {/* Dynamic loyalty rewards status if possible */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
            <Award size={13} className="text-amber-500 animate-pulse" />
            <span>Fidelidad Vitalis</span>
          </div>
          <span className="text-[11px] font-mono font-black text-slate-800">
            {orders.length > 0 ? `${Math.floor(orders.reduce((sum, o) => sum + o.subtotal, 0))} pts` : '0 pts'}
          </span>
        </div>
      </div>

      {/* Live Order History */}
      <div className="space-y-3">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <ShoppingBag size={13} />
          <span>Historial de Pedidos ({orders.length})</span>
        </h5>

        {loadingOrders ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-white/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
            Sin compras registradas
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
            {orders.map((order) => {
              const dateObj = new Date(order.date);
              const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
              
              const statusColors = {
                PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
                IN_TRANSIT: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-100'
              };

              const statusTexts = {
                PENDING: 'Pendiente',
                IN_TRANSIT: 'En Camino',
                DELIVERED: 'Entregado'
              };

              return (
                <div 
                  key={order.id} 
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-teal-500/30 transition-colors shadow-xs space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-mono font-black text-slate-600">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}>
                      {statusTexts[order.status]}
                    </span>
                  </div>

                  {/* Order items list */}
                  <div className="space-y-1 divide-y divide-slate-50">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] text-slate-500 pt-1 first:pt-0">
                        <span className="truncate max-w-[130px] font-medium text-slate-600">{item.name}</span>
                        <span className="font-bold text-slate-400 shrink-0">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Calendar size={11} /> {formattedDate}
                    </span>
                    <span className="font-extrabold text-slate-800">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerSidebar;
