import React, { useState, useEffect } from 'react';
import { CartItem, DELIVERY_FEE, DELIVERY_CITY, CheckoutFormData, User, Coupon, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE } from '../types';
import { Truck, X, Banknote, Gift, Landmark } from 'lucide-react';
import { streamCoupons } from '../services/db';

interface CheckoutProps {
  cart: CartItem[];
  subtotal: number;
  total: number; 
  onConfirmOrder: (details: CheckoutFormData, discount: number, pointsRedeemed: number) => void;
  onCancel: () => void;
  currentUser: User | null;
}

const Checkout: React.FC<CheckoutProps> = ({ subtotal, total: rawTotal, onConfirmOrder, onCancel, currentUser }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '', phone: '', address: '', city: DELIVERY_CITY, paymentMethod: 'CASH'
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
    const unsub = streamCoupons((data) => setCoupons(data));
    return () => unsub();
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

  const handleApplyCoupon = () => {
      const code = couponCode.trim().toUpperCase();
      if (!code) return;
      const coupon = coupons.find(c => c.code === code && c.active);
      if (coupon) setAppliedCoupon(coupon); else { alert("Cupón inválido"); setAppliedCoupon(null); }
  };

  const finalTotal = Math.max(0, rawTotal - discountAmount);
  const pointsAvailable = currentUser?.points || 0;
  const canUsePoints = pointsAvailable >= POINTS_THRESHOLD;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleNextStep = (e: React.FormEvent) => { e.preventDefault(); if (!formData.address.trim()) return alert("Dirección requerida"); setStep(2); };

  const handleSubmitOrder = () => {
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
                   {/* ... Same inputs as before ... */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label><input required name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label><input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" /></div>
                   </div>
                   <div><label className="block text-sm font-semibold text-gray-700 mb-1">Dirección</label><input required name="address" value={formData.address} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" /></div>
                   <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onCancel} className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold">Cancelar</button>
                    <button type="submit" className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg">Siguiente</button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Envío</span><span>${DELIVERY_FEE.toFixed(2)}</span></div>
                    {appliedCoupon && <div className="flex justify-between text-sm text-green-600 font-bold"><span>Cupón</span><span>-${(subtotal * (appliedCoupon.value / 100)).toFixed(2)}</span></div>}
                    {usePoints && <div className="flex justify-between text-sm text-purple-600 font-bold"><span>Puntos ({POINTS_THRESHOLD})</span><span>-${POINTS_DISCOUNT_VALUE.toFixed(2)}</span></div>}
                    <div className="border-t pt-2 mt-2 flex justify-between items-center"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-xl text-teal-700">${finalTotal.toFixed(2)}</span></div>
                  </div>

                  {/* LOYALTY POINTS OPTION */}
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

                   {/* Coupon Input */}
                  <div className="flex gap-2">
                      <input type="text" placeholder="Código Cupón" className="flex-grow pl-4 pr-4 py-2 border rounded-lg text-sm uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={!!appliedCoupon} />
                      {appliedCoupon ? <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-gray-200 px-3 rounded-lg text-sm font-bold">Quitar</button> : <button onClick={handleApplyCoupon} className="bg-teal-100 text-teal-700 px-4 rounded-lg text-sm font-bold">Aplicar</button>}
                  </div>

                  {/* Payment Methods */}
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setFormData({...formData, paymentMethod: 'CASH'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.paymentMethod === 'CASH' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200'}`}><Banknote/><span className="font-bold">Efectivo</span></button>
                      <button onClick={() => setFormData({...formData, paymentMethod: 'TRANSFER'})} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${formData.paymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}><Landmark/><span className="font-bold">Transferencia</span></button>
                  </div>

                  {formData.paymentMethod === 'CASH' && (
                     <div className="bg-white p-3 rounded-lg border border-teal-100 mt-3">
                         <input type="number" placeholder="¿Con cuánto pagas?" className="w-full border-b pb-1 outline-none text-lg font-bold" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} />
                         {cashGiven && !isNaN(parseFloat(cashGiven)) && <p className={`mt-2 font-bold text-sm ${changeDue >= 0 ? 'text-green-600' : 'text-red-500'}`}>Cambio: ${changeDue >= 0 ? changeDue.toFixed(2) : 'Insuficiente'}</p>}
                     </div>
                  )}

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold">Atrás</button>
                        <button onClick={handleSubmitOrder} className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg">Confirmar Pedido</button>
                    </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;