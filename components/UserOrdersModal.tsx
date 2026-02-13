
import React, { useEffect, useState } from 'react';
import { User, Order, POINTS_THRESHOLD } from '../types';
import { getOrdersByUserDB } from '../services/db';
import { X, RefreshCw, ShoppingBag, Gift, Star, Trophy, Navigation, Radio, MapPin, Clock, Loader2 } from 'lucide-react';

interface UserOrdersModalProps {
  user: User;
  onClose: () => void;
  onReorder: (order: Order) => void;
}

const UserOrdersModal: React.FC<UserOrdersModalProps> = ({ user, onClose, onReorder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);

  // Mantenemos una referencia de la ID de rastreo para actualizarla sin reiniciar el efecto
  const trackingId = selectedTrackingOrder?.id;

  useEffect(() => {
    if (!user.uid) return;

    setIsLoading(true);
    const unsub = getOrdersByUserDB(user.uid, (data) => {
        // ORDENAMIENTO LOCAL: Para evitar errores de índices en Firebase que hacen desaparecer los datos
        const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setOrders(sortedData);
        setIsLoading(false);
        
        if (trackingId) {
            const updated = sortedData.find(o => o.id === trackingId);
            if (updated) setSelectedTrackingOrder(updated);
        }
    });

    return () => unsub();
  }, [user.uid, trackingId]); 

  const points = user.points || 0;
  const progressPercentage = Math.min(100, (points / POINTS_THRESHOLD) * 100);
  const pointsNeeded = Math.max(0, POINTS_THRESHOLD - points);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="p-4 border-b bg-white flex justify-between items-center shrink-0">
          <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
            <ShoppingBag className="h-5 w-5 text-teal-600"/> Mi Actividad
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow bg-slate-50 pb-safe">
            
            {selectedTrackingOrder ? (
                <div className="p-4 space-y-4 animate-in slide-in-from-right duration-300">
                    <button onClick={() => setSelectedTrackingOrder(null)} className="text-teal-600 font-black text-xs flex items-center gap-1 mb-2 hover:translate-x-[-4px] transition-transform">
                        &larr; VOLVER A MIS PEDIDOS
                    </button>
                    
                    <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-teal-50 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-5">
                            <div>
                                <h4 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2 text-lg">
                                    <Radio className="text-red-500 animate-pulse" size={20}/> Rastreo Vitalis
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Orden: #{selectedTrackingOrder.id.slice(-8)}</p>
                            </div>
                            <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                                🛵 EN RUTA
                            </div>
                        </div>

                        <div className="w-full h-72 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner">
                            {/* @ts-ignore */}
                            {selectedTrackingOrder.driverLocation ? (
                                <>
                                    <iframe 
                                        title="Rastreo GPS Vitalis"
                                        className="w-full h-full border-0 contrast-[1.05]"
                                        /* @ts-ignore */
                                        src={`https://www.google.com/maps?q=${selectedTrackingOrder.driverLocation.lat},${selectedTrackingOrder.driverLocation.lng}&z=17&output=embed`}
                                        allowFullScreen
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white flex items-center gap-2">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-ping"></div>
                                        <span className="text-[9px] font-black text-slate-800 uppercase">GPS Activo</span>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
                                    <div className="relative mb-4">
                                        <Navigation className="h-12 w-12 text-slate-200 animate-bounce" />
                                        <div className="absolute inset-0 bg-teal-500/10 rounded-full blur-xl animate-pulse"></div>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Sincronizando con el repartidor...</p>
                                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">El motorizado está preparando su GPS. <br/>Verás su ubicación en unos segundos.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md"><MapPin size={18}/></div>
                                <div>
                                    <p className="text-[8px] font-black text-blue-800 uppercase leading-none mb-1">Destino</p>
                                    <p className="text-[11px] text-blue-600 font-bold leading-tight uppercase truncate">{selectedTrackingOrder.customerAddress.split(',')[0]}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center gap-3">
                                <div className="bg-teal-600 text-white p-2 rounded-xl shadow-md"><Clock size={18}/></div>
                                <div>
                                    <p className="text-[8px] font-black text-teal-800 uppercase leading-none mb-1">Tiempo Est.</p>
                                    <p className="text-[11px] text-teal-600 font-bold leading-tight uppercase">5-10 MIN</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-slate-900 rounded-2xl text-center">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">🛵 Vitalis Machalilla al Instante</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                <div className="p-4">
                    <div className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-black text-lg flex items-center gap-2 uppercase tracking-tighter">
                                        <Trophy className="h-5 w-5 text-yellow-400" /> Vitalis Rewards
                                    </h4>
                                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Programa de beneficios</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-4xl font-black tracking-tighter text-white drop-shadow-md">{points}</span>
                                    <span className="text-[9px] uppercase font-black tracking-widest text-indigo-200">Puntos Acumulados</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] font-black uppercase mb-1.5 text-indigo-100 tracking-widest">
                                    <span>Tu Progreso</span>
                                    <span>Meta: {POINTS_THRESHOLD} pts</span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-3 border border-white/10 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(253,224,71,0.4)]" 
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-2xl p-3 flex items-center justify-between backdrop-blur-md border border-white/10">
                                {points >= POINTS_THRESHOLD ? (
                                    <div className="flex items-center gap-2 text-yellow-300 font-black text-xs animate-pulse">
                                        <Gift className="h-4 w-4" /> ¡TIENES UN VALE DE $5!
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-100">
                                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                        <span>TE FALTAN <strong className="text-white">{pointsNeeded} PTS</strong> PARA TU RECOMPENSA.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-6 space-y-4">
                    <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] ml-2">Historial Reciente</h4>
                    
                    {isLoading ? (
                        <div className="text-center py-10 flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 text-teal-600 animate-spin opacity-50" />
                            <p className="text-[10px] font-black text-slate-400 uppercase">Sincronizando historial...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                            <ShoppingBag className="h-14 w-14 mx-auto text-slate-100 mb-3" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aún no hay compras</p>
                            <p className="text-slate-300 text-[10px] mt-1 uppercase">Empieza tu camino saludable hoy</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm ${
                                                order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' : 
                                                order.status === 'IN_TRANSIT' ? 'bg-blue-600 text-white animate-pulse' : 
                                                'bg-orange-50 text-orange-700'
                                            }`}>
                                                {order.status === 'DELIVERED' ? 'Entregado' : order.status === 'IN_TRANSIT' ? 'En Camino 🛵' : 'Procesando'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(order.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: {order.id.slice(-8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-2xl text-teal-700 tracking-tighter">${order.total.toFixed(2)}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{order.items.length} Productos</p>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50/80 rounded-2xl p-3 mb-4 space-y-1.5 border border-slate-100">
                                    {order.items.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                                            <span className="truncate pr-4">{item.quantity}x {item.name}</span>
                                        </div>
                                    ))}
                                    {order.items.length > 2 && <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest pt-1">+ {order.items.length - 2} productos adicionales</p>}
                                </div>

                                <div className="flex gap-2">
                                    {order.status === 'IN_TRANSIT' ? (
                                        <button 
                                            onClick={() => setSelectedTrackingOrder(order)}
                                            className="flex-1 py-3.5 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
                                        >
                                            <Navigation size={14} className="animate-pulse" /> Rastrear ahora
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => onReorder(order)}
                                            className="flex-1 py-3.5 bg-white border-2 border-teal-500 text-teal-600 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-teal-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <RefreshCw className="h-4 w-4" /> Repetir Pedido
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserOrdersModal;
