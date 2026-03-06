
import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem, DELIVERY_FEE } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  subtotal: number;
  total: number;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen, onClose, cart, updateQuantity, removeFromCart, subtotal, total, onCheckout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300">
            <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-medium text-gray-900">Carrito</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500"><X className="h-6 w-6" /></button>
              </div>

              <div className="mt-8">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">Tu carrito está vacío.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {cart.map((item, idx) => {
                      const isBox = item.selectedUnit === 'BOX';
                      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                      return (
                        <li key={`${item.id}-${idx}`} className={`py-6 flex ${item.price < 0 ? 'bg-purple-50 rounded-xl px-2' : ''}`}>
                          <img src={item.image} className="h-20 w-20 rounded border object-contain mix-blend-multiply bg-white" />
                          <div className="ml-4 flex-1 flex flex-col">
                            <div>
                              <div className="flex justify-between text-base font-medium text-gray-900">
                                <h3 className={`line-clamp-1 ${item.price < 0 ? 'text-purple-700 font-bold' : ''}`}>{item.name}</h3>
                                <p className={`ml-4 shrink-0 ${item.price < 0 ? 'text-purple-700' : ''}`}>${(price * item.quantity).toFixed(2)}</p>
                              </div>
                              {isBox && <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Caja x{item.unitsPerBox}</span>}
                              {item.price < 0 && <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Combo Aplicado</span>}
                            </div>
                            <div className="flex-1 flex items-end justify-between text-sm">
                              {item.price >= 0 ? (
                                <div className="flex items-center border rounded-md">
                                  <button onClick={() => updateQuantity(idx, -1)} className="p-1 hover:bg-gray-100"><Minus className="h-4 w-4" /></button>
                                  <span className="px-3 font-bold">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(idx, 1)} className="p-1 hover:bg-gray-100"><Plus className="h-4 w-4" /></button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-purple-400 font-medium italic">Descuento automático</div>
                              )}
                              <button onClick={() => removeFromCart(idx)} className="text-red-600 font-bold hover:underline">Eliminar</button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-200 py-6 px-4 sm:px-6 bg-gray-50">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-2"><p>Subtotal</p><p>${subtotal.toFixed(2)}</p></div>
                <div className="flex justify-between text-sm text-gray-500 mb-4"><p>Envío</p><p>${DELIVERY_FEE.toFixed(2)}</p></div>
                <div className="flex justify-between text-xl font-bold text-teal-700 mb-6 border-t pt-2"><p>Total</p><p>${total.toFixed(2)}</p></div>
                <button onClick={onCheckout} className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all active:scale-95">Pagar Ahora</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
