import React, { useEffect, useState, useMemo } from 'react';
import { User, Order, POINTS_THRESHOLD, Coupon } from '../../types';
import { getOrdersByUserDB, streamCoupons, addCouponDB, updateUserFieldsDB } from '../../services/db';
import { 
  X, RefreshCw, ShoppingBag, Gift, Star, Trophy, Navigation, Radio, MapPin, 
  Clock, Loader2, Copy, Check, Search, FileText,
  Truck, ShieldCheck, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';

interface UserOrdersModalProps {
  user: User;
  onClose: () => void;
  onReorder: (order: Order) => void;
}

type OrderTab = 'ACTIVE' | 'HISTORY' | 'REWARDS';

const UserOrdersModal: React.FC<UserOrdersModalProps> = ({ user, onClose, onReorder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>('ACTIVE');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Mantenemos una referencia de la ID de rastreo para actualizarla sin reiniciar el efecto
  const trackingId = selectedTrackingOrder?.id;

  useEffect(() => {
    if (!user.uid) return;

    setIsLoading(true);
    const unsub = getOrdersByUserDB(user.uid, (data) => {
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

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const unsubCoupons = streamCoupons(setCoupons);
    return () => unsubCoupons();
  }, []);

  const myCoupons = useMemo(() => coupons.filter(c => c.userId === user.uid && c.active), [coupons, user.uid]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status === 'PENDING' || o.status === 'IN_TRANSIT');
  }, [orders]);

  const pastOrders = useMemo(() => {
    return orders.filter(o => o.status === 'DELIVERED');
  }, [orders]);

  const filteredPastOrders = useMemo(() => {
    if (!searchQuery.trim()) return pastOrders;
    const query = searchQuery.toLowerCase();
    return pastOrders.filter(o => 
      o.id.toLowerCase().includes(query) ||
      o.items.some(i => i.name.toLowerCase().includes(query))
    );
  }, [pastOrders, searchQuery]);

  const points = user.points || 0;
  const progressPercentage = Math.min(100, (points / POINTS_THRESHOLD) * 100);
  const pointsNeeded = Math.max(0, POINTS_THRESHOLD - points);

  const handleRedeemPoints = async () => {
    if (points < POINTS_THRESHOLD) return;
    setIsRedeeming(true);
    try {
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const code = `V15-${randomSuffix}`;

      await addCouponDB({
        id: '',
        code,
        type: 'PERCENTAGE',
        value: 15,
        active: true,
        userId: user.uid
      });

      await updateUserFieldsDB(user.uid, {
        points: points - POINTS_THRESHOLD
      });
    } catch (error) {
      console.error("Error redeeming points:", error);
      alert("Hubo un error al canjear tus puntos. Por favor, intenta de nuevo.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRateOrder = (orderId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [orderId]: rating }));
  };

  const getStepProgress = (status: Order['status']) => {
    switch(status) {
      case 'PENDING': return 2; // Recibido y preparando
      case 'IN_TRANSIT': return 3; // En ruta GPS
      case 'DELIVERED': return 4; // Entregado
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-800 text-white">
        
        {/* Header Mis Pedidos */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b border-slate-800/80 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12} /> Farmacia Vitalis Machalilla
            </span>
            <h3 className="font-black text-xl sm:text-2xl text-white flex items-center gap-2 uppercase tracking-tight mt-0.5">
              <ShoppingBag className="h-6 w-6 text-teal-400"/> Mis Pedidos & Recetas
            </h3>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {!selectedTrackingOrder && (
          <div className="bg-slate-950/80 p-2 border-b border-slate-800 flex gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ACTIVE'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Truck size={15} />
              <span>En Proceso</span>
              {activeOrders.length > 0 && (
                <span className="ml-1 bg-slate-950 text-teal-300 text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'HISTORY'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileText size={15} />
              <span>Historial</span>
            </button>

            <button
              onClick={() => setActiveTab('REWARDS')}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'REWARDS'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Trophy size={15} className="text-yellow-400" />
              <span>Puntos ({points})</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="overflow-y-auto flex-grow bg-slate-900/90 p-4 sm:p-5 no-scrollbar">
            
            {/* VISTA DE RASTREO GPS EN TIEMPO REAL */}
            {selectedTrackingOrder ? (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <button 
                      onClick={() => setSelectedTrackingOrder(null)} 
                      className="text-teal-400 font-black text-xs flex items-center gap-1 hover:translate-x-[-4px] transition-transform bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 w-fit"
                    >
                        &larr; VOLVER A MIS PEDIDOS
                    </button>
                    
                    <div className="bg-slate-800/90 p-5 rounded-[2rem] shadow-xl border border-teal-500/30 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-black text-white uppercase tracking-tighter flex items-center gap-2 text-lg">
                                    <Radio className="text-red-500 animate-pulse" size={20}/> Rastreo GPS Vitalis
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Orden: #{selectedTrackingOrder.id.slice(-8)}</p>
                            </div>
                            <div className="bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 animate-pulse">
                                🛵 MOTORIZADO EN RUTA
                            </div>
                        </div>

                        {/* Stepper de progreso del pedido */}
                        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 mb-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                            <span className="text-teal-400">1. Recibido</span>
                            <span className="text-teal-400">2. Despachado</span>
                            <span className="text-blue-400 font-black">3. En Ruta GPS</span>
                            <span>4. Entregado</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-400 via-blue-500 to-indigo-500 h-full w-3/4 rounded-full transition-all duration-500" />
                          </div>
                        </div>

                        <div className="w-full h-72 bg-slate-950 rounded-3xl overflow-hidden border border-slate-700 relative shadow-inner">
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
                                    <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md p-2 px-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">GPS Transmitiendo</span>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 p-8 text-center">
                                    <div className="relative mb-4">
                                        <Navigation className="h-12 w-12 text-teal-400 animate-bounce" />
                                        <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl animate-pulse"></div>
                                    </div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest">Sincronizando con la unidad de entrega...</p>
                                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-xs">El motorizado asignado en Machalilla está activando su ruta GPS.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-700/80 flex items-center gap-3">
                                <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md"><MapPin size={18}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Destino de Entrega</p>
                                    <p className="text-xs text-white font-bold leading-tight uppercase truncate">{selectedTrackingOrder.customerAddress.split(',')[0]}</p>
                                </div>
                            </div>
                            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-700/80 flex items-center gap-3">
                                <div className="bg-teal-600 text-white p-2.5 rounded-xl shadow-md"><Clock size={18}/></div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Tiempo Estimado</p>
                                    <p className="text-xs text-teal-400 font-bold leading-tight uppercase">10 - 20 MINUTOS</p>
                                </div>
                            </div>
                        </div>

                        {/* Botón de contacto directo con repartidor */}
                        <div className="mt-4 flex gap-2">
                          <a
                            href={`https://wa.me/593991234567?text=Hola,%20quisiera%20consultar%20sobre%20mi%20pedido%20%23${selectedTrackingOrder.id.slice(-8)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                          >
                            <MessageSquare size={16} /> Contactar Repartidor por WhatsApp
                          </a>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'ACTIVE' ? (
              /* TAB 1: PEDIDOS ACTIVOS EN PROCESO */
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Envíos & Entregas en Curso</h4>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-950 border border-teal-800/80 px-2.5 py-0.5 rounded-full">
                    Garantía de Tiempo Machalilla
                  </span>
                </div>

                {isLoading ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando tus envíos activos...</p>
                  </div>
                ) : activeOrders.length === 0 ? (
                  <div className="text-center py-16 bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-700/80 p-6">
                    <Truck className="h-14 w-14 mx-auto text-slate-600 mb-3" />
                    <p className="text-white font-black uppercase tracking-widest text-sm">No tienes pedidos en curso</p>
                    <p className="text-slate-400 text-xs mt-1">Tus compras recientes y envíos en vivo aparecerán aquí.</p>
                  </div>
                ) : (
                  activeOrders.map(order => {
                    const step = getStepProgress(order.status);
                    const isExpanded = expandedOrderId === order.id;

                    return (
                      <div key={order.id} className="bg-slate-800/90 rounded-3xl border border-teal-500/40 p-5 shadow-xl relative overflow-hidden transition-all hover:border-teal-400">
                        
                        {/* Header de la orden */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                {order.status === 'IN_TRANSIT' ? 'En Ruta GPS 🛵' : 'En Preparación 💊'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(order.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden #{order.id.slice(-8)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-2xl text-teal-400 tracking-tighter">${order.total.toFixed(2)}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">{order.items.length} ítem{order.items.length > 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        {/* Visual Stepper de Progreso */}
                        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/80 mb-4">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-2">
                            <span className={step >= 1 ? 'text-teal-400' : 'text-slate-500'}>1. Registrado</span>
                            <span className={step >= 2 ? 'text-teal-400' : 'text-slate-500'}>2. Preparando</span>
                            <span className={step >= 3 ? 'text-blue-400 font-black' : 'text-slate-500'}>3. En Camino</span>
                            <span className={step >= 4 ? 'text-emerald-400' : 'text-slate-500'}>4. Entregado</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                            <div 
                              className="bg-gradient-to-r from-teal-400 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                              style={{ width: `${(step / 4) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Resumen de items */}
                        <div className="bg-slate-950/60 rounded-2xl p-3.5 space-y-2 border border-slate-800 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-200">
                              <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                              <span className="text-slate-400 font-mono text-[11px]">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Botones de acción principal */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTrackingOrder(order)}
                            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-95"
                          >
                            <Navigation size={16} className="animate-pulse" /> Ver Mapa GPS en Vivo
                          </button>

                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="px-4 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-2xl text-xs transition-all flex items-center gap-1"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                        {/* Detalles extendidos del pedido */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-700 space-y-2 text-xs text-slate-300 animate-in fade-in duration-200">
                            <p><strong className="text-teal-400">Dirección:</strong> {order.customerAddress}</p>
                            <p><strong className="text-teal-400">Teléfono:</strong> {order.customerPhone}</p>
                            <p><strong className="text-teal-400">Método de Pago:</strong> {order.paymentMethod === 'TRANSFER' ? 'Transferencia Bancaria' : 'Efectivo contra entrega'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : activeTab === 'HISTORY' ? (
              /* TAB 2: HISTORIAL COMPLETO DE COMPRAS Y RECETAS */
              <div className="space-y-4">
                {/* Search / Filter bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por medicina o ID de compra..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
                  />
                </div>

                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 text-teal-400 animate-spin mx-auto" />
                  </div>
                ) : filteredPastOrders.length === 0 ? (
                  <div className="text-center py-16 bg-slate-800/40 rounded-[2rem] border border-dashed border-slate-700 p-6">
                    <FileText className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-300 font-bold text-xs uppercase tracking-wider">No hay compras finalizadas</p>
                    <p className="text-slate-500 text-[11px] mt-1">Tus pedidos completados se guardan aquí para tu control de salud.</p>
                  </div>
                ) : (
                  filteredPastOrders.map(order => (
                    <div key={order.id} className="bg-slate-800/70 p-5 rounded-3xl border border-slate-700/80 shadow-md hover:border-slate-600 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              order.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {order.status === 'DELIVERED' ? '✓ Entregado' : 'Cancelado'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(order.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-400">ID: #{order.id.slice(-8)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xl text-teal-400">${order.total.toFixed(2)}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-bold">{order.items.length} productos</p>
                        </div>
                      </div>

                      {/* Lista de medicamentos de la orden */}
                      <div className="bg-slate-900/80 rounded-2xl p-3 mb-3.5 space-y-1.5 border border-slate-800/90">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs font-medium text-slate-300">
                            <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                            <span className="font-mono text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Calificación por estrellas */}
                      {order.status === 'DELIVERED' && (
                        <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800 mb-3">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">¿Qué tal la entrega?</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRateOrder(order.id, star)}
                                className="p-0.5 hover:scale-125 transition-transform"
                              >
                                <Star
                                  size={16}
                                  className={star <= (ratings[order.id] || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => onReorder(order)}
                          className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-teal-900/30"
                        >
                          <RefreshCw className="h-4 w-4" /> Repetir Pedido en 1-Clic
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* TAB 3: PROGRAMA DE PUNTOS VITALIS REWARDS */
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden border border-purple-500/30">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="font-black text-xl flex items-center gap-2 uppercase tracking-tight">
                                    <Trophy className="h-6 w-6 text-yellow-400" /> Vitalis Rewards
                                </h4>
                                <p className="text-purple-200 text-[10px] font-bold uppercase tracking-widest mt-1">Gana 1 Punto por cada $1 en compras</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-4xl font-black tracking-tighter text-yellow-400 drop-shadow-md">{points}</span>
                                <span className="text-[9px] uppercase font-black tracking-widest text-purple-200">Puntos Acumulados</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-black uppercase mb-1.5 text-purple-200 tracking-wider">
                                <span>Progreso a tu Cuponera</span>
                                <span>Meta: {POINTS_THRESHOLD} pts</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-3.5 border border-purple-500/30 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(253,224,71,0.5)]" 
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-slate-900/80 rounded-2xl p-4 flex flex-col gap-2 border border-purple-500/30">
                            {points >= POINTS_THRESHOLD ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-yellow-300 font-black text-xs animate-pulse">
                                        <Gift className="h-5 w-5" /> ¡FELICIDADES! TIENES PUNTOS SUFICIENTES
                                    </div>
                                    <button
                                        onClick={handleRedeemPoints}
                                        disabled={isRedeeming}
                                        className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-700 text-slate-950 text-xs font-black py-3 px-4 rounded-xl uppercase tracking-wider transition-all shadow-lg active:scale-95"
                                    >
                                        {isRedeeming ? 'Generando cupón...' : 'Canjear Cupón de 15% OFF'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current shrink-0" />
                                    <span>Acumula <strong className="text-white">{pointsNeeded} puntos más</strong> para desbloquear un 15% OFF en tu receta.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mis Cupones Desbloqueados */}
                {myCoupons.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] ml-1">Mis Cupones Activos</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {myCoupons.map((coupon) => (
                        <div key={coupon.id} className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                              <Gift size={20} />
                            </div>
                            <div>
                              <p className="font-black text-emerald-400 text-xs uppercase tracking-wider mb-0.5">{coupon.code}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">15% de Descuento directo</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 px-3 py-2 rounded-xl text-white transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase"
                          >
                            {copiedCode === coupon.code ? (
                              <>
                                <Check size={14} className="text-emerald-400" />
                                <span className="text-emerald-400">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserOrdersModal;
