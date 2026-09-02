import React from 'react';
import { Order } from '../../../types';
import { ShieldCheck, HeartPulse, Phone, MapPin, Calendar, User, CreditCard } from 'lucide-react';

interface DigitalReceiptImageCardProps {
  order: Order;
  cardRef: React.RefObject<HTMLDivElement>;
}

export const DigitalReceiptImageCard: React.FC<DigitalReceiptImageCardProps> = ({
  order,
  cardRef
}) => {
  const dateFormatted = new Date(order.date).toLocaleString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const orderNum = order.id.slice(-6).toUpperCase();
  const paymentMethodLabel = order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia Bancaria';

  return (
    <div className="overflow-hidden flex justify-center py-2">
      {/* Tarjeta del Comprobante optimizada para exportar como imagen HD */}
      <div 
        ref={cardRef}
        id={`receipt-image-card-${order.id}`}
        className="w-[400px] bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 font-sans relative overflow-hidden"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Decoración superior con gradiente de marca */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />

        {/* Cabecera de la Farmacia */}
        <div className="text-center pt-2 pb-4 border-b border-slate-100">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30">
              <HeartPulse size={18} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">FARMACIA VITALIS</h2>
          </div>
          <p className="text-[11px] font-extrabold text-teal-700 tracking-wide uppercase">
            Tu Salud Al Día • Comprobante Digital
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 mt-1 font-semibold">
            <span className="flex items-center gap-1">
              <MapPin size={10} /> Machalilla, Manabí
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone size={10} /> 0998506160
            </span>
          </div>
        </div>

        {/* Datos de la Orden y Cliente */}
        <div className="py-3.5 border-b border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">No. Comprobante</span>
              <span className="font-mono font-black text-slate-900 text-sm">#{orderNum}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Fecha de Emisión</span>
              <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1 justify-end">
                <Calendar size={11} className="text-teal-600" />
                {dateFormatted}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Cliente</span>
              <p className="font-black text-slate-800 truncate flex items-center gap-1 mt-0.5">
                <User size={11} className="text-teal-600 shrink-0" />
                {order.customerName || 'Consumidor Final'}
              </p>
            </div>
            <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Método de Pago</span>
              <p className="font-black text-slate-800 truncate flex items-center gap-1 mt-0.5">
                <CreditCard size={11} className="text-teal-600 shrink-0" />
                {paymentMethodLabel}
              </p>
            </div>
          </div>

          {order.customerAddress && (
            <div className="text-[10px] text-slate-500 bg-slate-50/50 px-2.5 py-1.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
              <MapPin size={11} className="text-teal-600 shrink-0" />
              <span className="truncate"><strong>Entrega:</strong> {order.customerAddress}</span>
            </div>
          )}
        </div>

        {/* Tabla / Lista de Medicamentos */}
        <div className="py-3">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 px-1">
            <span>Descripción / Presentación</span>
            <span>Importe</span>
          </div>

          <div className="space-y-2">
            {order.items.map((item, idx) => {
              const isBox = item.selectedUnit === 'BOX';
              const unitPrice = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
              const lineTotal = unitPrice * item.quantity;

              return (
                <div 
                  key={idx} 
                  className="flex justify-between items-start text-xs bg-slate-50/70 p-2 rounded-xl border border-slate-100"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-teal-700 text-[11px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                        {item.quantity}x
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {isBox ? `Caja x${item.unitsPerBox || 1} unids.` : 'Unidad individual'} • ${unitPrice.toFixed(2)} c/u
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 font-mono text-xs">
                      ${lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desglose de Totales */}
        <div className="border-t border-dashed border-slate-200 pt-3 pb-2 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Subtotal:</span>
            <span className="font-mono font-bold">${order.subtotal.toFixed(2)}</span>
          </div>

          {order.deliveryFee ? (
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Costo de Envío:</span>
              <span className="font-mono font-bold">${order.deliveryFee.toFixed(2)}</span>
            </div>
          ) : null}

          {order.discount ? (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Descuento aplicado:</span>
              <span className="font-mono font-bold">-${order.discount.toFixed(2)}</span>
            </div>
          ) : null}

          {order.pointsRedeemed ? (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Puntos Vitalis canjeados:</span>
              <span className="font-mono font-bold">-{order.pointsRedeemed} pts</span>
            </div>
          ) : null}

          {/* TOTAL DESTACADO */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-2xl p-3 flex justify-between items-center mt-2">
            <div>
              <span className="text-[9px] font-black text-teal-800 uppercase tracking-widest block">TOTAL COMPRA</span>
              <span className="text-[10px] text-teal-600 font-bold">USD (Dólares)</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-teal-950 font-mono">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {order.paymentMethod === 'CASH' && order.cashGiven && (
            <div className="flex justify-between text-[11px] text-slate-500 pt-1 font-semibold px-1">
              <span>Efectivo recibido: ${order.cashGiven.toFixed(2)}</span>
              <span className="text-emerald-700 font-bold">Cambio: ${(order.cashGiven - order.total).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Pie de comprobante con sello de autenticidad */}
        <div className="border-t border-slate-100 pt-3 mt-2 text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-emerald-700 text-[10px] font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            <ShieldCheck size={13} />
            <span>COMPROBANTE ELECTRÓNICO OFICIAL</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500">
            ¡Gracias por confiar en Farmacia Vitalis! 🌿
          </p>
          <p className="text-[9px] text-slate-400 font-mono">
            vitalis.ec • Consultas: 0998506160
          </p>
        </div>
      </div>
    </div>
  );
};
