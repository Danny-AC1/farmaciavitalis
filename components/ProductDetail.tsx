import React from 'react';
import { Product, CartItem } from '../types';
import { X, ShoppingCart, Package, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  cart: CartItem[];
  onClose: () => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, cart, onClose, onAddToCart }) => {
  // Calcular stock disponible considerando lo que ya está en el carrito
  const getReservedStock = () => {
    return cart.reduce((acc, item) => {
      if (item.id !== product.id) return acc;
      const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
      return acc + (item.quantity * unitsPerItem);
    }, 0);
  };

  const reserved = getReservedStock();
  const available = Math.max(0, product.stock - reserved);
  const hasBox = product.unitsPerBox && product.unitsPerBox > 1;
  const unitsPerBox = product.unitsPerBox || 9999;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full hover:bg-white text-gray-500 hover:text-red-500 transition-colors shadow-sm backdrop-blur-sm"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-100 relative h-64 md:h-auto flex items-center justify-center p-6">
          <img 
            src={product.image} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" 
          />
          {available <= 0 && (
             <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                 <span className="bg-red-500 text-white px-6 py-2 font-bold rounded-full text-lg shadow-lg transform -rotate-12 border-2 border-white">AGOTADO</span>
             </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto bg-white">
          <div className="mb-auto">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              {product.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
              {product.name}
            </h2>
            <div className="flex items-center gap-2 mb-6">
              {available > 0 ? (
                <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <CheckCircle className="h-4 w-4 mr-1" /> Disponible: {available} unid.
                </span>
              ) : (
                <span className="flex items-center text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Sin Stock
                </span>
              )}
            </div>

            <p className="text-gray-600 text-base leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Pricing & Actions */}
            <div className="space-y-4">
              {/* Unit Option */}
              <div className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 transition-colors bg-gray-50/50">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase">Precio Unitario</span>
                    <span className="text-2xl font-black text-teal-700">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
                <button
                  onClick={() => onAddToCart(product, 'UNIT')}
                  disabled={available <= 0}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    available > 0 
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 active:scale-[0.98]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Agregar Unidad
                </button>
              </div>

              {/* Box Option */}
              {hasBox && product.boxPrice && (
                <div className="p-4 border border-blue-100 rounded-xl bg-blue-50/30 hover:border-blue-300 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    MEJOR PRECIO
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase mb-1">
                        <Package className="h-3 w-3" /> Caja x{product.unitsPerBox}
                      </span>
                      <span className="text-2xl font-black text-blue-700">${product.boxPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddToCart(product, 'BOX')}
                    disabled={available < unitsPerBox}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                      available >= unitsPerBox
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-[0.98]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    Agregar Caja
                  </button>
                  {available < unitsPerBox && available > 0 && (
                    <p className="text-xs text-center text-orange-500 mt-2 font-medium">
                      No hay suficientes unidades para una caja completa.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
             <button onClick={onClose} className="text-gray-400 text-sm font-medium hover:text-gray-600">
               Seguir comprando
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;