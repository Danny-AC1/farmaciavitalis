
import React, { useState, useEffect } from 'react';
import { CartItem, Ciudadela, DELIVERY_CITY, CheckoutFormData, User, Coupon, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE } from '../types';
import { Truck, X } from 'lucide-react';
import { streamCoupons, streamCiudadelas } from '../services/db';
import CheckoutForm from './CheckoutForm';
import CheckoutPayment from './CheckoutPayment';

interface CheckoutProps {
  cart: CartItem[];
  subtotal: number;
  total: number; 
  onConfirmOrder: (details: CheckoutFormData, discount: number, pointsRedeemed: number) => void;
  onCancel: () => void;
  currentUser: User | null;
}

const Checkout: React.FC<CheckoutProps> = ({ subtotal, onConfirmOrder, onCancel, currentUser }) => {
  const [step, setStep] = useState(1);
  const [ciudadelas, setCiudadelas] = useState<Ciudadela[]>([]);
  const [selectedCiudadela, setSelectedCiudadela] = useState<Ciudadela | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '', phone: '', address: '', city: DELIVERY_CITY, paymentMethod: 'CASH', 
    deliveryFee: 1.00, deliveryZone: 'Machalilla Centro',
    lat: undefined, lng: undefined
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
        setFormData(prev => ({ 
          ...prev, 
          name: currentUser.displayName || '', 
          phone: currentUser.phone || '', 
          address: currentUser.address || '' 
        }));
    }
    const unsubCoupons = streamCoupons(setCoupons);
    const unsubCiudadelas = streamCiudadelas((data) => {
        setCiudadelas(data);
        if (data.length > 0 && !selectedCiudadela) {
            const defaultZone = data.find(c => c.name.toLowerCase().includes('cirial')) || data[0];
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
  
  // Lógica de Puntos Proyectados
  const pointsAvailable = currentUser?.points || 0;
  const earnedInThisOrder = Math.floor(subtotal);
  const projectedPoints = pointsAvailable + earnedInThisOrder;
  const canUsePoints = projectedPoints >= POINTS_THRESHOLD;
  const willReachThreshold = pointsAvailable < POINTS_THRESHOLD && projectedPoints >= POINTS_THRESHOLD;
  const finalBalance = usePoints ? (projectedPoints - POINTS_THRESHOLD) : projectedPoints;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleNextStep = (e: React.FormEvent) => { e.preventDefault(); if (!formData.address.trim()) return alert("Dirección requerida"); setStep(2); };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (coupon) setAppliedCoupon(coupon);
    else alert("Cupón no válido o expirado");
  };

  const handleSubmitOrder = async () => {
    if (formData.paymentMethod === 'CASH') {
        const cashValue = parseFloat(cashGiven);
        if (!cashGiven || isNaN(cashValue)) { alert("Por favor, ingresa con cuánto vas a pagar."); return; }
        if (cashValue < finalTotal) { alert(`El monto es menor al total del pedido.`); return; }
    }

    setIsSubmitting(true);
    try {
        await onConfirmOrder(
            { ...formData, cashGiven: cashGiven }, 
            discountAmount, 
            usePoints ? POINTS_THRESHOLD : 0
        );
    } finally {
        setIsSubmitting(false);
    }
  };

  const changeDue = cashGiven ? parseFloat(cashGiven) - finalTotal : 0;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-teal-600 text-white rounded-t-3xl flex justify-between items-center shrink-0 shadow-md">
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter"><Truck className="h-6 w-6" /> Finalizar Pedido</h2>
          <button onClick={onCancel} className="text-teal-100 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow no-scrollbar">
          {step === 1 ? (
            <CheckoutForm 
              formData={formData}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
              ciudadelas={ciudadelas}
              selectedCiudadela={selectedCiudadela}
              setSelectedCiudadela={setSelectedCiudadela}
              onCancel={onCancel}
              onNextStep={handleNextStep}
            />
          ) : (
            <CheckoutPayment 
              subtotal={subtotal}
              currentDeliveryFee={currentDeliveryFee}
              discountAmount={discountAmount}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              handleApplyCoupon={handleApplyCoupon}
              usePoints={usePoints}
              setUsePoints={setUsePoints}
              currentUser={currentUser}
              pointsAvailable={pointsAvailable}
              earnedInThisOrder={earnedInThisOrder}
              projectedPoints={projectedPoints}
              canUsePoints={canUsePoints}
              willReachThreshold={willReachThreshold}
              finalBalance={finalBalance}
              finalTotal={finalTotal}
              formData={formData}
              setFormData={setFormData}
              cashGiven={cashGiven}
              setCashGiven={setCashGiven}
              changeDue={changeDue}
              handleSubmitOrder={handleSubmitOrder}
              isSubmitting={isSubmitting}
              onBack={() => setStep(1)}
              selectedCiudadelaName={selectedCiudadela?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
