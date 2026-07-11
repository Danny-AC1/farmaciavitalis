import React from 'react';
import { ShoppingBag, Camera, Stethoscope, X } from 'lucide-react';
import { Category, Product, CartItem, Bundle } from '../../types';
import ProductCard from './ProductCard';
import PromotionsSection from './PromotionsSection';
import SearchResults from './SearchResults';
import ProductSection from './ProductSection';
import CategoryNavigation from './CategoryNavigation';

interface HomeViewProps {
  categories: Category[];
  bundles: Bundle[];
  activeCategory: string | null;
  setActiveCategory: React.Dispatch<React.SetStateAction<string | null>>;
  displayedProducts: Product[];
  allProducts: Product[];
  searchTerm: string;
  onOpenPrescription: () => void;
  onOpenServices: () => void;
  onAddToCart: (p: Product, unit?: 'UNIT' | 'BOX') => void;
  onAddBundle: (b: Bundle) => void;
  onSelectProduct: (p: Product | null) => void;
  cart: CartItem[];
}

const HomeView: React.FC<HomeViewProps> = ({
  categories, bundles, activeCategory, setActiveCategory, displayedProducts, allProducts, searchTerm, 
  onOpenPrescription, onOpenServices, onAddToCart, onAddBundle, onSelectProduct, cart
}) => {
  const categoryName = activeCategory ? categories.find(c => c.id === activeCategory)?.name || '' : '';

  // Productos sugeridos (aleatorios o los primeros 4 que tengan stock)
  const suggestedProducts = React.useMemo(() => {
    return [...allProducts]
      .filter(p => p.stock > 0)
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, [allProducts]);

  // Combos activos para mostrar en el carrusel
  const activeBundles = React.useMemo(() => bundles.filter(b => b.active), [bundles]);

  return (
    <div className="animate-in fade-in">
      {searchTerm ? (
        <SearchResults 
          searchTerm={searchTerm}
          displayedProducts={displayedProducts}
          suggestedProducts={suggestedProducts}
          cart={cart}
          onAddToCart={onAddToCart}
          onSelectProduct={onSelectProduct}
        />
      ) : (
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
          {/* Columna Izquierda: Sidebar para desktop */}
          <CategoryNavigation 
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            allProducts={allProducts}
          />
          
          {/* Columna Derecha: Contenido Principal */}
          <div className="min-w-0">
            {/* Si hay categoría seleccionada, mostramos la grilla de productos correspondientes */}
            {activeCategory ? (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                    <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-xl text-sm md:text-base border border-teal-100">
                      {categoryName}
                    </span>
                    <span className="text-slate-400 font-medium text-sm md:text-base">
                      ({displayedProducts.length} productos)
                    </span>
                  </h3>
                  
                  {/* Botón para volver al catálogo general */}
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="text-xs font-black text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100/80 px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <X size={14} />
                    <span>Ver Todo</span>
                  </button>
                </div>

                {displayedProducts.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <ShoppingBag className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-lg">No hay productos en esta categoría.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {displayedProducts.map(product => (
                      <ProductCard key={product.id} product={product} cart={cart} onAddToCart={onAddToCart} onSelect={onSelectProduct} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in duration-300 space-y-6">
                {/* Botones de Receta y Servicios */}
                <div className="flex flex-row gap-3 md:gap-4">
                  <button 
                    onClick={onOpenPrescription} 
                    className="flex-1 bg-white border border-slate-150 hover:border-teal-200 text-slate-800 hover:text-teal-900 px-3.5 py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 md:gap-3 font-extrabold text-xs md:text-base transition-all hover:scale-[1.02] active:scale-95 min-w-0"
                    title="Subir Receta Médica"
                  >
                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                      <Camera size={18} className="shrink-0" />
                    </div>
                    <span className="truncate">Subir Receta</span>
                  </button>
                  
                  <button 
                    onClick={onOpenServices} 
                    className="flex-1 bg-white border border-slate-150 hover:border-blue-200 text-slate-800 hover:text-blue-900 px-3.5 py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 md:gap-3 font-extrabold text-xs md:text-base transition-all hover:scale-[1.02] active:scale-95 min-w-0"
                    title="Consultas y Servicios"
                  >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Stethoscope size={18} className="shrink-0" />
                    </div>
                    <span className="truncate">Servicios</span>
                  </button>
                </div>

                {/* Sección de Promociones / Combos */}
                <PromotionsSection 
                  activeBundles={activeBundles}
                  allProducts={allProducts}
                  onAddBundle={onAddBundle}
                />

                {/* Listado de todas las categorías en scroll vertical ordenado */}
                <div className="space-y-6">
                  {categories.map(category => {
                    const categoryProducts = allProducts.filter(p => p.category === category.name);
                    return (
                      <ProductSection 
                        key={category.id}
                        title={category.name}
                        products={categoryProducts}
                        cart={cart}
                        onAddToCart={onAddToCart}
                        onSelectProduct={onSelectProduct}
                        onViewMore={() => setActiveCategory(category.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
