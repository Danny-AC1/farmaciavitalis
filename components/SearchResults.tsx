import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { Product, CartItem } from '../types';
import ProductCard from './ProductCard';

interface SearchResultsProps {
  searchTerm: string;
  displayedProducts: Product[];
  suggestedProducts: Product[];
  cart: CartItem[];
  onAddToCart: (p: Product, unit?: 'UNIT' | 'BOX') => void;
  onSelectProduct: (p: Product | null) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchTerm, displayedProducts, suggestedProducts, cart, onAddToCart, onSelectProduct
}) => {
  return (
    <div className="animate-in slide-in-from-bottom-5 duration-500">
      <h3 className="text-2xl font-bold mb-6 border-l-4 pl-4 text-gray-800 border-teal-500">
        {displayedProducts.length > 0 ? 'Resultados' : 'Sin resultados'}
      </h3>
      {displayedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-12">
          {displayedProducts.map(product => (
            <ProductCard key={product.id} product={product} cart={cart} onAddToCart={onAddToCart} onSelect={onSelectProduct} />
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in">
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 mb-12">
            <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No encontramos productos con "{searchTerm}"</p>
            <p className="text-gray-400 text-sm">Prueba con otros términos o revisa nuestras sugerencias abajo.</p>
          </div>
          
          {suggestedProducts.length > 0 && (
            <div className="mb-12">
              <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Sparkles className="text-yellow-500 h-5 w-5" />
                Productos que te podrían interesar
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {suggestedProducts.map(product => (
                  <ProductCard key={product.id} product={product} cart={cart} onAddToCart={onAddToCart} onSelect={onSelectProduct} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
