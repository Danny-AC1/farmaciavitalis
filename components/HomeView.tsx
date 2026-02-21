import React from 'react';
import { ArrowLeft, ShoppingBag, Pill, Sun, BriefcaseMedical, Sparkles, Baby, HeartPulse, Activity, Camera, Stethoscope, Edit, Trash2, Truck, MapPin } from 'lucide-react';
import { Banner, Category, Product, CartItem, User } from '../types';
import ProductCard from './ProductCard';
import BlogSection from './BlogSection';

interface HomeViewProps {
  banners: Banner[];
  categories: Category[];
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
  onSelectProduct: (p: Product | null) => void;
  cart: CartItem[];
}

const getCategoryStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('medicamento') || n.includes('farmacia')) return { icon: Pill, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', accent: 'bg-blue-200' };
  if (n.includes('vitamina') || n.includes('suplemento')) return { icon: Sun, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', accent: 'bg-orange-200' };
  if (n.includes('auxilio') || n.includes('herida')) return { icon: BriefcaseMedical, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', accent: 'bg-red-200' };
  if (n.includes('cuidado') || n.includes('personal') || n.includes('piel')) return { icon: Sparkles, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', accent: 'bg-purple-200' };
  if (n.includes('bebé') || n.includes('materno')) return { icon: Baby, bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', accent: 'bg-pink-200' };
  if (n.includes('sexual') || n.includes('intimo')) return { icon: HeartPulse, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-200' };
  return { icon: Activity, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', accent: 'bg-teal-200' };
};

const HomeView: React.FC<HomeViewProps> = ({
  banners, categories, activeCategory, setActiveCategory, displayedProducts, allProducts, searchTerm, currentUser, 
  isSuperAdmin, handleDeleteBanner, onOpenAdminPanel, onOpenPrescription, onOpenServices, onAddToCart, onSelectProduct, cart
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
            <div className="mb-8 relative">
              {banners.length > 0 ? (
                <div className="w-full overflow-x-auto snap-x snap-mandatory flex rounded-2xl shadow-xl no-scrollbar h-48 md:h-64 bg-teal-800">
                  {banners.map(b => (
                    <div key={b.id} className="snap-center min-w-full relative shrink-0 group">
                      <img src={b.image} className="w-full h-full object-cover" />
                      {b.title && <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4"><h3 className="text-white font-bold text-xl md:text-3xl">{b.title}</h3></div>}
                      {isSuperAdmin && (
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDeleteBanner(b.id)} className="bg-white/90 p-2 rounded-full text-red-500 hover:bg-white shadow-lg"><Trash2 size={18}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-teal-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10"><h2 className="text-4xl font-extrabold mb-4">Bienvenido {currentUser ? `, ${currentUser.displayName.split(' ')[0]}` : 'a Vitalis'}</h2><p className="text-teal-100 text-lg max-w-xl">Encuentra todo lo que necesitas para tu salud en Machalilla.</p></div>
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4"><ShoppingBag size={300} /></div>
                </div>
              )}
              {isSuperAdmin && (
                <div className="mt-2 flex justify-end">
                  <button onClick={onOpenAdminPanel} className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-teal-200"><Edit size={12}/> Administrar Banners</button>
                </div>
              )}
            </div>
          )}

          {/* MENSAJE ELEGANTE DE ENTREGA A DOMICILIO - Optimizado en tamaño */}
          {!searchTerm && (
            <div className="bg-white rounded-[1.5rem] p-4 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-slate-900 p-3 rounded-[1rem] text-teal-400 shadow-lg group-hover:rotate-3 transition-transform duration-300">
                        <Truck size={22} strokeWidth={2.5}/>
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-teal-600 uppercase tracking-[0.2em] mb-0.5">Servicio Express</p>
                        <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight leading-none">
                            Entrega a domicilio <span className="text-teal-600 italic font-serif">"Machalilla"</span>
                        </h3>
                    </div>
                </div>
                
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border relative z-10 transition-colors ${isServiceActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <div className="relative flex h-2 w-2 mt-0.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isServiceActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isServiceActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.05em] leading-tight">
                            {isServiceActive ? 'Cobertura Total Activa' : 'Cobertura Inactiva'}
                        </span>
                        <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter leading-tight mt-0.5">
                            {isServiceActive ? 'Horario: 08:00 AM - 09:00 PM' : 'Iniciamos a las 08:00 AM'}
                        </span>
                    </div>
                </div>

                {/* Decoración de fondo */}
                <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 pointer-events-none group-hover:scale-105 transition-transform duration-700">
                    <MapPin size={100} strokeWidth={1} />
                </div>
            </div>
          )}

          {!searchTerm && (
            <div className="mb-12 flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={onOpenPrescription} className="flex-1 bg-white border-2 border-teal-500 text-teal-700 hover:bg-teal-50 px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105 active:scale-95"><Camera className="h-6 w-6" /> Subir Receta Médica</button>
              <button onClick={onOpenServices} className="flex-1 bg-white border-2 border-blue-500 text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-xl shadow-md flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-105 active:scale-95"><Stethoscope className="h-6 w-6" />Servicios</button>
            </div>
          )}

          {!searchTerm && (
            <>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-teal-500 pl-4">Nuestras Categorías</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {categories.map(category => { 
                  const style = getCategoryStyle(category.name); 
                  return (
                    <div key={category.id} onClick={() => setActiveCategory(category.id)} className={`cursor-pointer ${style.bg} border ${style.border} rounded-2xl p-4 md:p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-95 flex flex-col justify-between h-32 md:h-40 relative overflow-hidden group`}>
                      <div className="relative z-10">
                        <div className={`p-2 rounded-xl w-fit mb-3 ${style.accent} bg-opacity-50`}><style.icon className={`h-6 w-6 md:h-8 md:w-8 ${style.text}`} /></div>
                        <h4 className={`font-bold text-sm md:text-lg ${style.text}`}>{category.name}</h4>
                      </div>
                      <style.icon className={`absolute -right-4 -bottom-4 h-24 w-24 ${style.text} opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500`} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {searchTerm && (
            <div className="animate-in slide-in-from-bottom-5 duration-500">
              <h3 className="text-2xl font-bold mb-6 border-l-4 pl-4 text-gray-800 border-teal-500">
                {displayedProducts.length > 0 ? 'Resultados' : 'Sin resultados'}
              </h3>
              {displayedProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-12">
                  {displayedProducts.map(product => (<ProductCard key={product.id} product={product} cart={cart} onAddToCart={onAddToCart} onSelect={onSelectProduct} />))}
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