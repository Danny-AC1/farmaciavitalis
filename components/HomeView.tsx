import React from 'react';
import { ArrowLeft, ShoppingBag, Camera, Stethoscope } from 'lucide-react';
import { Banner, Category, Product, CartItem, User, Bundle } from '../types';
import ProductCard from './ProductCard';
import BlogSection from './BlogSection';
import HeroCarousel from './HeroCarousel';
import DeliveryInfo from './DeliveryInfo';
import PromotionsSection from './PromotionsSection';
import CategoryGrid from './CategoryGrid';
import SearchResults from './SearchResults';

interface HomeViewProps {
  banners: Banner[];
  categories: Category[];
  bundles: Bundle[];
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
  cart: CartItem[];
}

const HomeView: React.FC<HomeViewProps> = ({
  banners, categories, bundles, activeCategory, setActiveCategory, displayedProducts, allProducts, searchTerm, currentUser, 
  isSuperAdmin, handleDeleteBanner, onOpenAdminPanel, onOpenPrescription, onOpenServices, onAddToCart, onAddBundle, onSelectProduct, cart
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
      {activeCategory ? (
        <div className="animate-in fade-in">
          <button onClick={() => setActiveCategory(null)} className="flex items-center text-teal-600 font-bold mb-6 hover:text-teal-800 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-1" /> Volver a Categorías
          </button>
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
              <button onClick={onOpenServices} className="flex-1 bg-white border-2 border-blue-500 text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105 active:scale-95"><Stethoscope className="h-6 w-6" /> Servicios</button>
            </div>
          )}

          {!searchTerm && (
            <CategoryGrid 
              categories={categories}
              setActiveCategory={setActiveCategory}
            />
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

          {!searchTerm && !activeCategory && (
            <BlogSection isAuthorized={isSuperAdmin} onOpenAdminPanel={onOpenAdminPanel} />
          )}
        </div>
      )}
    </div>
  );
};

export default HomeView;
