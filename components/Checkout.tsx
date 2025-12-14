import React, { useState } from 'react';
import { CartItem, DELIVERY_FEE, DELIVERY_CITY } from '../types';
import { CreditCard, Banknote, Truck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe outside of component render to avoid recreating Stripe object on every render
// Replace with your actual public key from environment variables
const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

interface CheckoutProps {
  cart: CartItem[];
  subtotal: number;
  total: number;
  onConfirmOrder: (details: any) => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<{
  total: number, 
  onSuccess: (paymentDetails: any) => void,
  onBack: () => void
}> = ({ total, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardHolder, setCardHolder] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    // In a real backend scenario, you would fetch a clientSecret from your server here.
    // Example: const { clientSecret } = await fetch('/create-payment-intent').then(r => r.json());
    
    // FOR DEMO/FRONTEND-ONLY: We will simulate a successful network request and token creation
    // To make this 100% real, you MUST uncomment the backend call logic and have a Firebase Function.
    
    const cardElement = elements.getElement(CardElement);
    
    if (cardElement) {
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: cardHolder,
            }
        });

        if (error) {
            setError(error.message || 'Error en el pago');
            setProcessing(false);
        } else {
            console.log('[PaymentMethod]', paymentMethod);
            // Simulate processing delay
            setTimeout(() => {
                onSuccess({
                    id: paymentMethod.id,
                    last4: paymentMethod.card?.last4,
                    brand: paymentMethod.card?.brand
                });
                setProcessing(false);
            }, 1500);
        }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Titular</label>
            <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-2 text-sm"
                placeholder="Como aparece en la tarjeta"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                required
            />
        </div>
        <div className="mb-2">
            <label className="block text-xs font-bold text-gray-500 mb-1">Datos de Tarjeta</label>
            <div className="p-3 border border-gray-300 rounded bg-white">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                                color: '#aab7c4',
                            },
                        },
                        invalid: {
                            color: '#9e2146',
                        },
                    },
                }}/>
            </div>
        </div>
        {error && <div className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle className="h-3 w-3"/> {error}</div>}
      </div>

      <div className="flex gap-3">
        <button 
          type="button" 
          onClick={onBack}
          disabled={processing}
          className="w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          Atrás
        </button>
        <button 
          type="submit" 
          disabled={!stripe || processing}
          className="w-2/3 bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition shadow-lg flex justify-center items-center gap-2"
        >
          {processing ? 'Procesando...' : (
              <>
                <Lock className="h-4 w-4" /> Pagar ${total.toFixed(2)}
              </>
          )}
        </button>
      </div>
      <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Pagos procesados de forma segura por Stripe
      </p>
    </form>
  );
};

const Checkout: React.FC<CheckoutProps> = ({ cart, subtotal, total, onConfirmOrder, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Machalilla', // Locked
    paymentMethod: 'TRANSFER' as 'TRANSFER' | 'CARD'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim()) return alert("La dirección es obligatoria");
    setStep(2);
  };

  const handlePaymentSuccess = (paymentDetails: any) => {
      onConfirmOrder({
          ...formData,
          paymentDetails // Include stripe details in order
      });
  };

  const handleTransferSubmit = () => {
      onConfirmOrder(formData);
  };

  if (cart.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 bg-teal-600 text-white rounded-t-xl flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Finalizar Pedido
          </h2>
          <span className="text-teal-100 font-semibold">${total.toFixed(2)}</span>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2">1. Datos de Envío</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Recuerde: Solo realizamos entregas en <span className="font-bold">{DELIVERY_CITY}</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                      <input 
                        required name="name" type="text" value={formData.name} onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <input 
                        required name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección Exacta</label>
                    <input 
                      required name="address" type="text" value={formData.address} onChange={handleInputChange}
                      placeholder="Calle Principal, #Casa, Referencia..."
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                    <input 
                      disabled value={DELIVERY_CITY}
                      className="mt-1 block w-full border border-gray-200 bg-gray-100 rounded-md shadow-sm p-2 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button 
                    type="button" 
                    onClick={onCancel}
                    className="w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                    Cancelar
                    </button>
                    <button 
                    type="submit"
                    className="w-2/3 bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition shadow-lg"
                    >
                    Continuar al Pago
                    </button>
                </div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="font-bold text-gray-700 border-b pb-2">2. Método de Pago</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'TRANSFER'})}
                      className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                        formData.paymentMethod === 'TRANSFER' ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Banknote className="h-8 w-8" />
                      <span className="font-medium">Transferencia</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: 'CARD'})}
                      className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                        formData.paymentMethod === 'CARD' ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard className="h-8 w-8" />
                      <span className="font-medium">Tarjeta</span>
                    </button>
                  </div>

                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                       <span>Subtotal</span>
                       <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                       <span>Envío ({DELIVERY_CITY})</span>
                       <span>${DELIVERY_FEE.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-teal-700 mt-2">
                       <span>Total a Pagar</span>
                       <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {formData.paymentMethod === 'TRANSFER' && (
                    <>
                        <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 border border-blue-200 mb-4">
                        <p className="font-bold mb-2">Datos Bancarios:</p>
                        <p>Banco: Pichincha</p>
                        <p>Cuenta: Ahorros</p>
                        <p>Número: 2200334455</p>
                        <p>Titular: Vitalis S.A.</p>
                        <p className="mt-2 text-xs italic">* Su pedido será procesado una vez confirmada la transferencia.</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                            type="button" 
                            onClick={() => setStep(1)}
                            className="w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                            Atrás
                            </button>
                            <button 
                            onClick={handleTransferSubmit}
                            className="w-2/3 bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition shadow-lg"
                            >
                            Confirmar Pedido
                            </button>
                        </div>
                    </>
                  )}

                  {formData.paymentMethod === 'CARD' && (
                      <Elements stripe={stripePromise}>
                          <CheckoutForm total={total} onSuccess={handlePaymentSuccess} onBack={() => setStep(1)} />
                      </Elements>
                  )}
                  
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;