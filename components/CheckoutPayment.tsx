
import React from 'react';
import { Gift, Sparkles, CheckCircle, Info, Landmark, Copy, Banknote, AlertCircle, Loader2 } from 'lucide-react';
import { CheckoutFormData, Coupon, User, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE } from '../types';

interface CheckoutPaymentProps {
  subtotal: number;
  currentDeliveryFee: number;
  discountAmount: number;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (c: Coupon | null) => void;
  couponCode: string;
  setCouponCode: (s: string) => void;
  handleApplyCoupon: () => void;
  usePoints: boolean;
  setUsePoints: (b: boolean) => void;
  currentUser: User | null;
  pointsAvailable: number;
  earnedInThisOrder: number;
  projectedPoints: number;
  canUsePoints: boolean;
  willReachThreshold: boolean;
  finalBalance: number;
  finalTotal: number;
  formData: CheckoutFormData;
  setFormData: (f: CheckoutFormData) => void;
  cashGiven: string;
  setCashGiven: (s: string) => void;
  changeDue: number;
  handleSubmitOrder: () => void;
  isSubmitting: boolean;
  onBack: () => void;
  selectedCiudadelaName?: string;
}

const CheckoutPayment: React.FC<CheckoutPaymentProps> = (props) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Resumen de Costos */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
        <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${props.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-teal-600 font-bold">
            <span>Envío ({props.selectedCiudadelaName})</span>
            <span>${props.currentDeliveryFee.toFixed(2)}</span>
        </div>
        {props.appliedCoupon && <div className="flex justify-between text-sm text-green-600 font-bold"><span>Cupón</span><span>-${(props.subtotal * (props.appliedCoupon.value / 100)).toFixed(2)}</span></div>}
        {props.usePoints && <div className="flex justify-between text-sm text-purple-600 font-bold"><span>Recompensa Vitalis (500 pts)</span><span>-${POINTS_DISCOUNT_VALUE.toFixed(2)}</span></div>}
        <div className="border-t pt-2 mt-2 flex justify-between items-center"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-xl text-teal-700">${props.finalTotal.toFixed(2)}</span></div>
      </div>

      {/* Sistema de Puntos Vitalis Rewards */}
      {props.currentUser && (
          <div className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${props.canUsePoints ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-100 opacity-80'}`}>
              <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl shadow-sm ${props.canUsePoints ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        <Gift size={24} />
                      </div>
                      <div>
                          <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Vitalis Rewards</p>
                          {props.willReachThreshold ? (
                              <p className="text-[10px] text-purple-600 font-black flex items-center gap-1 uppercase tracking-tighter">
                                  <Sparkles size={12}/> ¡META ALCANZADA CON ESTA COMPRA!
                              </p>
                          ) : (
                              <p className="text-[10px] text-gray-500 font-bold uppercase">
                                  Puntos acumulados: {props.pointsAvailable} pts
                              </p>
                          )}
                      </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <input 
                        type="checkbox" 
                        checked={props.usePoints} 
                        disabled={!props.canUsePoints}
                        onChange={(e) => props.setUsePoints(e.target.checked)}
                        className="h-7 w-7 accent-purple-600 cursor-pointer disabled:cursor-not-allowed rounded-lg"
                    />
                    {props.canUsePoints && <span className="text-[8px] font-black text-purple-600 mt-1 uppercase">ACTIVAR $5.00 OFF</span>}
                  </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-purple-100 pt-3 relative z-10">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ganarás hoy</p>
                      <p className="text-sm font-black text-teal-600">+{props.earnedInThisOrder} PTS</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance Final</p>
                      <p className="text-sm font-black text-purple-700">{props.finalBalance} PTS</p>
                  </div>
              </div>

              {props.usePoints && (
                  <div className="mt-3 bg-purple-600 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-top-2">
                      <CheckCircle size={14}/> Descuento de $5.00 aplicado
                  </div>
              )}
              
              {!props.canUsePoints && (
                  <p className="mt-2 text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Info size={12}/> Te faltan {POINTS_THRESHOLD - props.projectedPoints} puntos para tu próximo vale de $5.
                  </p>
              )}
          </div>
      )}

      {/* Cupones */}
      <div className="flex gap-2">
          <input type="text" placeholder="Código Cupón" className="flex-grow pl-4 pr-4 py-2 border rounded-lg text-sm uppercase outline-none focus:ring-2 focus:ring-teal-500" value={props.couponCode} onChange={(e) => props.setCouponCode(e.target.value)} disabled={!!props.appliedCoupon} />
          {props.appliedCoupon ? (
            <button onClick={() => { props.setAppliedCoupon(null); props.setCouponCode(''); }} className="bg-gray-200 px-3 rounded-lg text-sm font-bold">Quitar</button>
          ) : (
            <button onClick={props.handleApplyCoupon} className="bg-teal-100 text-teal-700 px-4 rounded-lg text-sm font-bold">Aplicar</button>
          )}
      </div>

      {/* Selección de Método de Pago */}
      <div className="grid grid-cols-2 gap-4">
          <button onClick={() => props.setFormData({...props.formData, paymentMethod: 'CASH'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${props.formData.paymentMethod === 'CASH' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200'}`}><Banknote/><span className="font-bold text-sm">Efectivo</span></button>
          <button onClick={() => props.setFormData({...props.formData, paymentMethod: 'TRANSFER'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${props.formData.paymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}><Landmark/><span className="font-bold text-sm">Transferencia</span></button>
      </div>

      {/* Detalles específicos del pago */}
      {props.formData.paymentMethod === 'CASH' && (
         <div className="bg-white p-4 rounded-xl border-2 border-teal-500 mt-3 animate-in fade-in shadow-inner">
             <label className="flex items-center gap-2 text-[10px] font-black text-teal-700 uppercase mb-3 tracking-widest">
                <AlertCircle size={14}/> ¿Con cuánto vas a pagar? (Obligatorio)
             </label>
             <div className="relative">
                 <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-teal-600">$</span>
                 <input 
                    type="number" step="0.01" placeholder="0.00" 
                    className="w-full border-b-2 border-teal-100 pl-6 pb-2 outline-none text-3xl font-black text-slate-800 focus:border-teal-500 transition-colors" 
                    value={props.cashGiven} onChange={(e) => props.setCashGiven(e.target.value)} required
                 />
             </div>
             {props.cashGiven && !isNaN(parseFloat(props.cashGiven)) && (
                 <div className={`mt-3 p-2 rounded-lg text-center font-bold text-sm ${props.changeDue >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                     {props.changeDue >= 0 ? `Tu cambio será: $${props.changeDue.toFixed(2)}` : 'Monto insuficiente'}
                 </div>
             )}
         </div>
      )}

      {props.formData.paymentMethod === 'TRANSFER' && (
         <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mt-3 animate-in fade-in">
             <h4 className="font-bold text-blue-800 mb-3 text-sm flex items-center gap-2"><Landmark size={16}/> Datos Bancarios</h4>
             <div className="space-y-2 text-sm text-gray-700">
                 <div className="flex justify-between border-b border-blue-100 pb-1"><span className="font-semibold text-gray-500">Banco:</span><span className="font-bold">Pichincha</span></div>
                 <div className="flex justify-between border-b border-blue-100 pb-1"><span className="font-semibold text-gray-500">Tipo:</span><span className="font-bold">Cta. Ahorros</span></div>
                 <div className="flex justify-between border-b border-blue-100 pb-1 items-center">
                     <span className="font-semibold text-gray-500">Número:</span> 
                     <div className="flex items-center gap-2">
                        <span className="font-bold select-all">2204665481</span>
                        <button onClick={() => navigator.clipboard.writeText('2204665481')} className="text-blue-500 hover:text-blue-700"><Copy size={12}/></button>
                     </div>
                 </div>
                 <div className="flex justify-between border-b border-blue-100 pb-1"><span className="font-semibold text-gray-500">Nombre:</span><span className="font-bold">Ascencio Carvajal Danny</span></div>
                 <div className="flex justify-between"><span className="font-semibold text-gray-500">RUC/CI:</span><span className="font-bold select-all">1314237148</span></div>
             </div>
             <p className="text-xs text-blue-600 mt-3 italic bg-white p-2 rounded border border-blue-100">* Por favor realiza la transferencia y envía el comprobante al finalizar el pedido.</p>
         </div>
      )}

      {/* Botones de Acción final */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" disabled={props.isSubmitting} onClick={props.onBack} className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold disabled:opacity-50">Atrás</button>
            <button 
                onClick={props.handleSubmitOrder} 
                disabled={props.isSubmitting}
                className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {props.isSubmitting ? <Loader2 className="animate-spin" size={20}/> : 'Confirmar Pedido'}
            </button>
        </div>
    </div>
  );
};

export default CheckoutPayment;
