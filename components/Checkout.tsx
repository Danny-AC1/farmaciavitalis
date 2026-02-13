
import React, { useState, useEffect } from 'react';
import { CartItem, Ciudadela, DELIVERY_CITY, CheckoutFormData, User, Coupon, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE } from '../types';
import { Truck, X, Banknote, Gift, Landmark, Copy, AlertCircle, MapPin, ChevronDown } from 'lucide-react';
import { streamCoupons, streamCiudadelas } from '../services/db';

interface CheckoutProps {
  cart: CartItem[];
  subtotal: number;
  total: number; 
  onConfirmOrder: (details: CheckoutFormData, discount: number, pointsRedeemed: number) => void;
  onCancel: () => void;
  currentUser: User | null;
}

const Checkout: React.FC<CheckoutProps> = ({ subtotal, total: rawTotalNoDelivery, onConfirmOrder, onCancel, currentUser }) => {
  const [step, setStep] = useState(1);
  const [ciudadelas, setCiudadelas] = useState<Ciudadela[]>([]);
  const [selectedCiudadela, setSelectedCiudadela] = useState<Ciudadela | null>(null);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '', phone: '', address: '', city: DELIVERY_CITY, paymentMethod: 'CASH', 
    deliveryFee: 1.00, deliveryZone: 'Machalilla Centro'
  });
  const [cashGiven, setCashGiven] = useState('');
  
  // Coupons & Points
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
            // Intentar buscar "Ciriales" por defecto si existe, sino la primera
            const defaultZone = data.find(c => c.name.toLowerCase().includes('cirial')) || data[0];
            setSelectedCiudadela(defaultZone);
        }
    });
    return () => { unsubCoupons(); unsubCiudadelas(); };
  }, [currentUser]);

  // Recalculate discount
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

  // Update delivery fee in formData when zone changes
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
  const pointsAvailable = currentUser?.points || 0;
  const canUsePoints = pointsAvailable >= POINTS_THRESHOLD;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleNextStep = (e: React.FormEvent) => { e.preventDefault(); if (!formData.address.trim()) return alert("Dirección requerida"); setStep(2); };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (coupon) {
      setAppliedCoupon(coupon);
    } else {
      alert("Cupón no válido o expirado");
    }
  };

  const handleSubmitOrder = () => {
    if (formData.paymentMethod === 'CASH') {
        const cashValue = parseFloat(cashGiven);
        if (!cashGiven || isNaN(cashValue)) {
            alert("Por favor, ingresa con cuánto vas a pagar. Es obligatorio para pagos en efectivo.");
            return;
        }
        if (cashValue < finalTotal) {
            alert(`El monto ($${cashValue.toFixed(2)}) es menor al total del pedido ($${finalTotal.toFixed(2)}).`);
            return;
        }
    }

    onConfirmOrder(
        { ...formData, cashGiven: cashGiven }, 
        discountAmount, 
        usePoints ? POINTS_THRESHOLD : 0
    );
  };

  const changeDue = cashGiven ? parseFloat(cashGiven) - finalTotal : 0;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-teal-600 text-white rounded-t-xl flex justify-between items-center shrink-0 shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="h-6 w-6" /> Finalizar Compra</h2>
          <button onClick={onCancel} className="text-teal-100 hover:text-white"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-5">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label><input required name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label><input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" /></div>
                   </div>
                   
                   {/* NUEVO SELECTOR DE CIUDADELA */}
                   <div className="space-y-2">
                       <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                           <MapPin size={16} className="text-teal-600"/> Ciudadela / Sector en Machalilla
                       </label>
                       <div className="relative">
                            <select 
                                className="w-full border-2 border-teal-50 bg-slate-50 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-teal-500 transition-all appearance-none"
                                value={selectedCiudadela?.id || ''}
                                onChange={(e) => setSelectedCiudadela(ciudadelas.find(c => c.id === e.target.value) || null)}
                            >
                                {ciudadelas.map(c => (
                                    <option key={c.id} value={c.id}>{c.name.toUpperCase()} (Envío: ${c.price.toFixed(2)})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20}/>
                       </div>
                   </div>

                   <div><label className="block text-sm font-semibold text-gray-700 mb-1">Calle y Referencia Exacta</label><input required name="address" value={formData.address} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ej: Frente a la cancha principal, casa color crema" /></div>
                   
                   <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onCancel} className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold">Cancelar</button>
                    <button type="submit" className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg transition-transform active:scale-95">Elegir Método de Pago</button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-teal-600 font-bold">
                        <span>Envío ({selectedCiudadela?.name})</span>
                        <span>${currentDeliveryFee.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && <div className="flex justify-between text-sm text-green-600 font-bold"><span>Cupón</span><span>-${(subtotal * (appliedCoupon.value / 100)).toFixed(2)}</span></div>}
                    {usePoints && <div className="flex justify-between text-sm text-purple-600 font-bold"><span>Puntos ({POINTS_THRESHOLD})</span><span>-${POINTS_DISCOUNT_VALUE.toFixed(2)}</span></div>}
                    <div className="border-t pt-2 mt-2 flex justify-between items-center"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-xl text-teal-700">${finalTotal.toFixed(2)}</span></div>
                  </div>

                  {currentUser && (
                      <div className={`p-4 rounded-lg border flex items-center justify-between ${canUsePoints ? 'bg-purple-50 border-purple-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                          <div className="flex items-center gap-2">
                              <Gift className="text-purple-600 h-5 w-5" />
                              <div>
                                  <p className="font-bold text-gray-800 text-sm">Vitalis Puntos</p>
                                  <p className="text-xs text-gray-500">Tienes {pointsAvailable} puntos. Canjea {POINTS_THRESHOLD} por $5.</p>
                              </div>
                          </div>
                          <input 
                              type="checkbox" 
                              checked={usePoints} 
                              disabled={!canUsePoints}
                              onChange={(e) => setUsePoints(e.target.checked)}
                              className="h-5 w-5 accent-purple-600"
                          />
                      </div>
                  )}

                  <div className="flex gap-2">
                      <input type="text" placeholder="Código Cupón" className="flex-grow pl-4 pr-4 py-2 border rounded-lg text-sm uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={!!appliedCoupon} />
                      {appliedCoupon ? <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-gray-200 px-3 rounded-lg text-sm font-bold">Quitar</button> : <button onClick={handleApplyCoupon} className="bg-teal-100 text-teal-700 px-4 rounded-lg text-sm font-bold">Aplicar</button>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setFormData({...formData, paymentMethod: 'CASH'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'CASH' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200'}`}><Banknote/><span className="font-bold">Efectivo</span></button>
                      <button onClick={() => setFormData({...formData, paymentMethod: 'TRANSFER'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}><Landmark/><span className="font-bold">Transferencia</span></button>
                  </div>

                  {formData.paymentMethod === 'CASH' && (
                     <div className="bg-white p-4 rounded-xl border-2 border-teal-500 mt-3 animate-in fade-in shadow-inner">
                         <label className="flex items-center gap-2 text-[10px] font-black text-teal-700 uppercase mb-3 tracking-widest">
                            <AlertCircle size={14}/> ¿Con cuánto vas a pagar? (Obligatorio)
                         </label>
                         <div className="relative">
                             <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-teal-600">$</span>
                             <input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00" 
                                className="w-full border-b-2 border-teal-100 pl-6 pb-2 outline-none text-3xl font-black text-slate-800 focus:border-teal-500 transition-colors" 
                                value={cashGiven} 
                                onChange={(e) => setCashGiven(e.target.value)} 
                                required
                             />
                         </div>
                         {cashGiven && !isNaN(parseFloat(cashGiven)) && (
                             <div className={`mt-3 p-2 rounded-lg text-center font-bold text-sm ${changeDue >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                 {changeDue >= 0 ? `Tu cambio será: $${changeDue.toFixed(2)}` : 'Monto insuficiente'}
                             </div>
                         )}
                     </div>
                  )}

                  {formData.paymentMethod === 'TRANSFER' && (
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mt-3 animate-in fade-in">
                         <h4 className="font-bold text-blue-800 mb-3 text-sm flex items-center gap-2">
                             <Landmark size={16}/> Datos Bancarios
                         </h4>
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
                         <p className="text-xs text-blue-600 mt-3 italic bg-white p-2 rounded border border-blue-100">
                             * Por favor realiza la transferencia y envía el comprobante al finalizar el pedido.
                         </p>
                     </div>
                  )}

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold">Atrás</button>
                        <button onClick={handleSubmitOrder} className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all active:scale-95">Confirmar Pedido</button>
                    </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
