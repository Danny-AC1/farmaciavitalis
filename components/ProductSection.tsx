
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Product, CartItem } from '../types';
import ProductCard from './ProductCard';

interface ProductSectionProps {
  title: string;
  products: Product[];
  cart: CartItem[];
  onAddToCart: (p: Product, unit?: 'UNIT' | 'BOX') => void;
  onSelectProduct: (p: Product) => void;
  onViewMore: () => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({ 
  title, products, cart, onAddToCart, onSelectProduct, onViewMore 
}) => {
  if (products.length === 0) return null;

  return (
    <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 bg-teal-600 rounded-full"></div>
          <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        </div>
        <button 
          onClick={onViewMore}
          className="flex items-center gap-1 text-teal-600 font-bold text-xs md:text-sm hover:text-teal-800 transition-colors group"
        >
          Ver todo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {products.slice(0, 4).map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            cart={cart} 
            onAddToCart={onAddToCart} 
            onSelect={onSelectProduct} 
          />
        ))}
      </div>
    </section>
  );
};

export default ProductSection;
