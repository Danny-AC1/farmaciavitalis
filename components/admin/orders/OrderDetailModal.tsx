import React from 'react';
import { 
  X, MapPin, Receipt, CreditCard, 
  User, Compass, ExternalLink, MessageSquare, Printer, CheckCircle, Truck, Package 
} from 'lucide-react';
import { Order, Product } from '../../../types';

interface OrderDetailModalProps {
  order: Order | null;
  products: Product[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'IN_TRANSIT' | 'DELIVERED') => void;
  onPrint: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  products,
  onClose,
  onUpdateStatus,
  onPrint
}) => {
  if (!order) return null;

  // Find rich product details (like images) from inventory
  const getProductImage = (productId: string) => {
    const invProduct = products.find(p => p.id === productId);
    return invProduct?.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150';
  };

  const getProductIngredient = (productId: string) => {
    const invProduct = products.find(p => p.id === productId);
    return invProduct?.activeIngredient || '';
  };

  const formatWhatsAppLink = () => {
    const rawPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = rawPhone.startsWith('593') ? rawPhone : `593${rawPhone.replace(/^0/, '')}`;
    
    const text = `¡Hola, ${order.customerName}! 🌟 Te saludamos de *Farmacia Vitalis*.\n\nTu pedido *#${order.id.slice(-6)}* se encuentra en el estado: *${
      order.status === 'PENDING' ? 'PROCESANDO' : order.status === 'IN_TRANSIT' ? 'EN CAMINO 🛵' : 'ENTREGADO ✅'
    }*.\n\nDetalle:\n${order.items.map(i => `- ${i.quantity}x ${i.name}`).join('\n')}\n\n*Total a pagar:* $${order.total.toFixed(2)} (${
      order.paymentMethod === 'CASH' ? 'Efectivo contra entrega' : 'Transferencia Bancaria'
    }).\n\n¡Gracias por confiar en nosotros! 💚`;
    
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const steps = [
    { key: 'PENDING', label: 'Pendiente', icon: Package, desc: 'Recibido en farmacia' },
    { key: 'IN_TRANSIT', label: 'En Camino', icon: Truck, desc: 'Repartidor despachado' },
    { key: 'DELIVERED', label: 'Entregado', icon: CheckCircle, desc: 'Completado con éxito' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        id="order-detail-modal-card"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">FARMACIA VITALIS</span>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              Pedido #{order.id.slice(-6)}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
            id="order-detail-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Status Stepper */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4">Estado del Pedido</p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                
                return (
                  <div key={step.key} className="flex sm:flex-col items-center gap-3 flex-1 w-full relative z-10">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                      isCurrent 
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/15 scale-105'
                        : isPassed
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                      <StepIcon size={16} />
                    </div>
                    <div className="text-left sm:text-center min-w-0">
                      <p className={`text-xs font-black uppercase tracking-wide ${
                        isCurrent ? 'text-teal-600' : isPassed ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 truncate">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs bg-white">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <User size={12} className="text-teal-500" /> Datos del Cliente
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Nombre</p>
                  <p className="font-extrabold text-slate-800 uppercase">{order.customerName}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Celular</p>
                    <p className="font-bold text-slate-700">{order.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Fecha/Hora</p>
                    <p className="font-bold text-slate-700">
                      {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs bg-white">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
                <MapPin size={12} className="text-teal-500" /> Dirección de Entrega
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Dirección Física</p>
                  <p className="font-bold text-slate-700 leading-tight">{order.customerAddress}</p>
                </div>
                {order.lat && order.lng ? (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Coordenadas Geográficas</p>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg transition-colors mt-1"
                    >
                      <Compass size={12} /> Ver en Google Maps <ExternalLink size={10} />
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Geolocalización</p>
                    <span className="text-[10px] font-bold text-slate-400 italic">No disponible para esta orden</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="border border-slate-100 rounded-2xl p-4 shadow-xs bg-white space-y-3">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Receipt size={12} className="text-teal-500" /> Medicamentos en Pedido
            </p>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => {
                const isBox = item.selectedUnit === 'BOX';
                const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                
                return (
                  <div key={idx} className="py-2.5 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={getProductImage(item.id)} 
                        alt={item.name} 
                        className="h-10 w-10 rounded-xl object-cover border border-slate-100 bg-slate-50"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 uppercase truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate">
                          {getProductIngredient(item.id)} • {isBox ? `Caja x${item.unitsPerBox}` : 'Unidad'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-800">${(price * item.quantity).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {item.quantity} x ${price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <CreditCard size={12} className="text-teal-500" /> Método de Pago
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-700">
                    {order.paymentMethod === 'CASH' ? 'Efectivo contra entrega' : 'Transferencia Bancaria'}
                  </span>
                </div>
              </div>

              {order.paymentMethod === 'CASH' && order.cashGiven && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1 mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Efectivo Entregado:</span>
                    <span>${order.cashGiven.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-800">
                    <span>Vuelto Requerido:</span>
                    <span className="text-teal-600">${(order.cashGiven - order.total).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-2xl p-4 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-extrabold text-slate-800">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo Envío:</span>
                <span className="font-extrabold text-slate-800">${order.deliveryFee.toFixed(2)}</span>
              </div>
              {order.discount ? (
                <div className="flex justify-between text-rose-600">
                  <span>Descuento aplicado:</span>
                  <span className="font-extrabold">-${order.discount.toFixed(2)}</span>
                </div>
              ) : null}
              {order.pointsRedeemed ? (
                <div className="flex justify-between text-teal-600">
                  <span>Puntos Canjeados:</span>
                  <span className="font-extrabold">-{order.pointsRedeemed} pts</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-black text-slate-950 border-t border-slate-100 pt-2 mt-1">
                <span>Total Final:</span>
                <span className="text-teal-700">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-between items-center shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => onPrint(order)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
              id="order-detail-print-btn"
            >
              <Printer size={13} /> Imprimir Ticket
            </button>
            <a
              href={formatWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
              id="order-detail-whatsapp-btn"
            >
              <MessageSquare size={13} /> Avisar por WhatsApp
            </a>
          </div>

          <div className="flex gap-2">
            {order.status === 'PENDING' && (
              <>
                <button
                  onClick={() => onUpdateStatus(order.id, 'IN_TRANSIT')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
                  id="order-detail-dispatch-btn"
                >
                  <Truck size={13} /> Despachar
                </button>
                <button
                  onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
                  id="order-detail-deliver-btn"
                >
                  <CheckCircle size={13} /> Entregar
                </button>
              </>
            )}
            {order.status === 'IN_TRANSIT' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
                id="order-detail-complete-btn"
              >
                <CheckCircle size={13} /> Completar Entrega
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
