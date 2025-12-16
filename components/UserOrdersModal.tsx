import React, { useEffect, useState } from 'react';
import { User, Order, Product, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE } from '../types';
import { getOrdersByUserDB } from '../services/db';
import { X, RefreshCw, ShoppingBag, Gift, Star, Trophy } from 'lucide-react';

interface UserOrdersModalProps {
  user: User;
  products: Product[]; // Para verificar stock al reordenar
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

  // Cálculos para la barra de progreso
  const points = user.points || 0;
  const progressPercentage = Math.min(100, (points / POINTS_THRESHOLD) * 100);
  const pointsNeeded = Math.max(0, POINTS_THRESHOLD - points);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="p-4 border-b bg-white flex justify-between items-center z-10">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-teal-600"/> Mis Pedidos
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow bg-gray-50 pb-safe">
            
            {/* --- SISTEMA DE PUNTOS (Tarjeta de Fidelidad) --- */}
            <div className="p-4">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                    {/* Elementos decorativos de fondo */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-purple-400 opacity-20 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-300" /> Vitalis Rewards
                                </h4>
                                <p className="text-indigo-100 text-xs mt-1">Gana puntos en cada compra.</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-3xl font-black tracking-tight">{points}</span>
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Puntos Actuales</span>
                            </div>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs font-bold mb-1 opacity-90">
                                <span>Progreso</span>
                                <span>{POINTS_THRESHOLD} pts</span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2.5 backdrop-blur-sm overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(253,224,71,0.5)]" 
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Estado del Premio */}
                        <div className="bg-white/10 rounded-lg p-2 mt-3 flex items-center justify-between backdrop-blur-md border border-white/10">
                            {points >= POINTS_THRESHOLD ? (
                                <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm animate-pulse">
                                    <Gift className="h-4 w-4" /> ¡Premio de ${POINTS_DISCOUNT_VALUE} disponible!
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-indigo-100">
                                    <Star className="h-3 w-3 text-yellow-300 fill-current" />
                                    <span>Te faltan <strong>{pointsNeeded} pts</strong> para tu recompensa.</span>
                                </div>
                            )}
                            {points >= POINTS_THRESHOLD && (
                                <span className="bg-white text-indigo-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                    Usar en Checkout
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LISTA DE PEDIDOS --- */}
            <div className="px-4 pb-4 space-y-4">
                <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider ml-1">Historial Reciente</h4>
                
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Cargando historial...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <ShoppingBag className="h-12 w-12 mx-auto text-gray-200 mb-2" />
                        <p className="text-gray-500 font-medium">Aún no tienes pedidos.</p>
                        <p className="text-xs text-gray-400 mt-1">¡Haz tu primera compra para ganar puntos!</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {order.status === 'DELIVERED' ? 'Entregado' : 'En Proceso'}
                                        </span>
                                        <span className="text-xs text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-0.5">ID: {order.id.slice(-6)}</p>
                                </div>
                                <p className="font-black text-lg text-teal-700">${order.total.toFixed(2)}</p>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-2.5 mb-3 space-y-1">
                                {order.items.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs text-gray-600">
                                        <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                                        {!products.find(p => p.id === item.id) && <span className="text-red-400 font-bold text-[10px]">Agotado</span>}
                                    </div>
                                ))}
                                {order.items.length > 3 && <p className="text-[10px] text-gray-400 italic">...y {order.items.length - 3} más</p>}
                            </div>

                            <button 
                                onClick={() => onReorder(order)}
                                className="w-full py-2.5 bg-white border border-teal-200 text-teal-700 font-bold rounded-lg text-sm hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 group"
                            >
                                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform"/> Repetir Pedido
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrdersModal;