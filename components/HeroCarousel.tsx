import React, { useState, useRef } from 'react';
import { ShoppingBag, Trash2, Edit, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner, Bundle, Product, User } from '../types';

interface HeroCarouselProps {
  banners: Banner[];
  activeBundles: Bundle[];
  allProducts: Product[];
  isSuperAdmin: boolean;
  handleDeleteBanner: (id: string) => void;
  onOpenAdminPanel: () => void;
  onAddBundle: (b: Bundle) => void;
  currentUser: User | null;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  banners, activeBundles, allProducts, isSuperAdmin, handleDeleteBanner, onOpenAdminPanel, onAddBundle, currentUser
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalSlides = banners.length + activeBundles.length;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };

  if (banners.length === 0 && activeBundles.length === 0) {
    return (
      <div className="bg-teal-700 rounded-3xl p-8 md:p-16 text-white shadow-xl relative overflow-hidden min-h-[300px] flex items-center">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Bienvenido {currentUser ? `, ${currentUser.displayName.split(' ')[0]}` : 'a Vitalis'}
          </h2>
          <p className="text-teal-100 text-lg md:text-xl opacity-90 leading-relaxed">
            Tu salud es nuestra prioridad. Ecuentra los mejores precios en Vitalis.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4 hidden md:block">
          <ShoppingBag size={500} />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12 relative group">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full overflow-x-auto snap-x snap-mandatory flex rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] no-scrollbar h-[350px] md:h-[450px] bg-slate-900"
      >
        {/* Banners Normales */}
        {banners.map(b => (
          <div key={b.id} className="snap-center min-w-full relative shrink-0 overflow-hidden group/slide">
            <img 
              src={b.image} 
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover/slide:scale-110" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-16">
              {b.title && (
                <div className="max-w-4xl animate-in slide-in-from-bottom-8 duration-1000">
                  <h3 className="text-white font-black text-2xl md:text-5xl leading-[0.95] mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] tracking-tighter">
                    {b.title}
                  </h3>
                </div>
              )}
            </div>
            {isSuperAdmin && (
              <div className="absolute top-6 right-6 md:top-8 md:right-8 flex gap-2">
                <button 
                  onClick={() => handleDeleteBanner(b.id)} 
                  className="bg-white/10 backdrop-blur-xl p-3 md:p-4 rounded-2xl text-white hover:bg-red-500 transition-all shadow-2xl border border-white/20"
                >
                  <Trash2 size={18} className="md:w-[22px] md:h-[22px]"/>
                </button>
              </div>
            )}
          </div>
        ))}
        
        {/* Banners de Combos Dinámicos */}
        {activeBundles.map(bundle => {
          const originalPrice = bundle.productIds.reduce((sum, pid) => {
            const p = allProducts.find(x => x.id === pid);
            return sum + (p?.price || 0);
          }, 0);
          return (
            <div key={bundle.id} className="snap-center min-w-full relative shrink-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-900 flex items-center p-6 md:p-16 overflow-hidden">
              <div className="relative z-10 w-full md:w-3/5">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <span className="bg-yellow-400 text-yellow-950 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(250,204,21,0.3)]">
                    Combo Vitalis
                  </span>
                  <div className="h-0.5 w-8 md:h-1 md:w-12 bg-white/30 rounded-full"></div>
                  <span className="text-white/80 text-[8px] md:text-xs font-bold uppercase tracking-widest">
                    Promoción
                  </span>
                </div>
                
                <h3 className="text-white font-black text-2xl md:text-5xl leading-[0.9] mb-4 md:mb-6 tracking-tighter drop-shadow-2xl">
                  {bundle.name}
                </h3>
                <p className="text-indigo-100 text-[10px] md:text-lg mb-6 md:mb-10 line-clamp-2 md:line-clamp-2 opacity-90 max-w-2xl leading-relaxed font-medium">
                  {bundle.description}
                </p>
                
                <div className="flex items-center gap-4 md:gap-10 mb-6 md:mb-12">
                  <div className="flex flex-col">
                    <span className="text-indigo-300 text-[10px] md:text-lg line-through font-bold opacity-50 mb-0.5">Antes: ${originalPrice.toFixed(2)}</span>
                    <span className="text-white text-3xl md:text-7xl font-black tracking-tighter leading-none drop-shadow-2xl">
                      ${bundle.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-2xl border border-white/20 px-4 py-3 md:px-8 md:py-4 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
                    <p className="text-[8px] md:text-xs font-black uppercase opacity-60 tracking-[0.2em] mb-0.5">Ahorras</p>
                    <p className="text-lg md:text-3xl font-black text-yellow-400 tracking-tighter">${(originalPrice - bundle.price).toFixed(2)}</p>
                  </div>
                </div>

                <button 
                  onClick={() => onAddBundle(bundle)}
                  className="w-fit bg-white text-indigo-800 px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-lg flex items-center justify-center gap-2 md:gap-3 hover:bg-yellow-400 hover:text-yellow-950 transition-all shadow-xl active:scale-95 group/btn"
                >
                  <ShoppingBag className="w-4 h-4 md:w-6 md:h-6 group-hover/btn:scale-110 transition-transform" /> 
                  LO QUIERO AHORA
                </button>
              </div>
              
              {/* Decoración Visual */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 hidden lg:flex items-center justify-center">
                <div className="relative">
                  <Package size={350} className="text-white/10 transform rotate-12 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-64 h-64 bg-yellow-400/20 rounded-full blur-[100px]"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>
            </div>
          );
        })}
      </div>

      {/* Navegación - Flechas (Solo Desktop) */}
      {totalSlides > 1 && (
        <>
          <button 
            onClick={() => scrollToSlide(activeIndex - 1)}
            disabled={activeIndex === 0}
            className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl z-20 hidden md:flex items-center justify-center ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <button 
            onClick={() => scrollToSlide(activeIndex + 1)}
            disabled={activeIndex === totalSlides - 1}
            className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl z-20 hidden md:flex items-center justify-center ${activeIndex === totalSlides - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </>
      )}

      {/* Indicadores (Dots) */}
      {totalSlides > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToSlide(i)}
              className={`h-1.5 transition-all duration-300 rounded-full ${i === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}

      {isSuperAdmin && (
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onOpenAdminPanel} 
            className="text-xs bg-slate-100 text-slate-700 px-4 py-2 rounded-full font-black flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-sm"
          >
            <Edit size={14}/> CONFIGURAR BANNERS
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
