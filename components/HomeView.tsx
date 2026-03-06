import React from 'react';
import { ShoppingBag, Camera, Stethoscope } from 'lucide-react';
import { Banner, Category, Product, CartItem, User, Bundle, BlogPost } from '../types';
import ProductCard from './ProductCard';
import HeroCarousel from './HeroCarousel';
import DeliveryInfo from './DeliveryInfo';
import PromotionsSection from './PromotionsSection';
import SearchResults from './SearchResults';
import ProductSection from './ProductSection';
import CategoryPills from './CategoryPills';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HomeViewProps {
  banners: Banner[];
  categories: Category[];
  bundles: Bundle[];
  blogPosts: BlogPost[];
  activeCategory: string | null;
  setActiveCategory: React.Dispatch<React.SetStateAction<string | null>>;
  displayedProducts: Product[];
  allProducts: Product[];
  searchTerm: string;
  currentUser: User | null;
  isSuperAdmin: boolean;
  handleDeleteBanner: (id: string) => void;
  onOpenAdminPanel: () => void;
  onOpenPrescription: () => void;
  onOpenServices: () => void;
  onAddToCart: (p: Product, unit?: 'UNIT' | 'BOX') => void;
  onAddBundle: (b: Bundle) => void;
  onSelectProduct: (p: Product | null) => void;
  onTabChange: (tab: any) => void;
  cart: CartItem[];
}

const HomeView: React.FC<HomeViewProps> = ({
  banners, categories, bundles, blogPosts, activeCategory, setActiveCategory, displayedProducts, allProducts, searchTerm, currentUser, 
  isSuperAdmin, handleDeleteBanner, onOpenAdminPanel, onOpenPrescription, onOpenServices, onAddToCart, onAddBundle, onSelectProduct, onTabChange, cart
}) => {
  const categoryName = activeCategory ? categories.find(c => c.id === activeCategory)?.name || '' : '';

  // Lógica de horario de servicio: Activo de 7:00 a 21:00
  const now = new Date();
  const currentHour = now.getHours();
  const isServiceActive = currentHour >= 7 && currentHour < 21;

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
      {!searchTerm && (
        <CategoryPills 
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      )}

      {activeCategory ? (
        <div className="animate-in fade-in">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded text-lg mr-3">{categoryName}</span> Productos
          </h3>
          {displayedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay productos aquí.</p>
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
        <div className="animate-in fade-in">
          {!searchTerm && (
            <HeroCarousel 
              banners={banners}
              activeBundles={activeBundles}
              allProducts={allProducts}
              isSuperAdmin={isSuperAdmin}
              handleDeleteBanner={handleDeleteBanner}
              onOpenAdminPanel={onOpenAdminPanel}
              onAddBundle={onAddBundle}
              currentUser={currentUser}
            />
          )}

          {!searchTerm && <DeliveryInfo isServiceActive={isServiceActive} />}

          {!searchTerm && blogPosts.length > 0 && (
            <div className="mb-8 px-1">
              <div 
                onClick={() => onTabChange('wellness')}
                className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl p-6 text-white shadow-xl shadow-teal-900/20 cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-teal-200" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200">Consejo del Día</span>
                    </div>
                    <h4 className="text-xl font-black leading-tight mb-2 group-hover:text-teal-100 transition-colors">
                      {blogPosts[0].title}
                    </h4>
                    <p className="text-teal-50/80 text-sm line-clamp-2 font-medium">
                      {blogPosts[0].content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md group-hover:bg-white/30 transition-all">
                    Leer Bienestar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!searchTerm && (
            <PromotionsSection 
              activeBundles={activeBundles}
              allProducts={allProducts}
              onAddBundle={onAddBundle}
            />
          )}

          {!searchTerm && (
            <div className="mb-12 flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={onOpenPrescription} className="flex-1 bg-white border-2 border-teal-500 text-teal-700 hover:bg-teal-50 px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105 active:scale-95"><Camera className="h-6 w-6" /> Subir Receta Médica</button>
              <button onClick={onOpenServices} className="flex-1 bg-white border-2 border-blue-500 text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105 active:scale-95"><Stethoscope className="h-6 w-6" /> Consultorio / Servicios</button>
            </div>
          )}

          {!searchTerm && !activeCategory && (
            <div className="space-y-4">
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
          )}

          {searchTerm && (
            <SearchResults 
              searchTerm={searchTerm}
              displayedProducts={displayedProducts}
              suggestedProducts={suggestedProducts}
              cart={cart}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HomeView;
