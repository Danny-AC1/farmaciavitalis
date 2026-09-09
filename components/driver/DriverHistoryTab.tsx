import React, { useState } from 'react';
import { Order } from '../../types';
import { 
  CheckCircle2, Clock, MapPin, Package, DollarSign, 
  Camera, ShieldCheck, Image as ImageIcon, X 
} from 'lucide-react';

interface DriverHistoryTabProps {
  deliveredOrders: Order[];
  onOpenLiquidation?: () => void;
}

export const DriverHistoryTab: React.FC<DriverHistoryTabProps> = ({ 
  deliveredOrders, 
  onOpenLiquidation 
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const totalMoneyCollected = deliveredOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalCash = deliveredOrders
    .filter(o => o.paymentMethod === 'CASH')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalTransfer = deliveredOrders
    .filter(o => o.paymentMethod !== 'CASH')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Resumen de Recaudación y Botón de Liquidación */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Recaudación de Turno Hoy
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {deliveredOrders.length} pedidos entregados
            </p>
          </div>

          {onOpenLiquidation && deliveredOrders.length > 0 && (
            <button
              onClick={onOpenLiquidation}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DollarSign size={14} />
              <span>Cuadre de Turno</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Total</span>
            <span className="text-base font-black text-slate-900 tabular-nums">${totalMoneyCollected.toFixed(2)}</span>
          </div>
          <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider block mb-0.5">Efectivo</span>
            <span className="text-base font-black text-orange-700 tabular-nums">${totalCash.toFixed(2)}</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider block mb-0.5">Transfer</span>
            <span className="text-base font-black text-blue-700 tabular-nums">${totalTransfer.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos Entregados */}
      {deliveredOrders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-[2rem] border border-slate-100 p-8">
          <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-10 w-10 text-slate-400" />
          </div>
          <p className="font-black uppercase tracking-widest text-xs text-slate-700">Sin entregas completadas hoy</p>
          <p className="text-[11px] font-medium mt-1 text-slate-400">
            Los pedidos que entregues hoy con su comprobante aparecerán en este registro.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[1.8rem] shadow-sm overflow-hidden border border-slate-200/80 p-5 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-8 w-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black shrink-0">
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 uppercase leading-none">
                      {order.customerName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-teal-700 tabular-nums">${order.total.toFixed(2)}</span>
                  <span className={`block text-[9px] font-black uppercase px-2 py-0.5 rounded mt-0.5 ${
                    order.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '🏦 Transfer'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 font-medium flex items-start gap-2">
                <MapPin size={14} className="text-red-400 shrink-0 mt-0.5" />
                <span className="uppercase text-[11px] leading-tight">{order.customerAddress}</span>
              </div>

              {/* Comprobantes adjuntos (Foto de Entrega & Voucher) */}
              {(order.deliveryProofPhoto || order.paymentProofPhoto || order.driverNotes) && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.deliveryProofPhoto && (
                      <button
                        onClick={() => setSelectedPhoto(order.deliveryProofPhoto!)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-[10px] font-bold hover:bg-teal-100 transition-colors cursor-pointer"
                      >
                        <Camera size={12} className="text-teal-600" />
                        <span>Ver Foto Entrega</span>
                      </button>
                    )}

                    {order.paymentProofPhoto && (
                      <button
                        onClick={() => setSelectedPhoto(order.paymentProofPhoto!)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        <ImageIcon size={12} className="text-blue-600" />
                        <span>Ver Comprobante Transfer</span>
                      </button>
                    )}

                    {order.deliveryOtp && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[9px] font-mono font-bold">
                        <ShieldCheck size={11} className="text-emerald-600" />
                        OTP: {order.deliveryOtp}
                      </span>
                    )}
                  </div>

                  {order.driverNotes && (
                    <p className="text-[11px] text-slate-600 italic">
                      Nota de entrega: "{order.driverNotes}"
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {order.deliveredAt 
                    ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                </span>
                <span className="text-emerald-600 font-black">Entrega Completada</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal visor de foto ampliada con sello de agua */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full border border-white/10 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-white/10">
              <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Camera size={14} className="text-teal-400" /> Comprobante Digital (POD)
              </span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2">
              <img 
                src={selectedPhoto} 
                alt="Comprobante con sello de agua" 
                className="w-full max-h-[75vh] object-contain rounded-2xl bg-black"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
