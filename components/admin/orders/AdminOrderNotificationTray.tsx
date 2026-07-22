import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Phone, 
  Check, 
  Truck, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  User as UserIcon,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { Order } from '../../../types';

interface AdminOrderNotificationTrayProps {
  orders: Order[];
  onUpdateOrderStatus: (id: string, status: 'IN_TRANSIT' | 'DELIVERED', order: Order) => Promise<void>;
  onNavigateToOrders: (orderId?: string) => void;
}

export const AdminOrderNotificationTray: React.FC<AdminOrderNotificationTrayProps> = ({
  orders,
  onUpdateOrderStatus,
  onNavigateToOrders
}) => {
  // Track order IDs that admin has manually acknowledged or handled
  const [acknowledgedOrderIds, setAcknowledgedOrderIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vitalis_admin_ack_orders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter pending orders that haven't been acknowledged
  const activePendingOrders = orders.filter(
    (o) => o.status === 'PENDING' && !acknowledgedOrderIds.includes(o.id)
  );

  // Sound chime when a new unacknowledged order arrives
  useEffect(() => {
    if (activePendingOrders.length > 0 && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        // Audio playback error or blocked by browser policy
      }
    }
  }, [activePendingOrders.length, soundEnabled]);

  const saveAcknowledged = (newIds: string[]) => {
    setAcknowledgedOrderIds(newIds);
    try {
      localStorage.setItem('vitalis_admin_ack_orders', JSON.stringify(newIds));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledge = (orderId: string) => {
    saveAcknowledged([...acknowledgedOrderIds, orderId]);
  };

  const handleStatusChange = async (order: Order, newStatus: 'IN_TRANSIT' | 'DELIVERED') => {
    setActionLoadingId(order.id);
    try {
      await onUpdateOrderStatus(order.id, newStatus, order);
      handleAcknowledge(order.id);
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (activePendingOrders.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-4 max-w-md w-full animate-in slide-in-from-bottom duration-300 pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 border-2 border-amber-500/80 text-white rounded-3xl p-4 shadow-2xl space-y-3 backdrop-blur-xl bg-opacity-95">
        {/* Header Alert Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
                <ShoppingBag size={20} className="animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-slate-900">
                {activePendingOrders.length}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                🚨 ¡NUEVO PEDIDO RECIBIDO!
              </h4>
              <p className="text-[11px] text-slate-300 font-bold">
                {activePendingOrders.length === 1
                  ? 'Requiere atención inmediata del administrador'
                  : `${activePendingOrders.length} pedidos pendientes de revisión`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={soundEnabled ? 'Silenciar Alarma' : 'Activar Sonido'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* List of Pending Orders (Intact until action taken) */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {activePendingOrders.map((order) => {
            const shortId = order.id.slice(-6);
            const isExpanded = expandedOrderIds.includes(order.id);
            const isLoading = actionLoadingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-3.5 space-y-3 transition-all"
              >
                {/* Order Top Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500/20 text-amber-300 text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                        #{shortId}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {order.date
                          ? new Date(order.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Ahora'}
                      </span>
                    </div>
                    <p className="text-sm font-black text-white mt-1 truncate flex items-center gap-1.5">
                      <UserIcon size={14} className="text-teal-400 shrink-0" />
                      {order.customerName || 'Cliente'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-emerald-400 block">
                      ${order.total.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded-md">
                      {order.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Efectivo'}
                    </span>
                  </div>
                </div>

                {/* Shipping & Contact Info */}
                <div className="bg-slate-900/90 rounded-xl p-2.5 space-y-1.5 text-xs text-slate-300">
                  {order.customerAddress && (
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <MapPin size={13} className="text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.customerAddress}</span>
                    </div>
                  )}

                  {order.customerPhone && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                        <Phone size={12} className="text-teal-400" />
                        <span>{order.customerPhone}</span>
                      </div>
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>

                {/* Items Summary Collapsible */}
                <div>
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full text-left text-[11px] font-bold text-slate-400 hover:text-slate-200 flex items-center justify-between p-1"
                  >
                    <span>
                      Ver Productos ({order.items?.length || 0} ítems)
                    </span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && order.items && order.items.length > 0 && (
                    <div className="mt-1 bg-slate-900 p-2.5 rounded-xl space-y-1.5 text-xs border border-slate-800">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300">
                          <span className="font-semibold truncate max-w-[200px]">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-black text-slate-100">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons (Dispatch, Delivered, Details, Dismiss) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleStatusChange(order, 'IN_TRANSIT')}
                    disabled={isLoading}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] py-2 px-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/10 disabled:opacity-50"
                  >
                    <Truck size={14} />
                    <span>Despachar</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(order, 'DELIVERED')}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] py-2 px-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                  >
                    <PackageCheck size={14} />
                    <span>Entregado</span>
                  </button>
                </div>

                <div className="flex justify-between items-center text-[10px] pt-1">
                  <button
                    onClick={() => {
                      onNavigateToOrders(order.id);
                    }}
                    className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink size={11} /> Ir a Gestión de Pedidos
                  </button>

                  <button
                    onClick={() => handleAcknowledge(order.id)}
                    className="text-slate-400 hover:text-slate-200 font-bold flex items-center gap-1"
                    title="Marcar Atendido para ocultar alerta"
                  >
                    <Check size={12} className="text-emerald-400" /> Marcar Atendido
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderNotificationTray;
