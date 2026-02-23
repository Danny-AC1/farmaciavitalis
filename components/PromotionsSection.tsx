import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { Bundle, Product } from '../types';

interface PromotionsSectionProps {
  activeBundles: Bundle[];
  allProducts: Product[];
  onAddBundle: (b: Bundle) => void;
}

const PromotionsSection: React.FC<PromotionsSectionProps> = ({ activeBundles, allProducts, onAddBundle }) => {
  if (activeBundles.length === 0) return null;

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-purple-500 pl-4 flex items-center gap-2">
        <Sparkles className="text-purple-500" /> Promociones y Combos
      </h3>
      <div className="flex overflow-x-auto pb-6 gap-6 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
        {activeBundles.map(bundle => {
          const originalPrice = bundle.productIds.reduce((sum, pid) => {
            const p = allProducts.find(x => x.id === pid);
            return sum + (p?.price || 0);
          }, 0);
          return (
            <div key={bundle.id} className="min-w-[85vw] md:min-w-0 bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group snap-center">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {bundle.category || 'Ahorro'}
                  </span>
                  <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black">
                    -{Math.round((1 - bundle.price / originalPrice) * 100)}% OFF
                  </div>
                </div>
                
                <h4 className="text-xl font-black text-gray-900 mb-2">{bundle.name}</h4>
                <p className="text-xs text-gray-500 mb-6 line-clamp-2">{bundle.description}</p>
                
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Productos incluidos:</p>
                  {bundle.productIds.map(pid => {
                    const p = allProducts.find(x => x.id === pid);
                    return (
                      <div key={pid} className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="font-medium">{p?.name || pid}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 border-t border-purple-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 line-through font-bold">Precio normal: ${originalPrice.toFixed(2)}</p>
                  <p className="text-2xl font-black text-purple-700">${bundle.price.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => onAddBundle(bundle)}
                  className="bg-purple-600 text-white p-3 rounded-2xl hover:bg-purple-700 transition shadow-lg active:scale-90 group-hover:scale-110"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PromotionsSection;
