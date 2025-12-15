import React, { useEffect, useState } from 'react';
import { User, Order, Product } from '../types';
import { getOrdersByUserDB } from '../services/db';
import { X, RefreshCw, ShoppingBag } from 'lucide-react';

interface UserOrdersModalProps {
  user: User;
  products: Product[]; // To check current stock
  onClose: () => void;
  onReorder: (order: Order) => void;
}

const UserOrdersModal: React.FC<UserOrdersModalProps> = ({ user, products, onClose, onReorder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = getOrdersByUserDB(user.uid, (data) => {
        setOrders(data);
        setIsLoading(false);
    });
    return () => unsub();
  }, [user.uid]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-200">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-teal-600"/> Mis Pedidos
          </h3>
          <button onClick={onClose}><X className="h-6 w-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="overflow-y-auto p-5 space-y-4 bg-gray-50 flex-grow">
           {isLoading ? (
               <div className="text-center py-10 text-gray-400">Cargando historial...</div>
           ) : orders.length === 0 ? (
               <div className="text-center py-10 text-gray-400">
                   <p>Aún no has realizado compras.</p>
               </div>
           ) : (
               orders.map(order => (
                   <div key={order.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                       <div className="flex justify-between items-start mb-3">
                           <div>
                               <p className="text-xs font-bold text-gray-400">{new Date(order.date).toLocaleDateString()} • {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                               <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                   {order.status === 'DELIVERED' ? 'Entregado' : 'Pendiente'}
                               </span>
                           </div>
                           <p className="font-black text-lg text-teal-700">${order.total.toFixed(2)}</p>
                       </div>
                       
                       <div className="space-y-1 mb-4">
                           {order.items.map((item, idx) => (
                               <p key={idx} className="text-sm text-gray-600 flex justify-between">
                                   <span>{item.quantity}x {item.name}</span>
                                   {/* Small check if product still exists */}
                                   {!products.find(p => p.id === item.id) && <span className="text-[10px] text-red-400">(No disponible)</span>}
                               </p>
                           ))}
                       </div>

                       <button 
                         onClick={() => onReorder(order)}
                         className="w-full py-2 bg-teal-50 text-teal-700 font-bold rounded-lg border border-teal-200 hover:bg-teal-100 transition flex items-center justify-center gap-2 text-sm"
                       >
                           <RefreshCw className="h-4 w-4"/> Pedir de Nuevo
                       </button>
                   </div>
               ))
           )}
        </div>
      </div>
    </div>
  );
};

export default UserOrdersModal;