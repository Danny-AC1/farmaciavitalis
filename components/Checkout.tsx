import React, { useState } from 'react';
import { CartItem, DELIVERY_FEE, DELIVERY_CITY, CheckoutFormData } from '../types';
import { Truck, AlertCircle, MessageCircle, Landmark, X, Banknote } from 'lucide-react';

interface CheckoutProps {
  cart: CartItem[];
  subtotal: number;
  total: number;
  onConfirmOrder: (details: CheckoutFormData) => void;
  onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cart, subtotal, total, onConfirmOrder, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    address: '',
    city: DELIVERY_CITY,
    paymentMethod: 'CASH' // Por defecto Efectivo
  });
  
  // Estado para calcular vuelto en efectivo
  const [cashGiven, setCashGiven] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim()) return alert("La dirección es obligatoria");
    setStep(2);
  };

  const handleSubmitOrder = () => {
    // Incluimos el cashGiven en los datos que enviamos al padre (App.tsx)
    const finalData = {
        ...formData,
        cashGiven: cashGiven // Enviamos el string del input
    };
    onConfirmOrder(finalData);
  };

  const changeDue = cashGiven ? parseFloat(cashGiven) - total : 0;

  if (cart.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 bg-teal-600 text-white rounded-t-xl flex justify-between items-center shrink-0 shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Finalizar Compra
          </h2>
          <button onClick={onCancel} className="text-teal-100 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-5">
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                     <h3 className="font-bold text-gray-700 text-lg">1. Datos de Envío</h3>
                     <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Paso 1 de 2</span>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-800">
                          Solo realizamos entregas dentro de <span className="font-bold">{DELIVERY_CITY}, Manabí</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                      <input 
                        required 
                        name="name" 
                        type="text" 
                        value={formData.name} 
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono Móvil</label>
                      <input 
                        required 
                        name="phone" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={handleInputChange}
                        placeholder="Ej. 0991234567"
                        className="w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Dirección de Entrega</label>
                    <input 
                      required 
                      name="address" 
                      type="text" 
                      value={formData.address} 
                      onChange={handleInputChange}
                      placeholder="Ej. Barrio Central, Calle 10, Casa Azul"
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad</label>
                    <input 
                      disabled 
                      value={DELIVERY_CITY}
                      className="w-full border border-gray-200 bg-gray-50 rounded-lg shadow-sm p-2.5 text-gray-500 cursor-not-allowed font-bold"
                    />
                  </div>

                  <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={onCancel}
                      className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition shadow-sm"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg transform active:scale-95"
                    >
                      Siguiente
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b pb-2">
                     <h3 className="font-bold text-gray-700 text-lg">2. Confirmación de Pago</h3>
                     <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2 py-1 rounded-full">Paso 2 de 2</span>
                  </div>

                  {/* Resumen */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                       <span>Subtotal ({cart.length} ítems)</span>
                       <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                       <span>Envío a Domicilio</span>
                       <span>${DELIVERY_FEE.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                       <span className="font-bold text-gray-800">Total a Pagar</span>
                       <span className="font-bold text-xl text-teal-700">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Selección de Método de Pago */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Selecciona Método de Pago:</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, paymentMethod: 'CASH'})}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                formData.paymentMethod === 'CASH' 
                                ? 'border-teal-500 bg-teal-50 text-teal-700' 
                                : 'border-gray-200 hover:border-teal-200 text-gray-600'
                            }`}
                        >
                            <Banknote className="h-6 w-6" />
                            <span className="font-bold">Efectivo</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, paymentMethod: 'TRANSFER'})}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                formData.paymentMethod === 'TRANSFER' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 hover:border-blue-200 text-gray-600'
                            }`}
                        >
                            <Landmark className="h-6 w-6" />
                            <span className="font-bold">Transferencia</span>
                        </button>
                    </div>
                  </div>

                  {/* Detalle Efectivo */}
                  {formData.paymentMethod === 'CASH' && (
                     <div className="bg-teal-50 p-5 rounded-xl border border-teal-200 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                            <Banknote className="h-5 w-5"/> Pago contra entrega
                        </h4>
                        <p className="text-sm text-teal-700 mb-4">
                            Pagas en efectivo al momento de recibir tu pedido.
                        </p>
                        
                        <div className="bg-white p-3 rounded-lg border border-teal-100">
                             <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">¿Con cuánto vas a pagar? (Opcional)</label>
                             <input 
                                type="number"
                                placeholder="Ej. 20"
                                className="w-full border-b border-gray-300 pb-1 focus:border-teal-500 outline-none text-lg font-bold text-gray-800"
                                value={cashGiven}
                                onChange={(e) => setCashGiven(e.target.value)}
                             />
                             {cashGiven && !isNaN(parseFloat(cashGiven)) && (
                                 <div className="mt-2 flex justify-between items-center text-sm">
                                     <span className="font-medium text-gray-600">Su cambio será:</span>
                                     <span className={`font-bold ${changeDue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                         ${changeDue >= 0 ? changeDue.toFixed(2) : 'Falta dinero'}
                                     </span>
                                 </div>
                             )}
                        </div>
                     </div>
                  )}

                  {/* Detalle Transferencia */}
                  {formData.paymentMethod === 'TRANSFER' && (
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4 border-b border-blue-200 pb-2">
                            <h4 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                                <Landmark className="h-5 w-5"/> Transferencia Bancaria
                            </h4>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-2 items-center">
                                <span className="text-gray-500 font-medium col-span-1">Banco:</span>
                                <span className="font-bold text-gray-800 col-span-2">Banco Pichincha</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 items-center">
                                <span className="text-gray-500 font-medium col-span-1">Tipo Cuenta:</span>
                                <span className="font-bold text-gray-800 col-span-2">Ahorros</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded border border-blue-100 shadow-sm">
                                <span className="text-gray-500 font-medium col-span-1">Número:</span>
                                <span className="font-mono font-bold text-lg text-blue-700 col-span-2 tracking-widest">2204662481</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 items-center">
                                <span className="text-gray-500 font-medium col-span-1">Titular:</span>
                                <span className="font-bold text-gray-800 col-span-2">Ascencio Carvajal Danny</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 items-center">
                                <span className="text-gray-500 font-medium col-span-1">RUC:</span>
                                <span className="font-bold text-gray-800 col-span-2">1314237148001</span>
                            </div>
                        </div>
                        
                        <div className="mt-5 flex gap-3 bg-white/60 p-3 rounded-lg border border-blue-100 items-start">
                            <MessageCircle className="h-6 w-6 text-green-600 shrink-0 mt-1" />
                            <div className="text-xs text-blue-900 leading-relaxed">
                                <p className="font-bold mb-1">Pasos:</p>
                                <ol className="list-decimal pl-4 space-y-1">
                                    <li>Realiza la transferencia por el total exacto.</li>
                                    <li>Haz clic en "Confirmar Pedido".</li>
                                    <li>Envía el comprobante a nuestro WhatsApp "0998506160".</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button 
                          type="button" 
                          onClick={() => setStep(1)}
                          className="w-1/3 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition shadow-sm"
                        >
                          Atrás
                        </button>
                        <button 
                          onClick={handleSubmitOrder}
                          className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg transform active:scale-95 flex items-center justify-center gap-2"
                        >
                          Confirmar Pedido
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