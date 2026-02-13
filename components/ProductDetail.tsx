
import React, { useState, useEffect } from 'react';
import { Product, CartItem, Subscription } from '../types';
import { X, ShoppingCart, Package, CheckCircle, AlertTriangle, Bell, RefreshCw, Plus, Sparkles, Share2, Check } from 'lucide-react';
import { addStockAlertDB, addSubscriptionDB } from '../services/db';
import { getCrossSellSuggestion } from '../services/gemini';

interface ProductDetailProps {
  product: Product;
  cart: CartItem[];
  products?: Product[]; // Full list for suggestions
  currentUserEmail?: string;
  onClose: () => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, cart, products = [], currentUserEmail, onClose, onAddToCart }) => {
  const [emailAlert, setEmailAlert] = useState(currentUserEmail || '');
  const [alertSent, setAlertSent] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Cross-Sell Logic (Option 5)
  const [suggestion, setSuggestion] = useState<{product: Product | undefined, reason: string} | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
      if (products.length > 0) {
          setLoadingSuggestion(true);
          getCrossSellSuggestion(product, products).then(res => {
              setSuggestion(res);
              setLoadingSuggestion(false);
          });
      }
  }, [product, products]);

  const getReservedStock = () => {
    return cart.reduce((acc, item) => {
      if (item.id !== product.id) return acc;
      const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
      return acc + (item.quantity * unitsPerItem);
    }, 0);
  };

  const reserved = getReservedStock();
  const available = Math.max(0, product.stock - reserved);
  const hasBox = (product.unitsPerBox ?? 0) > 1;
  const unitsPerBox = product.unitsPerBox ?? 1;

  // Priorizamos el publicBoxPrice, si no existe usamos boxPrice como fallback (compatibilidad)
  const displayBoxPrice = product.publicBoxPrice || product.boxPrice || 0;

  const handleStockAlert = async () => {
      if (!emailAlert) return alert("Ingresa tu correo");
      await addStockAlertDB(emailAlert, product.id);
      setAlertSent(true);
  };

  const handleSubscribe = async () => {
      if (!currentUserEmail) return alert("Debes iniciar sesión para suscribirte.");
      const sub: Subscription = {
          id: `sub_${Date.now()}`,
          userId: currentUserEmail,
          productId: product.id,
          productName: product.name,
          frequencyDays: 30,
          nextDelivery: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          active: true
      };
      await addSubscriptionDB(sub);
      setSubscribing(true);
  };

  const handleShare = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set('product', product.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[90vh] relative animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button 
            onClick={handleShare} 
            className={`p-2 rounded-full transition-all shadow-sm backdrop-blur-sm flex items-center gap-1 ${copied ? 'bg-green-500 text-white' : 'bg-white/80 hover:bg-white text-gray-500 hover:text-teal-600'}`}
            title="Copiar enlace"
          >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {copied && <span className="text-[10px] font-bold pr-1">Copiado</span>}
          </button>
          <button onClick={onClose} className="bg-white/80 p-2 rounded-full hover:bg-white text-gray-500 hover:text-red-500 transition-colors shadow-sm backdrop-blur-sm">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="w-full md:w-1/2 bg-gray-100 relative h-64 md:h-auto shrink-0 flex items-center justify-center p-6">
          <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" />
          {available <= 0 && (
             <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                 <span className="bg-red-500 text-white px-6 py-2 font-bold rounded-full text-lg shadow-lg transform -rotate-12 border-2 border-white">AGOTADO</span>
             </div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-5 md:p-10 flex flex-col overflow-y-auto bg-white">
          <div className="mb-auto">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">{product.category}</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{product.name}</h2>
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              {available > 0 ? (
                <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md"><CheckCircle className="h-4 w-4 mr-1" /> Disponible: {available} unid.</span>
              ) : (
                <span className="flex items-center text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md"><AlertTriangle className="h-4 w-4 mr-1" /> Sin Stock</span>
              )}
            </div>

            <p className="text-gray-600 text-base leading-relaxed mb-6 md:mb-8">{product.description}</p>

            {loadingSuggestion ? (
                <div className="mb-6 bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-center gap-2 text-purple-700 text-xs animate-pulse">
                    <Sparkles className="h-4 w-4"/> Buscando recomendación farmacéutica...
                </div>
            ) : suggestion && suggestion.product && (
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-lg p-3 relative overflow-hidden group">
                    <div className="flex items-start gap-3 relative z-10">
                        <img src={suggestion.product.image} className="h-12 w-12 rounded object-cover mix-blend-multiply bg-white border border-gray-100"/>
                        <div className="flex-grow">
                            <p className="text-[10px] font-bold text-purple-600 uppercase flex items-center gap-1"><Sparkles size={10}/> Recomendado para ti</p>
                            <p className="text-sm font-bold text-gray-800 leading-tight">{suggestion.product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 italic">"{suggestion.reason}"</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-purple-700">${suggestion.product.price.toFixed(2)}</span>
                                <button 
                                    onClick={() => { onClose(); onAddToCart(suggestion.product!, 'UNIT'); }} 
                                    className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-purple-700 transition"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {available > 0 ? (
                <div className="space-y-4 pb-20 md:pb-0">
                  <div className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 transition-colors bg-gray-50/50">
                    <div className="flex justify-between items-center mb-3">
                      <div><span className="block text-xs font-bold text-gray-400 uppercase">Precio Unitario</span><span className="text-2xl font-black text-teal-700">${product.price.toFixed(2)}</span></div>
                    </div>
                    <button onClick={() => onAddToCart(product, 'UNIT')} className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20"><ShoppingCart className="h-5 w-5" /> Agregar Unidad</button>
                  </div>

                  {hasBox && displayBoxPrice > 0 && (
                      <div className="p-4 border border-blue-200 rounded-xl hover:border-blue-400 transition-colors bg-blue-50/50">
                          <div className="flex justify-between items-center mb-3">
                              <div>
                                  <span className="block text-xs font-bold text-blue-400 uppercase flex items-center gap-1"><Package className="h-3 w-3"/> Caja x{unitsPerBox} (Ahorro)</span>
                                  <span className="text-2xl font-black text-blue-700">${displayBoxPrice.toFixed(2)}</span>
                              </div>
                          </div>
                          <button 
                              onClick={() => onAddToCart(product, 'BOX')} 
                              disabled={available < unitsPerBox}
                              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg ${available >= unitsPerBox ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                          >
                              <Plus className="h-5 w-5" /> Agregar Caja
                          </button>
                      </div>
                  )}

                  <button 
                    onClick={handleSubscribe} 
                    disabled={subscribing}
                    className="w-full py-2 border-2 border-teal-600 text-teal-700 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-teal-50"
                  >
                     {subscribing ? <CheckCircle size={18}/> : <RefreshCw size={18}/>} 
                     {subscribing ? "Suscrito Mensualmente" : "Suscribirse (Envío cada 30 días)"}
                  </button>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Bell size={18}/> Avísame cuando haya stock</h4>
                    {!alertSent ? (
                        <div className="flex gap-2">
                            <input className="border p-2 rounded text-sm flex-grow" placeholder="Tu correo..." value={emailAlert} onChange={e => setEmailAlert(e.target.value)}/>
                            <button onClick={handleStockAlert} className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-bold">Enviar</button>
                        </div>
                    ) : (
                        <p className="text-sm text-green-600 font-bold">¡Listo! Te avisaremos.</p>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
