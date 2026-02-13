
import React from 'react';
import { Plus } from 'lucide-react';
import { Product, CartItem } from '../types';

interface ProductCardProps {
  product: Product;
  cart: CartItem[];
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  onSelect: (product: Product) => void;
}

const getReservedStock = (productId: string, currentCart: CartItem[]) => {
  return currentCart.reduce((acc, item) => {
    if (item.id !== productId) return acc;
    const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
    return acc + (item.quantity * unitsPerItem);
  }, 0);
};

const ProductCard: React.FC<ProductCardProps> = ({ product, cart, onAddToCart, onSelect }) => {
  const reserved = getReservedStock(product.id, cart);
  const available = Math.max(0, product.stock - reserved);
  
  return (
      <div 
          onClick={() => onSelect(product)}
          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer group transform hover:-translate-y-1"
      >
          <div className="h-32 md:h-48 bg-gray-50 overflow-hidden relative">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 mix-blend-multiply" />
              {available <= 0 && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-red-500 text-white px-2 py-1 text-[10px] md:text-xs font-bold rounded shadow-lg transform -rotate-6">AGOTADO</span>
              </div>
              )}
          </div>
          <div className="p-3 md:p-5 flex flex-col flex-grow relative">
              <div className="flex-grow">
                  <h4 className="font-bold text-sm md:text-lg text-gray-900 mb-1 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">{product.name}</h4>
                  <p className="text-[10px] md:text-sm text-gray-500 line-clamp-1 md:line-clamp-2 mb-2 md:mb-3">{product.description}</p>
              </div>
              
              <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-100 space-y-2 md:space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                      <span className="text-base md:text-lg font-black text-teal-700">${product.price.toFixed(2)}</span>
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product, 'UNIT');
                          }}
                          disabled={available <= 0}
                          className={`p-1.5 md:px-3 md:py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1 ${available > 0 ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                          <Plus className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden md:inline">Agregar</span>
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

export default ProductCard;
