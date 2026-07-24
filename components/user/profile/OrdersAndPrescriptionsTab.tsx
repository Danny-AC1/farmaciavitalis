import React, { useState, useEffect } from 'react';
import { User, Order, Prescription } from '../../../types';
import { getOrdersByUserDB, streamUserPrescriptions } from '../../../services/db';
import { Package, FileText, Clock, CheckCircle2, Truck, ShoppingBag } from 'lucide-react';

interface OrdersAndPrescriptionsTabProps {
  user: User;
}

export const OrdersAndPrescriptionsTab: React.FC<OrdersAndPrescriptionsTabProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'prescriptions'>('orders');

  useEffect(() => {
    if (!user.uid) return;
    const unsubOrders = getOrdersByUserDB(user.uid, (data) => setOrders(data));
    const unsubPresc = streamUserPrescriptions(user.uid, (data) => setPrescriptions(data));
    return () => {
      unsubOrders();
      unsubPresc();
    };
  }, [user.uid]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 size={12} /> Entregado
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
            <Truck size={12} /> En Camino
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock size={12} /> Recibido
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Subtabs Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'orders' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package size={16} /> Mis Pedidos ({orders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('prescriptions')}
          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'prescriptions' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} /> Mis Recetas ({prescriptions.length})
        </button>
      </div>

      {activeSubTab === 'orders' ? (
        orders.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
            <ShoppingBag className="mx-auto h-16 w-16 text-slate-200 mb-4" />
            <h4 className="font-black text-slate-700 text-lg uppercase tracking-tight mb-1">Sin compras anteriores</h4>
            <p className="text-xs text-slate-400">Cuando realices pedidos online, aquí podrás seguir su estado de entrega en vivo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderDate = new Date(order.date);

              return (
                <div key={order.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Pedido #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {orderDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} • {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <span className="font-black text-base text-slate-900">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-slate-700 font-bold">
                        <span className="truncate max-w-[240px]">
                          {item.quantity}x {item.name} {item.selectedUnit === 'BOX' ? '(Caja)' : ''}
                        </span>
                        <span className="text-slate-500">${((item.selectedUnit === 'BOX' && item.publicBoxPrice ? item.publicBoxPrice : item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] font-bold text-slate-500 flex justify-between items-center">
                    <span>Despacho: {order.customerAddress || 'Farmacia Vitalis'}</span>
                    <span className="uppercase text-teal-700 font-black">{order.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Efectivo'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        prescriptions.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
            <FileText className="mx-auto h-16 w-16 text-slate-200 mb-4" />
            <h4 className="font-black text-slate-700 text-lg uppercase tracking-tight mb-1">No has enviado recetas médicas</h4>
            <p className="text-xs text-slate-400">Puedes tomar una foto a tu receta física y subirla para cotizarla y recibirla en tu domicilio.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((presc, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {presc.imageUrl ? (
                    <img src={presc.imageUrl} alt="Receta" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black shrink-0">
                      <FileText size={24} />
                    </div>
                  )}
                  <div>
                    <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight">Receta para {presc.patientName}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(presc.createdAt).toLocaleDateString()}</p>
                    {presc.notes && <p className="text-xs text-slate-600 mt-1 italic">"{presc.notes}"</p>}
                  </div>
                </div>

                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                  presc.status === 'COMPLETADO' ? 'bg-emerald-100 text-emerald-800' : presc.status === 'COTIZADO' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {presc.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
