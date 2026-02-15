import React, { useState, useEffect } from 'react';
import { CartItem, Ciudadela, DELIVERY_CITY, CheckoutFormData, User, Coupon, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE } from '../types';
import { Truck, X, Banknote, Gift, Landmark, Copy, AlertCircle, MapPin, ChevronDown, Sparkles, Loader2, Info, CheckCircle } from 'lucide-react';
import { streamCoupons, streamCiudadelas } from '../services/db';

interface CheckoutProps {
  cart: CartItem[];
  subtotal: number;
  total: number; 
  onConfirmOrder: (details: CheckoutFormData, discount: number, pointsRedeemed: number) => void;
  onCancel: () => void;
  currentUser: User | null;
}

const Checkout: React.FC<CheckoutProps> = ({ subtotal, total: _rawTotal, onConfirmOrder, onCancel, currentUser }) => {
  const [step, setStep] = useState(1);
  const [ciudadelas, setCiudadelas] = useState<Ciudadela[]>([]);
  const [selectedCiudadela, setSelectedCiudadela] = useState<Ciudadela | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '', phone: '', address: '', city: DELIVERY_CITY, paymentMethod: 'CASH', 
    deliveryFee: 1.00, deliveryZone: 'Machalilla Centro'
  });
  const [cashGiven, setCashGiven] = useState('');
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    if (currentUser) {
        setFormData(prev => ({ ...prev, name: currentUser.displayName || '', phone: currentUser.phone || '', address: currentUser.address || '' }));
    }
    const unsubCoupons = streamCoupons(setCoupons);
    const unsubCiudadelas = streamCiudadelas((data) => {
        setCiudadelas(data);
        if (data.length > 0 && !selectedCiudadela) {
            const defaultZone = data.find(c => c.name.toLowerCase().includes('centro')) || data[0];
            setSelectedCiudadela(defaultZone);
        }
    });
    return () => { unsubCoupons(); unsubCiudadelas(); };
  }, [currentUser]);

  useEffect(() => {
      let d = 0;
      if (appliedCoupon) {
          if (appliedCoupon.type === 'PERCENTAGE') d += subtotal * (appliedCoupon.value / 100);
          else d += Math.min(subtotal, appliedCoupon.value);
      }
      if (usePoints) {
          d += POINTS_DISCOUNT_VALUE;
      }
      setDiscountAmount(d);
  }, [appliedCoupon, usePoints, subtotal]);

  useEffect(() => {
    if (selectedCiudadela) {
        setFormData(prev => ({ 
            ...prev, 
            deliveryFee: selectedCiudadela.price, 
            deliveryZone: selectedCiudadela.name 
        }));
    }
  }, [selectedCiudadela]);

  const currentDeliveryFee = selectedCiudadela?.price || 0;
  const finalTotal = Math.max(0, subtotal + currentDeliveryFee - discountAmount);
  
  // FIX: Added missing changeDue calculation for cash payments
  const changeDue = cashGiven ? parseFloat(cashGiven) - finalTotal : 0;
  
  const pointsAvailable = currentUser?.points || 0;
  const earnedInThisOrder = Math.floor(subtotal);
  const projectedPoints = pointsAvailable + earnedInThisOrder;
  const canUsePoints = pointsAvailable >= POINTS_THRESHOLD;
  const finalBalance = usePoints ? (projectedPoints - POINTS_THRESHOLD) : projectedPoints;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (coupon) {
      setAppliedCoupon(coupon);
    } else {
      alert("Cupón no válido o expirado");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado al portapapeles`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 overflow-hidden">
        
        <div className="p-8 bg-teal-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md"><Truck size={32}/></div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Finalizar Pedido</h2>
                <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest mt-0.5">Machalilla Express 🛵</p>
             </div>
          </div>
          <button onClick={onCancel} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto flex-grow no-scrollbar">
              {step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white p-4 rounded-2xl font-bold outline-none transition-all uppercase" placeholder="¿A quién entregamos?" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular de Contacto</label>
                            <input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white p-4 rounded-2xl font-bold outline-none transition-all" placeholder="Ej: 099..." />
                        </div>
                   </div>
                   
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                           <MapPin size={14} className="text-teal-600"/> Ciudadela / Sector en Machalilla
                       </label>
                       <div className="relative group">
                            <select 
                                className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl p-4 font-black text-slate-800 outline-none group-focus-within:border-teal-500 group-focus-within:bg-white transition-all appearance-none uppercase text-sm"
                                value={selectedCiudadela?.id || ''}
                                onChange={(e) => setSelectedCiudadela(ciudadelas.find(c => c.id === e.target.value) || null)}
                            >
                                {ciudadelas.map(c => (
                                    <option key={c.id} value={c.id}>{c.name.toUpperCase()} (ENVÍO: ${c.price.toFixed(2)})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={24}/>
                       </div>
                   </div>

                   <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referencia Exacta (Calle, Color de Casa)</label>
                        <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white p-4 rounded-2xl font-bold outline-none transition-all" placeholder="Frente a la cancha principal..." />
                   </div>
                   
                   <button onClick={() => { if(!formData.address.trim()) return alert("Referencia requerida"); setStep(2); }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3">
                        CONTINUAR AL PAGO <Sparkles size={18}/>
                   </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 space-y-3">
                    <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs font-black text-teal-600 uppercase tracking-widest">
                        <span>Envío ({selectedCiudadela?.name})</span>
                        <span>+${currentDeliveryFee.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && <div className="flex justify-between text-xs font-black text-purple-600 uppercase tracking-widest"><span>Beneficios Vitalis</span><span>-${discountAmount.toFixed(2)}</span></div>}
                    <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center"><span className="font-black text-slate-900 text-sm uppercase tracking-[0.1em]">Total Final</span><span className="font-black text-4xl text-teal-700 tracking-tighter">${finalTotal.toFixed(2)}</span></div>
                  </div>

                  {currentUser && (
                      <div className={`p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${canUsePoints ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                          <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-4">
                                  <div className={`p-4 rounded-2xl shadow-lg ${canUsePoints ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-slate-300 text-white'}`}><Gift size={28} /></div>
                                  <div>
                                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Vitalis Rewards</p>
                                      <p className="text-[10px] text-purple-600 font-bold uppercase">{pointsAvailable} Puntos acumulados</p>
                                  </div>
                              </div>
                              <input type="checkbox" checked={usePoints} disabled={!canUsePoints} onChange={(e) => setUsePoints(e.target.checked)} className="h-8 w-8 accent-purple-600 cursor-pointer rounded-xl" />
                          </div>
                          {!canUsePoints && <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Info size={12}/> Te faltan {POINTS_THRESHOLD - pointsAvailable} pts para tu próximo cupón de $5.</p>}
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setFormData({...formData, paymentMethod: 'CASH'})} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${formData.paymentMethod === 'CASH' ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-xl shadow-teal-100 scale-105' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}><Banknote size={32}/><span className="font-black text-xs uppercase tracking-widest">Efectivo</span></button>
                      <button onClick={() => setFormData({...formData, paymentMethod: 'TRANSFER'})} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${formData.paymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xl shadow-blue-100 scale-105' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}><Landmark size={32}/><span className="font-black text-xs uppercase tracking-widest">Banco</span></button>
                  </div>

                  {formData.paymentMethod === 'CASH' && (
                     <div className="bg-teal-50 p-6 rounded-[2rem] border-2 border-teal-500 animate-in zoom-in-95">
                         <label className="flex items-center gap-2 text-[10px] font-black text-teal-700 uppercase mb-4 tracking-[0.15em]"><AlertCircle size={16}/> ¿Con cuánto pagarás hoy?</label>
                         <div className="relative">
                             <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black text-teal-600">$</span>
                             <input type="number" step="0.01" className="w-full bg-transparent border-b-4 border-teal-200 pl-8 pb-2 outline-none text-5xl font-black text-slate-900 tabular-nums focus:border-teal-500 transition-all" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} required />
                         </div>
                         {cashGiven && !isNaN(parseFloat(cashGiven)) && (
                             <div className={`mt-5 p-3 rounded-2xl text-center font-black text-sm uppercase tracking-widest ${changeDue >= 0 ? 'bg-white text-teal-700' : 'bg-red-100 text-red-700'}`}>
                                 {changeDue >= 0 ? `Tu cambio: $${changeDue.toFixed(2)}` : 'Monto insuficiente'}
                             </div>
                         )}
                     </div>
                  )}

                  {formData.paymentMethod === 'TRANSFER' && (
                     <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-200 animate-in zoom-in-95 space-y-4">
                         <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                             <div>
                                 <h4 className="font-black text-blue-800 text-sm uppercase tracking-tight">Banco Pichincha</h4>
                                 <p className="text-[10px] text-blue-600 font-bold uppercase">Cta. Ahorros</p>
                             </div>
                             <button onClick={() => copyToClipboard('2204665481', 'Número de cuenta')} className="p-3 bg-white text-blue-600 rounded-2xl shadow-md active:scale-90 transition-transform"><Copy size={18}/></button>
                         </div>
                         <div className="space-y-1.5">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Cuenta:</p>
                             <p className="text-2xl font-black text-slate-900 tracking-tighter">2204665481</p>
                         </div>
                         <div className="space-y-1.5">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular:</p>
                             <p className="text-sm font-black text-slate-800 uppercase">Ascencio Carvajal Danny</p>
                             <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">CI: 1314237148</p>
                         </div>
                         <p className="text-[10px] text-blue-700 font-black uppercase text-center bg-white/50 p-2 rounded-xl border border-blue-100">Por favor envía el comprobante por WhatsApp</p>
                     </div>
                  )}

                  <div className="flex gap-4 mt-8">
                        <button type="button" disabled={isSubmitting} onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Atrás</button>
                        <button 
                            onClick={async () => {
                                if (formData.paymentMethod === 'CASH' && (!cashGiven || parseFloat(cashGiven) < finalTotal)) return alert("Revisa el monto de pago.");
                                setIsSubmitting(true);
                                try { await onConfirmOrder(formData, discountAmount, usePoints ? POINTS_THRESHOLD : 0); } 
                                finally { setIsSubmitting(false); }
                            }} 
                            disabled={isSubmitting}
                            className="flex-[2] bg-teal-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <><CheckCircle size={20}/> HACER PEDIDO</>}
                        </button>
                    </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;